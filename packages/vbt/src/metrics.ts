export type Phase = 'ecc' | 'iso' | 'con';

export interface RepInputs {
  massKg: number;
  barPosM: number[];
  v: number[];
  a: number[];
  ts: number[]; // milliseconds
  phases: Phase[]; // same length as ts
}

export interface RepMetrics {
  meanConVel: number;
  peakConVel: number;
  meanEccVel: number;
  peakEccVel: number;
  mpv: number;
  romM: number;
  tutMs: number;
  powerW: number;
  velLossPct: number; // relative to first rep mean concentric velocity
  est1RM: number | null; // optional; null if unavailable
  lvSlope: number | null; // slope (m/s per kg); negative expected
}

const G = 9.81;

export function computeRepMetrics(inputs: RepInputs): RepMetrics {
  const { massKg, barPosM, v, a, ts, phases } = inputs;
  const n = ts.length;
  if (n === 0 || v.length !== n || a.length !== n || barPosM.length !== n || phases.length !== n) {
    return {
      meanConVel: NaN,
      peakConVel: NaN,
      meanEccVel: NaN,
      peakEccVel: NaN,
      mpv: NaN,
      romM: NaN,
      tutMs: 0,
      powerW: NaN,
      velLossPct: NaN,
      est1RM: null,
      lvSlope: null,
    };
  }

  const conIdx: number[] = [];
  const eccIdx: number[] = [];
  for (let i = 0; i < n; i++) {
    const ph = phases[i];
    if (ph === 'con') conIdx.push(i);
    else if (ph === 'ecc') eccIdx.push(i);
  }

  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : NaN);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : NaN);
  const abs = (x: number) => Math.abs(x);

  const vCon = conIdx.map(i => v[i]);
  const vEccAbs = eccIdx.map(i => abs(v[i]));

  const meanConVel = mean(vCon);
  const peakConVel = max(vCon);
  const meanEccVel = mean(vEccAbs);
  const peakEccVel = max(vEccAbs);

  const mpv = mean(v.filter(x => x > 0));

  const romM = Math.max(...barPosM) - Math.min(...barPosM);
  const tutMs = ts[n - 1] - ts[0];

  let powerW = NaN;
  if (massKg > 0) {
    powerW = 0;
    for (let i = 0; i < n; i++) {
      const forceN = massKg * (G + a[i]);
      const p = forceN * v[i];
      if (p > powerW) powerW = p;
    }
  }

  return {
    meanConVel,
    peakConVel,
    meanEccVel,
    peakEccVel,
    mpv,
    romM,
    tutMs,
    powerW,
    velLossPct: NaN,
    est1RM: null,
    lvSlope: null,
  };
}

/**
 * Compute per-rep metrics for a set and augment with velocity loss %, LV slope and est. 1RM when possible.
 * For LV, performs linear regression of mean concentric velocity vs mass (kg) across reps.
 * Returns per-rep metrics array with shared lvSlope/est1RM populated on each element.
 */
export function computeSetMetrics(reps: RepInputs[]): RepMetrics[] {
  if (!reps.length) return [];
  const perRep = reps.map(r => computeRepMetrics(r));
  // Velocity loss relative to first rep
  const base = perRep[0]?.meanConVel;
  if (isFinite(base) && base > 0) {
    for (const m of perRep) {
      if (isFinite(m.meanConVel)) {
        m.velLossPct = ((base - m.meanConVel) / base) * 100;
      } else {
        m.velLossPct = NaN;
      }
    }
  }

  // LV slope using meanConVel vs mass across reps (requires at least two distinct masses)
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < reps.length; i++) {
    const m = reps[i].massKg;
    const v = perRep[i].meanConVel;
    if (isFinite(m) && isFinite(v)) { xs.push(m); ys.push(v); }
  }
  let slope: number | null = null;
  let intercept: number | null = null;
  if (xs.length >= 2 && new Set(xs).size >= 2) {
    const { slope: s, intercept: b } = linearFit(xs, ys);
    slope = s; intercept = b;
  }

  // Estimate 1RM using velocity threshold (generic 0.15 m/s)
  let est1RM: number | null = null;
  if (slope !== null && intercept !== null && slope !== 0) {
    const vAt1RM = 0.15;
    est1RM = (vAt1RM - intercept) / slope;
  }

  for (const m of perRep) {
    m.lvSlope = slope;
    m.est1RM = est1RM;
  }

  return perRep;
}

function linearFit(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: y[0] ?? 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}


