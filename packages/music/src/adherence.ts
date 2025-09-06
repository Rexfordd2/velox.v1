export interface AdherenceOptions {
  bpm: number;
  camLatencyMs?: number;
  audioLatencyMs?: number;
  toleranceMs?: number; // window around beat considered on-time
  beatEpochMs?: number; // reference time (ms) when a downbeat occurs
}

export interface AdherenceResult {
  total: number;
  onTime: number;
  percent: number; // 0-100
  diffsMs: number[]; // signed diff to nearest beat, latency-adjusted
}

/**
 * Compute adherence of event timestamps to musical beats, with latency compensation.
 * Signed diff is negative when early, positive when late.
 */
export function computeBeatAdherence(eventTimestampsMs: number[], opts: AdherenceOptions): AdherenceResult {
  const { bpm, camLatencyMs = 0, audioLatencyMs = 0, toleranceMs = 60, beatEpochMs = 0 } = opts;
  if (!bpm || bpm <= 0) {
    return { total: 0, onTime: 0, percent: 0, diffsMs: [] };
  }
  const beatInterval = 60000 / bpm;
  const diffsMs: number[] = [];

  for (const rawTs of eventTimestampsMs) {
    // Camera and audio latencies push the perceived beat vs detected event
    const adjustedTs = rawTs + camLatencyMs - audioLatencyMs - beatEpochMs;
    // Normalize to [0, beatInterval)
    const mod = ((adjustedTs % beatInterval) + beatInterval) % beatInterval;
    // Choose nearest beat phase and preserve sign
    const distanceToDownbeat = mod;
    const distanceToNextBeat = beatInterval - mod;
    const signed = distanceToDownbeat <= distanceToNextBeat ? distanceToDownbeat : -distanceToNextBeat;
    diffsMs.push(signed);
  }

  const onTime = diffsMs.filter(d => Math.abs(d) <= toleranceMs).length;
  const total = diffsMs.length;
  const percent = total === 0 ? 0 : (onTime / total) * 100;
  return { total, onTime, percent, diffsMs };
}

export class AdherenceTracker {
  private hits: number[] = [];
  private opts: AdherenceOptions;

  constructor(opts: AdherenceOptions) {
    this.opts = { ...opts };
  }

  setBpm(bpm: number) {
    this.opts.bpm = bpm;
  }

  setLatency(camLatencyMs: number, audioLatencyMs: number) {
    this.opts.camLatencyMs = camLatencyMs;
    this.opts.audioLatencyMs = audioLatencyMs;
  }

  recordHit(timestampMs: number) {
    this.hits.push(timestampMs);
  }

  reset() {
    this.hits = [];
  }

  getAdherence(): AdherenceResult {
    return computeBeatAdherence(this.hits, this.opts);
  }
}


