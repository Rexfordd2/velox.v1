import { createClient } from '@supabase/supabase-js';

interface Session {
  id: number;
  user_id: string;
  exercise_id: number;
  video_url: string;
  score: number;
  feedback?: string;
  created_at: string;
}

interface LastSession {
  score: number;
  feedback?: string;
  date: string;
}

interface UserProgress {
  exercise_id: number;
  total_sessions: number;
  average_score: number;
  best_score: number;
  progress_trend: 'improving' | 'declining' | 'neutral';
  last_session: LastSession | null;
}

export async function getUserProgress(userId: string, exerciseId: number): Promise<UserProgress> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!sessions || sessions.length === 0) {
    return {
      exercise_id: exerciseId,
      total_sessions: 0,
      average_score: 0,
      best_score: 0,
      progress_trend: 'neutral',
      last_session: null
    };
  }

  // Calculate basic stats
  const total_sessions = sessions.length;
  const scores = sessions.map(session => session.score);
  const average_score = Number((scores.reduce((a, b) => a + b, 0) / total_sessions).toFixed(2));
  const best_score = Math.max(...scores);

  // Determine progress trend
  let progress_trend: 'improving' | 'declining' | 'neutral' = 'neutral';
  if (total_sessions >= 3) {
    const recentScores = scores.slice(0, 3);
    const firstScore = recentScores[2];
    const lastScore = recentScores[0];
    const difference = lastScore - firstScore;

    if (difference > 5) {
      progress_trend = 'improving';
    } else if (difference < -5) {
      progress_trend = 'declining';
    }
  }

  // Get last session details
  const last_session: LastSession = {
    score: sessions[0].score,
    feedback: sessions[0].feedback,
    date: sessions[0].created_at
  };

  return {
    exercise_id: exerciseId,
    total_sessions,
    average_score,
    best_score,
    progress_trend,
    last_session
  };
} 