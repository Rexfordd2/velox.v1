import { expect, test, describe, vi } from 'vitest';
import { alignRepsToBeats } from '../src';
import { Beat, Rep } from '../src/types';

describe('MusicSync Offline Mode', () => {
  test('should handle variable tempo segments', () => {
    const onTempoChange = vi.fn();
    const beats: Beat[] = [
      { timestamp: 0, type: 'strong' },
      { timestamp: 600, type: 'weak' },
      { timestamp: 1200, type: 'strong' },
      { timestamp: 1800, type: 'weak' }
    ];
    const reps: Rep[] = [
      { timestamp: 0, type: 'concentric' },
      { timestamp: 600, type: 'eccentric' },
      { timestamp: 1200, type: 'concentric' },
      { timestamp: 1800, type: 'eccentric' }
    ];

    const timings = alignRepsToBeats(reps, beats);
    expect(timings).toHaveLength(4);
    timings.forEach(timing => {
      expect(timing.inWindow).toBe(true);
      expect(Math.abs(timing.diffMs)).toBeLessThanOrEqual(50);
    });
  });
}); 