import { expect, test, describe } from 'vitest';
import { alignRepsToBeats, calculateTimingScore } from '../src';
import { Beat, Rep } from '../src/types';

describe('BPM synchronization', () => {
  test('perfectly synchronized reps score 100', () => {
    const reps: Rep[] = [
      { timestamp: 0, type: 'concentric' },
      { timestamp: 500, type: 'eccentric' },
      { timestamp: 1000, type: 'concentric' },
      { timestamp: 1500, type: 'eccentric' },
      { timestamp: 2000, type: 'concentric' },
      { timestamp: 2500, type: 'eccentric' }
    ];
    const beats: Beat[] = [
      { timestamp: 0, type: 'strong' },
      { timestamp: 500, type: 'weak' },
      { timestamp: 1000, type: 'strong' },
      { timestamp: 1500, type: 'weak' },
      { timestamp: 2000, type: 'strong' },
      { timestamp: 2500, type: 'weak' }
    ];
    const timings = alignRepsToBeats(reps, beats);

    expect(timings).toHaveLength(6); // 3 reps * 2 phases
    timings.forEach(timing => {
      expect(Math.abs(timing.diffMs)).toBeLessThanOrEqual(50);
      expect(timing.inWindow).toBe(true);
    });
    const score = calculateTimingScore(timings, 50);
    // perfectly synchronized reps score 100
    expect(score).toBe(100);
  });

  test('slightly off-beat reps score proportionally', () => {
    const reps: Rep[] = [
      { timestamp: 40, type: 'concentric' },
      { timestamp: 540, type: 'eccentric' },
      { timestamp: 1040, type: 'concentric' },
      { timestamp: 1540, type: 'eccentric' },
      { timestamp: 2040, type: 'concentric' },
      { timestamp: 2540, type: 'eccentric' }
    ];
    const beats: Beat[] = [
      { timestamp: 0, type: 'strong' },
      { timestamp: 500, type: 'weak' },
      { timestamp: 1000, type: 'strong' },
      { timestamp: 1500, type: 'weak' },
      { timestamp: 2000, type: 'strong' },
      { timestamp: 2500, type: 'weak' }
    ];
    const timings = alignRepsToBeats(reps, beats);

    timings.forEach(timing => {
      expect(Math.abs(timing.diffMs)).toBeCloseTo(40, 0);
      expect(timing.inWindow).toBe(true);
    });
    const score = calculateTimingScore(timings, 50);
    // 50 ms now sits at the edge of the perfect window (±50 ms)
    expect(score).toBeGreaterThanOrEqual(95);
  });

  test('badly off-beat reps score low', () => {
    const reps: Rep[] = [
      { timestamp: 200, type: 'concentric' },
      { timestamp: 700, type: 'eccentric' },
      { timestamp: 1200, type: 'concentric' },
      { timestamp: 1700, type: 'eccentric' },
      { timestamp: 2200, type: 'concentric' },
      { timestamp: 2700, type: 'eccentric' }
    ];
    const beats: Beat[] = [
      { timestamp: 0, type: 'strong' },
      { timestamp: 500, type: 'weak' },
      { timestamp: 1000, type: 'strong' },
      { timestamp: 1500, type: 'weak' },
      { timestamp: 2000, type: 'strong' },
      { timestamp: 2500, type: 'weak' }
    ];
    const timings = alignRepsToBeats(reps, beats);

    timings.forEach(timing => {
      expect(Math.abs(timing.diffMs)).toBeCloseTo(200, 0);
      expect(timing.inWindow).toBe(false);
    });
    const score = calculateTimingScore(timings, 50);
    // 200 ms is far outside the ±50 ms window ⇒ low score
    expect(score).toBeLessThan(20);
  });

  test('handles empty rep array', () => {
    const timings = alignRepsToBeats([], []);
    const score = calculateTimingScore(timings, 50);
    expect(score).toBe(0);
    expect(timings).toHaveLength(0);
  });
}); 