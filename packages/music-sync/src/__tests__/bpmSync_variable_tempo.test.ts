import { describe, it, expect } from 'vitest';
import { syncWithBeats } from '../../src/bpmSync';

function genVelSeries(): { t: number; v: number }[] {
  // Simulate variable tempo: start 100 BPM → 120 BPM over 20 seconds
  const out: { t: number; v: number }[] = [];
  let t = 0;
  const dt = 10; // ms
  let phase = 0;
  for (let i = 0; i < 2000; i++) {
    const frac = i / 2000;
    const bpm = 100 + 20 * frac;
    const freq = (bpm / 60); // Hz
    phase += 2 * Math.PI * freq * (dt / 1000);
    const v = Math.sin(phase) + 0.15 * Math.sin(3 * phase);
    out.push({ t, v });
    t += dt;
  }
  return out;
}

describe('syncWithBeats - variable tempo tracking', () => {
  it('tracks changing BPM and returns plausible beats', () => {
    const vel = genVelSeries();
    const { beats, reps, rhythmScore } = syncWithBeats(vel);
    expect(beats.length).toBeGreaterThan(10);
    // bpm should be within range 90..140 over the run
    const bpms = beats.map(b => b.bpm);
    const minBpm = Math.min(...bpms);
    const maxBpm = Math.max(...bpms);
    expect(minBpm).toBeGreaterThan(80);
    expect(maxBpm).toBeLessThan(150);
    // reps detected and rhythm score reasonable
    expect(reps.length).toBeGreaterThan(5);
    expect(rhythmScore).toBeGreaterThan(20);
  });
});


