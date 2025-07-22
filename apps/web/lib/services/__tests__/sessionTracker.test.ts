import { sessionTracker } from '../sessionTracker';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Increase Jest timeout for this test file
jest.setTimeout(10000);

describe('SessionTracker', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    indexedDB = new IDBFactory();
    await sessionTracker.init();
    
    // Reset timestamp counter before each test
    jest.useFakeTimers();
    jest.setSystemTime(1600000000000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should record a complete workout session', async () => {
    // Start a new session
    const sessionId = await sessionTracker.startSession('Squat');
    expect(sessionId).toBe('00000000-0000-0000-0000-000000000000'); // Mocked UUID

    // Simulate first set
    for (let i = 0; i < 5; i++) {
      await sessionTracker.recordRep({
        velocity: { raw: 1.0 - i * 0.1, calibrated: 0.9 - i * 0.1 },
        rom: 90,
        confidenceScore: 95,
        phaseTransitions: {
          eccentric: 0,
          concentric: 500,
          lockout: 1000,
        },
      });
      jest.advanceTimersByTime(200); // 200ms between reps
    }

    // Wait between sets
    jest.advanceTimersByTime(1000);

    // Simulate second set
    for (let i = 0; i < 5; i++) {
      await sessionTracker.recordRep({
        velocity: { raw: 0.9 - i * 0.1, calibrated: 0.8 - i * 0.1 },
        rom: 88,
        confidenceScore: 92,
        phaseTransitions: {
          eccentric: 0,
          concentric: 550,
          lockout: 1100,
        },
      });
      jest.advanceTimersByTime(200); // 200ms between reps
    }

    // Wait between sets
    jest.advanceTimersByTime(1000);

    // Simulate third set
    for (let i = 0; i < 5; i++) {
      await sessionTracker.recordRep({
        velocity: { raw: 0.8 - i * 0.1, calibrated: 0.7 - i * 0.1 },
        rom: 85,
        confidenceScore: 90,
        phaseTransitions: {
          eccentric: 0,
          concentric: 600,
          lockout: 1200,
        },
        feedback: ['Depth slightly reduced'],
      });
      jest.advanceTimersByTime(200); // 200ms between reps
    }

    // End session
    const session = await sessionTracker.endSession();

    // Verify session data
    expect(session).toMatchObject({
      id: sessionId,
      exerciseName: 'Squat',
      reps: expect.arrayContaining([
        expect.objectContaining({
          velocity: expect.any(Object),
          rom: expect.any(Number),
          confidenceScore: expect.any(Number),
        }),
      ]),
    });

    // Verify summary calculations
    expect(session.summary).toBeTruthy();
    expect(session.summary?.totalReps).toBe(15);
    expect(session.summary?.sets).toHaveLength(3);
    
    // Verify set detection and fatigue calculation
    session.summary?.sets.forEach(set => {
      expect(set.totalReps).toBe(5);
      expect(set.fatigueIndex).toBeGreaterThan(0); // Velocity decreased in each set
    });

    // Verify data persistence
    const loadedSession = await sessionTracker.getSession(sessionId);
    expect(loadedSession).toEqual(session);

    // Verify session appears in recent sessions
    const recentSessions = await sessionTracker.getSessions();
    expect(recentSessions).toContainEqual(session);

    // Verify session appears in exercise-specific query
    const exerciseSessions = await sessionTracker.getSessionsByExercise('Squat');
    expect(exerciseSessions).toContainEqual(session);
  });
}); 