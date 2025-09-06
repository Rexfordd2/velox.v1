import { describe, it, expect } from 'vitest';
import { AdherenceTracker } from '../src/adherence';

describe('AdherenceTracker', () => {
  it('updates adherence as hits are recorded with latency compensation', () => {
    const tracker = new AdherenceTracker({ bpm: 120, toleranceMs: 50, camLatencyMs: 30, audioLatencyMs: 10 });
    const start = 1000;
    tracker.recordHit(start + 0);   // beat
    tracker.recordHit(start + 500); // beat
    tracker.recordHit(start + 750); // off-beat
    const res = tracker.getAdherence();
    expect(res.total).toBe(3);
    expect(res.onTime).toBeGreaterThanOrEqual(2);
    expect(res.percent).toBeGreaterThan(60);
  });
});


