import { describe, it, expect } from 'vitest';
import { syncWithBeats } from '../bpmSync';

describe('syncWithBeats combo', () => {
  it('achieves high combo with reps near 120 BPM beat grid', () => {
    // synthesize velocity series with peaks near every 500ms +/- 40ms
    const bpm = 120; // 500 ms period
    const durationMs = 6000; // 6 seconds ~ 12 beats
    const samples: { t: number; v: number }[] = [];
    // create baseline sine-like velocity and inject peaks
    const dt = 10;
    for (let t = 0; t <= durationMs; t += dt) {
      const phase = (t % 500) / 500;
      const v = Math.sin(phase * 2 * Math.PI) + (Math.random() - 0.5) * 0.05;
      samples.push({ t, v });
    }
    // emphasize near-beat peaks
    for (let k = 1; k <= 10; k++) {
      const beatT = k * 500;
      const jitter = (Math.random() * 80) - 40; // +/- 40ms
      const idx = Math.max(0, Math.min(samples.length - 1, Math.round((beatT + jitter) / dt)));
      samples[idx].v += 3.0; // sharp peak
    }

    const res = syncWithBeats(samples);
    expect(res.combo).toBeGreaterThanOrEqual(8);
  });
});


