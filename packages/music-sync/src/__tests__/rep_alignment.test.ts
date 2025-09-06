import { describe, it, expect } from 'vitest';
import { alignRepsToBeats } from '../../src/alignRepsToBeats';
import { calculateTimingScore } from '../../src/calculateTimingScore';

type Beat = { timestamp: number; type: 'strong' | 'weak' };
type Rep = { timestamp: number; type: 'concentric' | 'eccentric' };

function genBeatGridRamp(startBpm: number, endBpm: number, durationMs: number): Beat[] {
  const beats: Beat[] = [];
  let t = 0;
  while (t < durationMs) {
    const frac = t / durationMs;
    const bpm = startBpm + (endBpm - startBpm) * frac;
    const interval = 60000 / bpm;
    t += interval;
    if (t <= durationMs) beats.push({ timestamp: Math.round(t), type: 'strong' });
  }
  return beats;
}

function makeDeterministicJitter(seed = 42) {
  let s = seed >>> 0;
  return function jitter(rangeMs: number) {
    // LCG: glibc params
    s = (1103515245 * s + 12345) >>> 0;
    const u = (s & 0x7fffffff) / 0x80000000; // [0,1)
    return (u * 2 - 1) * rangeMs; // [-range, +range)
  };
}

function genRepsFromBeats(beats: Beat[], jitterMs = 0): Rep[] {
  const reps: Rep[] = [];
  const jitter = makeDeterministicJitter(7);
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const j = jitter(jitterMs);
    reps.push({ timestamp: Math.round(b.timestamp + j), type: i % 2 === 0 ? 'concentric' : 'eccentric' });
  }
  return reps;
}

function longestTrueStreak(values: boolean[]): number {
  let best = 0, cur = 0;
  for (const v of values) {
    if (v) { cur += 1; best = Math.max(best, cur); } else { cur = 0; }
  }
  return best;
}

describe('Rep-vs-Beat alignment under BPM ramp with jitter', () => {
  it('achieves high rhythm score and long in-window streaks', () => {
    const beats = genBeatGridRamp(120, 128, 30000); // 30s, 120→128 BPM
    const reps = genRepsFromBeats(beats, 40); // ±40ms jitter

    const timings = alignRepsToBeats(reps as any, beats as any, { camLatency: 0, audioLatency: 0, tolerance: 50 });
    const score = calculateTimingScore(timings, 50); // 0..100
    const rhythmScore = score / 100; // normalize to 0..1

    const streak = longestTrueStreak(timings.map(t => t.inWindow));

    expect(rhythmScore).toBeGreaterThan(0.85);
    expect(streak).toBeGreaterThan(10);
  });
});


