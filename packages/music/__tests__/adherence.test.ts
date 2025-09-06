import { describe, it, expect } from 'vitest';
import { computeBeatAdherence } from '../src/adherence';

describe('computeBeatAdherence', () => {
  it('returns 0 when no events', () => {
    const res = computeBeatAdherence([], { bpm: 120 });
    expect(res.total).toBe(0);
    expect(res.percent).toBe(0);
  });

  it('counts on-time events within tolerance around downbeats', () => {
    const bpm = 120; // 500ms interval
    const epoch = 1_000; // define downbeat reference
    const events = [
      epoch + 2,          // ~0ms diff
      epoch + 498,        // ~-2ms diff
      epoch + 250,        // 250ms -> far, outside 40ms tolerance
      epoch + 1000 + 10,  // next beat +10ms
    ];
    const res = computeBeatAdherence(events, { bpm, toleranceMs: 40, beatEpochMs: epoch });
    expect(res.total).toBe(4);
    expect(res.onTime).toBe(3); // first, second, and fourth are within 40ms of a beat
    expect(Math.round(res.percent)).toBe(75);
  });

  it('compensates latency (camera late, audio early)', () => {
    const bpm = 100; // 600ms
    const epoch = 1000;
    const events = [epoch, epoch + 600, epoch + 1200]; // exact beats at epoch multiples
    const res = computeBeatAdherence(events, { bpm, beatEpochMs: epoch, camLatencyMs: 80, audioLatencyMs: 30, toleranceMs: 60 });
    // effective shift +50ms is canceled by epoch alignment; hits remain on-time
    expect(res.onTime).toBe(3);
    expect(Math.round(res.percent)).toBe(100);
  });
});


