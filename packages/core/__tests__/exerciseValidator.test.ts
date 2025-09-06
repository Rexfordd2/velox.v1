import { validateExercise } from '../src/validators/exerciseValidator';

describe('validateExercise', () => {
  it('accepts a minimal valid definition', () => {
    const def = {
      name: 'My Move',
      category: 'other',
      version: 1,
      phases: [
        { name: 'phase1', transitionOn: 'time', criteria: [{ angle: { joint: 'knee', min: 30, max: 120 } }] },
      ],
      scoring: { passThreshold: 0.7, severityBands: [0.2, 0.5, 0.8] },
    } as any;

    const res = validateExercise(def);
    expect(res.ok).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects invalid category and empty phases', () => {
    const def = {
      name: 'X',
      category: 'bad',
      version: 0,
      phases: [],
      scoring: { passThreshold: 1.5, severityBands: [] },
    } as any;
    const res = validateExercise(def);
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});


