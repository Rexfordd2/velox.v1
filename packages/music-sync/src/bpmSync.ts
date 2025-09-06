// Upgraded music sync engine with dynamic BPM tracking, predictive beats, and rhythm scoring

export type Beat = { t: number; bpm: number; confidence: number };
export type RepHit = { t: number; phase: 'concentric' | 'eccentric' | 'isometric'; score: number };

type VelSample = { t: number; v: number };

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function ema(series: number[], alpha: number): number[] {
  if (series.length === 0) return [];
  const out = new Array(series.length);
  out[0] = series[0];
  for (let i = 1; i < series.length; i++) {
    out[i] = alpha * series[i] + (1 - alpha) * out[i - 1];
  }
  return out;
}

function movingAvg(series: number[], window: number): number[] {
  if (window <= 1) return [...series];
  const out = new Array(series.length).fill(0);
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i];
    if (i >= window) sum -= series[i - window];
    out[i] = sum / Math.min(i + 1, window);
  }
  return out;
}

function diff(series: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) out.push(series[i] - series[i - 1]);
  return out;
}

function localMaxima(values: number[], times: number[], minSeparationMs: number, threshold: number): number[] {
  // Return indices of local maxima passing threshold and separation
  const idxs: number[] = [];
  let lastT = -Infinity;
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] > threshold && values[i] >= values[i - 1] && values[i] >= values[i + 1]) {
      const t = times[i];
      if (t - lastT >= minSeparationMs) {
        idxs.push(i);
        lastT = t;
      }
    }
  }
  return idxs;
}

function norm(series: number[]): number[] {
  const max = Math.max(1e-9, Math.max(...series.map(x => Math.abs(x))));
  return series.map(x => x / max);
}

function robustThreshold(series: number[], k = 1.0): number {
  // median + k * MAD
  const sorted = [...series].sort((a, b) => a - b);
  const m = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const devs = series.map(x => Math.abs(x - m)).sort((a, b) => a - b);
  const mad = devs[Math.floor(devs.length / 2)] ?? 1e-6;
  return m + k * mad;
}

function ioiErrorToScore(ioiMs: number, bpm: number): number {
  const period = 60000 / bpm; // ms per beat
  // distance to nearest k*period
  const k = Math.max(1, Math.round(ioiMs / period));
  const expect = k * period;
  const err = Math.abs(ioiMs - expect);
  const sigma = Math.max(20, period * 0.05); // allow 5% error or 20 ms
  return Math.exp(-Math.pow(err / sigma, 2));
}

class DynamicBpmTracker {
  private bpmGrid: number[];
  private scores: number[];
  private decay = 0.97;
  private lastOnset: number | null = null;

  constructor(minBpm = 60, maxBpm = 180, step = 1) {
    this.bpmGrid = [];
    for (let b = minBpm; b <= maxBpm; b += step) this.bpmGrid.push(b);
    this.scores = new Array(this.bpmGrid.length).fill(1e-3);
  }

  addOnset(tMs: number) {
    if (this.lastOnset == null) { this.lastOnset = tMs; return; }
    const ioi = tMs - this.lastOnset;
    this.lastOnset = tMs;
    for (let i = 0; i < this.bpmGrid.length; i++) {
      const bpm = this.bpmGrid[i];
      const like = ioiErrorToScore(ioi, bpm);
      this.scores[i] = this.scores[i] * this.decay + like;
    }
    // Mild smoothing to neighbors (Viterbi-like transition preference)
    const smoothed = new Array(this.scores.length).fill(0);
    for (let i = 0; i < this.scores.length; i++) {
      const w0 = 0.6, w1 = 0.2, w2 = 0.1;
      smoothed[i] = w0 * this.scores[i]
        + w1 * (this.scores[i - 1] ?? this.scores[i])
        + w1 * (this.scores[i + 1] ?? this.scores[i])
        + w2 * (this.scores[i - 2] ?? this.scores[i])
        + w2 * (this.scores[i + 2] ?? this.scores[i]);
    }
    this.scores = smoothed;
  }

  current(): { bpm: number; confidence: number } {
    const maxScore = Math.max(...this.scores);
    let num = 0, den = 0;
    for (let i = 0; i < this.scores.length; i++) { num += this.bpmGrid[i] * this.scores[i]; den += this.scores[i]; }
    const bpm = den > 0 ? num / den : 0;
    const confidence = clamp01(maxScore / (den / Math.max(1, this.scores.length)));
    return { bpm, confidence };
  }
}

function detectOnsets(samples: VelSample[]): { indices: number[]; strength: number[] } {
  const times = samples.map(s => s.t);
  const v = samples.map(s => s.v);
  const energy = v.map(x => x * x);
  const energyMA = movingAvg(energy, 9);
  const energyDelta = energy.map((e, i) => e - (energyMA[i] ?? 0));
  const flux = diff(v).map(x => Math.max(0, x));
  const fluxPadded = [0, ...flux];
  const energyN = norm(energyDelta);
  const fluxN = norm(fluxPadded);
  const onsetScore = energyN.map((e, i) => 0.7 * e + 0.3 * fluxN[i]);
  const thresh = robustThreshold(onsetScore, 1.5);
  let idxs = localMaxima(onsetScore, times, 90, thresh); // min 90 ms separation
  // Fallback: use abs(v) peaks if too few onsets
  if (idxs.length < Math.max(4, Math.floor(samples.length / 200))) {
    const absV = v.map(x => Math.abs(x));
    const absSm = ema(absV, 0.2);
    const vth = robustThreshold(absSm, 0.5);
    idxs = localMaxima(absSm, times, 120, vth * 0.8);
    if (idxs.length < 4) {
      // Final fallback: zero-crossing rising edge timestamps
      const zc: number[] = [];
      for (let i = 1; i < v.length; i++) {
        if (v[i - 1] <= 0 && v[i] > 0) zc.push(i);
      }
      idxs = zc;
    }
  }
  const strengths = idxs.map(i => onsetScore[i] ?? 0.5);
  return { indices: idxs, strength: strengths };
}

function classifyPhase(v: number): 'concentric' | 'eccentric' | 'isometric' {
  const eps = 1e-3;
  if (Math.abs(v) < eps) return 'isometric';
  return v > 0 ? 'concentric' : 'eccentric';
}

function predictBeats(recentBeats: Beat[], count = 3): Beat[] {
  if (recentBeats.length < 2) return [];
  // Estimate linear drift on inter-beat intervals
  const ts = recentBeats.map(b => b.t);
  const ibis = [] as number[]; // ms
  for (let i = 1; i < ts.length; i++) ibis.push(ts[i] - ts[i - 1]);
  const n = ibis.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ibis.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - xMean) * (ibis[i] - yMean); den += (xs[i] - xMean) ** 2; }
  const slope = den !== 0 ? num / den : 0; // ms per step
  let lastT = ts[ts.length - 1];
  const lastIBI = ibis[ibis.length - 1] ?? 600;
  const preds: Beat[] = [];
  for (let i = 1; i <= count; i++) {
    const ibi = lastIBI + slope * i;
    const bpm = 60000 / Math.max(200, ibi);
    preds.push({ t: lastT + ibi, bpm, confidence: 0.5 });
    lastT += ibi;
  }
  return preds;
}

function nearestBeat(t: number, beats: Beat[]): { dt: number; beat: Beat | null } {
  if (beats.length === 0) return { dt: Infinity, beat: null };
  let bestDt = Infinity;
  let bestBeat: Beat | null = null;
  for (const b of beats) {
    const d = Math.abs(t - b.t);
    if (d < bestDt) { bestDt = d; bestBeat = b; }
  }
  return { dt: bestDt, beat: bestBeat };
}

function expandBeatGrid(beats: Beat[]): Beat[] {
  if (beats.length < 2) return beats.slice();
  const out: Beat[] = [];
  const pushIfFar = (b: Beat) => {
    for (const x of out) {
      if (Math.abs(x.t - b.t) < 30) return; // avoid duplicates
    }
    out.push(b);
  };
  for (let i = 0; i < beats.length - 1; i++) {
    const a = beats[i];
    const b = beats[i + 1];
    const dt = Math.max(1, b.t - a.t);
    const bpm = 60000 / dt;
    pushIfFar(a);
    // quarter, half, three-quarter subdivisions
    const q1 = a.t + 0.25 * dt;
    const q2 = a.t + 0.5 * dt;
    const q3 = a.t + 0.75 * dt;
    pushIfFar({ t: q1, bpm, confidence: Math.min(a.confidence, b.confidence) * 0.4 });
    pushIfFar({ t: q2, bpm, confidence: Math.min(a.confidence, b.confidence) * 0.5 });
    pushIfFar({ t: q3, bpm, confidence: Math.min(a.confidence, b.confidence) * 0.4 });
  }
  pushIfFar(beats[beats.length - 1]);
  out.sort((x, y) => x.t - y.t);
  return out;
}

export function syncWithBeats(vel: VelSample[]): { reps: RepHit[]; beats: Beat[]; rhythmScore: number; combo: number } {
  if (!vel || vel.length < 3) return { reps: [], beats: [], rhythmScore: 0, combo: 0 };

  // Pre-smooth velocity for robust detection
  const vSm = ema(vel.map(s => s.v), 0.2);
  const samples = vel.map((s, i) => ({ t: s.t, v: vSm[i] }));

  // 1) Onset detection and dynamic BPM tracking
  const { indices: onsetIdxs, strength } = detectOnsets(samples);
  const tracker = new DynamicBpmTracker(60, 190, 1);
  const beats: Beat[] = [];
  const ring: Beat[] = [];
  for (let k = 0; k < onsetIdxs.length; k++) {
    const i = onsetIdxs[k];
    const t = samples[i].t;
    tracker.addOnset(t);
    const cur = tracker.current();
    const conf = clamp01(cur.confidence * (strength[k] ?? 0.5));
    const b: Beat = { t, bpm: cur.bpm, confidence: conf };
    beats.push(b);
    ring.push(b);
    if (ring.length > 8) ring.shift();
    // Predict next 2-4 beats opportunistically
    const preds = predictBeats(ring, 3);
    for (const pb of preds) {
      // Only add if in the future and not duplicating near an existing beat
      if (pb.t > t && nearestBeat(pb.t, beats).dt > 80) beats.push(pb);
    }
  }
  beats.sort((a, b) => a.t - b.t);

  // 2) Rep detection from velocity peaks (proxy)
  const absV = samples.map(s => Math.abs(s.v));
  const absVSm = ema(absV, 0.3);
  const vThresh = robustThreshold(absVSm, 1.0);
  const repIdxs = localMaxima(absVSm, samples.map(s => s.t), 150, vThresh);

  // 3) Rep-beat coupling and per-rep scoring
  const tol = 70; // ms tolerance for on-beat
  const beatGrid = expandBeatGrid(beats);
  let streak = 0;
  const reps: RepHit[] = [];
  for (const idx of repIdxs) {
    const t = samples[idx].t;
    const phase = classifyPhase(samples[idx].v);
    const nb = nearestBeat(t, beatGrid);
    const dt = nb.dt;
    const conf = nb.beat ? nb.beat.confidence : 0.0;
    const weight = 0.55 + 0.45 * clamp01(conf); // 0.55..1.0 based on confidence
    const sigma = tol * 0.6;
    const base = Math.exp(-Math.pow(dt / sigma, 2)) * weight; // Gaussian falloff
    const onBeat = dt <= tol * 0.6; // tighter window for combo
    streak = onBeat ? streak + 1 : 0;
    const combo = 1 + Math.min(0.3, (streak - 1) * 0.06); // cap at 1.3x to reward streaks
    const score = clamp01(base * combo) * 100;
    reps.push({ t, phase, score });
  }

  // 4) Aggregate rhythm score
  const rhythmScore = reps.length ? Math.round(reps.reduce((a, r) => a + r.score, 0) / reps.length) : 0;

  // Simple combo if not implicitly tracked: distance to nearest beat threshold 60ms
  // Here we reuse streak derived above with tol*0.7 ≈ 49ms; adjust to 60ms minimum
  // Compute finalCombo by re-evaluating with 60ms window to meet API
  let finalCombo = 0;
  if (reps.length && beatGrid.length) {
    let s = 0;
    for (const r of reps) {
      const nb = nearestBeat(r.t, beatGrid);
      s = nb.dt < 60 ? s + 1 : 0;
      finalCombo = Math.max(finalCombo, s);
    }
  }

  return { reps, beats, rhythmScore, combo: finalCombo };
}

// ---------- Backward-compatible helpers (legacy) ----------

export interface BeatTiming {
  repIdx: number;
  phase: 'concentric' | 'eccentric';
  diffMs: number;
}

export function syncRepsToBeats(
  repTimestamps: { concentric: number; eccentric: number }[],
  bpm: number
): BeatTiming[] {
  if (!repTimestamps.length || !bpm) return [];
  const beatInterval = (60 / bpm) * 1000;
  // Determine optimal phase offset via circular mean to handle wrap-around near 0/beatInterval
  const allTimes: number[] = [];
  for (const r of repTimestamps) { allTimes.push(r.concentric, r.eccentric); }
  const mods = allTimes.map(t => ((t % beatInterval) + beatInterval) % beatInterval);
  if (mods.length === 0) return [];
  const twoPi = Math.PI * 2;
  let sumSin = 0, sumCos = 0;
  for (const m of mods) {
    const ang = twoPi * (m / beatInterval);
    sumSin += Math.sin(ang);
    sumCos += Math.cos(ang);
  }
  let ang = Math.atan2(sumSin, sumCos);
  if (ang < 0) ang += twoPi;
  const phi = (ang / twoPi) * beatInterval;
  const timing: BeatTiming[] = [];
  for (let i = 0; i < repTimestamps.length; i++) {
    const rep = repTimestamps[i];
    const concBeat = Math.round((rep.concentric - phi) / beatInterval) * beatInterval + phi;
    const eccBeat = Math.round((rep.eccentric - phi) / beatInterval) * beatInterval + phi;
    timing.push({ repIdx: i, phase: 'concentric', diffMs: rep.concentric - concBeat });
    timing.push({ repIdx: i, phase: 'eccentric', diffMs: rep.eccentric - eccBeat });
  }
  return timing;
}

export function calculateTimingScore(timing: BeatTiming[], perfectWindow = 50): number {
  if (!timing.length) return 0;
  let total = 0;
  for (const t of timing) {
    const d = Math.abs(t.diffMs);
    if (d > perfectWindow * 4) continue;
    const s = d <= perfectWindow ? 100 : Math.round(100 * Math.exp(-(d - perfectWindow) / 50));
    total += s;
  }
  return Math.round(total / timing.length);
}