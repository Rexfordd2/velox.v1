import { useState, useCallback, useEffect } from 'react';
import { sessionTracker, WorkoutSession } from '../lib/services/sessionTracker';

interface UseSessionTracker {
  isRecording: boolean;
  currentSession: WorkoutSession | null;
  recentSessions: WorkoutSession[];
  startSession: (exerciseName: string) => Promise<void>;
  endSession: () => Promise<void>;
  recordRep: (data: {
    velocity: { raw: number; calibrated: number };
    rom: number;
    confidenceScore: number;
    phaseTransitions: {
      eccentric: number;
      concentric: number;
      lockout: number;
    };
    feedback?: string[];
  }) => Promise<void>;
  getSessionsByExercise: (exerciseName: string) => Promise<WorkoutSession[]>;
}

export function useSessionTracker(): UseSessionTracker {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);

  // Load recent sessions on mount
  useEffect(() => {
    sessionTracker.getSessions().then(setRecentSessions);
  }, []);

  const startSession = useCallback(async (exerciseName: string) => {
    const sessionId = await sessionTracker.startSession(exerciseName);
    const session = await sessionTracker.getSession(sessionId);
    if (session) {
      setCurrentSession(session);
      setIsRecording(true);
    }
  }, []);

  const endSession = useCallback(async () => {
    const session = await sessionTracker.endSession();
    setCurrentSession(null);
    setIsRecording(false);
    setRecentSessions(prev => [session, ...prev].slice(0, 10)); // Keep last 10 sessions
  }, []);

  const recordRep = useCallback(async (data: Parameters<UseSessionTracker['recordRep']>[0]) => {
    await sessionTracker.recordRep(data);
    const session = await sessionTracker.getSession(currentSession!.id);
    if (session) {
      setCurrentSession(session);
    }
  }, [currentSession]);

  const getSessionsByExercise = useCallback(async (exerciseName: string) => {
    return sessionTracker.getSessionsByExercise(exerciseName);
  }, []);

  return {
    isRecording,
    currentSession,
    recentSessions,
    startSession,
    endSession,
    recordRep,
    getSessionsByExercise,
  };
} 