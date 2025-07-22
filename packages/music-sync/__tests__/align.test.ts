import { expect, test } from 'vitest';
import { alignRepsToBeats } from '../src/alignRepsToBeats';

test('align compensates latencies', () => {
  const reps = [1000, 2000, 3000].map(t => ({ t }));
  const beats = [900, 1900, 2900].map(t => ({ t }));
  const diffs = alignRepsToBeats(reps, beats, 120, 30);
  diffs.forEach(d => expect(Math.abs(d.diffMs)).toBeLessThanOrEqual(50));
}); 