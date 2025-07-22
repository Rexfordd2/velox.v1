'use client';

import { useEffect, useState } from 'react';
import { openDB } from 'idb';
import { useParams } from 'next/navigation';
import { WorkoutSession } from '@velox/types';
import { SessionPlayback } from '../../../components/workout/SessionPlayback';

interface SessionDB {
  sessions: {
    key: string;
    value: WorkoutSession;
    indexes: {
      'by-exercise': string;
      'by-date': number;
    };
  };
}

export default function SessionPlaybackPage() {
  const { id } = useParams();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepIndex, setSelectedRepIndex] = useState(0);

  useEffect(() => {
    async function loadSession() {
      try {
        const db = await openDB<SessionDB>('velox-sessions', 1);
        const sessionData = await db.get('sessions', id as string);
        
        if (!sessionData) {
          setError('Session not found');
          return;
        }
        
        setSession(sessionData);
      } catch (err) {
        console.error('Failed to load session:', err);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-gray-600 mt-2">{error || 'Session not found'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{session.exerciseName} Session</h1>
        <p className="text-gray-600">
          {new Date(session.startTime).toLocaleDateString()} - 
          {session.reps.length} reps
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Session Overview</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Duration: </span>
              {((session.reps[session.reps.length - 1]?.timestamp || 0) - session.startTime) / 1000}s
            </p>
            <p>
              <span className="font-medium">Average Velocity: </span>
              {(session.reps.reduce((acc, rep) => acc + rep.velocity.calibrated, 0) / session.reps.length).toFixed(2)} m/s
            </p>
            <p>
              <span className="font-medium">Average ROM: </span>
              {(session.reps.reduce((acc, rep) => acc + rep.rom, 0) / session.reps.length).toFixed(2)} cm
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Playback Controls</h2>
          <SessionPlayback
            reps={session.reps}
            onRepSelect={setSelectedRepIndex}
          />
        </div>

        {/* Phase Analysis */}
        <div className="md:col-span-3 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Phase Analysis</h2>
          {session.reps[selectedRepIndex] && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Eccentric Phase</h3>
                <p className="text-sm text-gray-600">
                  Duration: {(session.reps[selectedRepIndex].phaseTransitions.eccentric / 1000).toFixed(2)}s
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Concentric Phase</h3>
                <p className="text-sm text-gray-600">
                  Duration: {(
                    (session.reps[selectedRepIndex].phaseTransitions.concentric -
                    session.reps[selectedRepIndex].phaseTransitions.eccentric) / 1000
                  ).toFixed(2)}s
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Lockout Phase</h3>
                <p className="text-sm text-gray-600">
                  Duration: {(
                    (session.reps[selectedRepIndex].phaseTransitions.lockout -
                    session.reps[selectedRepIndex].phaseTransitions.concentric) / 1000
                  ).toFixed(2)}s
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 