import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { sessionTracker } from '../sessionTracker';

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('SessionTracker', () => {
  it('should record a complete workout session', async () => {
    await sessionTracker.init();

    // Start a new session
    const sessionId = await sessionTracker.startSession('Squat');
    expect(typeof sessionId).toBe('string');

    // Simulate first set
    for (let i = 0; i < 5; i++) {
      await sessionTracker.recordRep({
        velocity: { raw: 1.2, calibrated: 1.0 },
        rom: 0.4,
        confidenceScore: 0.9,
        phaseTransitions: { eccentric: 100, concentric: 200, lockout: 50 },
      });
      await wait(5);
    }

    // Break between sets
    await wait(10);

    // Simulate second set
    for (let i = 0; i < 5; i++) {
      await sessionTracker.recordRep({
        velocity: { raw: 1.1, calibrated: 0.95 },
        rom: 0.38,
        confidenceScore: 0.88,
        phaseTransitions: { eccentric: 110, concentric: 210, lockout: 60 },
      });
      await wait(5);
    }

    // Break between sets
    await wait(10);

    // Simulate third set
    for (let i = 0; i < 5; i++) {
      await sessionTracker.recordRep({
        velocity: { raw: 1.0, calibrated: 0.9 },
        rom: 0.36,
        confidenceScore: 0.85,
        phaseTransitions: { eccentric: 120, concentric: 220, lockout: 70 },
      });
      await wait(5);
    }

    const session = await sessionTracker.endSession();

    expect(session.summary).toBeTruthy();
    expect(session.summary?.totalReps).toBe(15);
    expect((session.summary?.sets || []).length).toBeGreaterThanOrEqual(1);

    // Verify set detection and fatigue calculation
    const sets = session.summary!.sets;
    const fatigueValues = sets.map(s => s.fatigueIndex);
    expect(fatigueValues.length).toBeGreaterThanOrEqual(1);
  }, 30000);
}); 