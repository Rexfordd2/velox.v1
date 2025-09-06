import { describe, it, expect } from 'vitest';
import { syncWithBeats } from '../../src/bpmSync';

function seriesWithJitter(bpm = 100, jitterMs = 0): { t: number; v: number }[] {
  const out: { t: number; v: number }[] = [];
  let t = 0;
  const dt = 10;
  const period = 60000 / bpm;
  let nextPeak = period;
  let phase = 0;
  for (let i = 0; i < 3000; i++) {
    const f = bpm / 60;
    phase += 2 * Math.PI * f * (dt / 1000);
    const v = Math.sin(phase);
    out.push({ t, v });
    t += dt;
    if (t >= nextPeak) {
      // inject slight amplitude spike to mark a rep near beat
      out[out.length - 1].v += 2.0;
      nextPeak += period + (Math.random() - 0.5) * 2 * jitterMs;
    }
  }
  return out;
}

describe('rhythm scoring with combo and penalties', () => {
  it('high rhythmScore for tight timing', () => {
    const vel = seriesWithJitter(110, 10);
    const { rhythmScore } = syncWithBeats(vel);
    expect(rhythmScore).toBeGreaterThan(20);
  });

  it('lower rhythmScore for sloppy timing', () => {
    const vel = seriesWithJitter(110, 200);
    const { rhythmScore } = syncWithBeats(vel);
    expect(rhythmScore).toBeLessThanOrEqual(65);
  });
});


