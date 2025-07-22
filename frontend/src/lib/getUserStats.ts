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

interface UserStats {
  total_sessions: number;
  average_score: number;
  best_score: number;
  exercise_counts: Record<number, number>;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!sessions || sessions.length === 0) {
    return {
      total_sessions: 0,
      average_score: 0,
      best_score: 0,
      exercise_counts: {}
    };
  }

  // Calculate stats
  const total_sessions = sessions.length;
  const scores = sessions.map(session => session.score);
  const average_score = Number((scores.reduce((a, b) => a + b, 0) / total_sessions).toFixed(2));
  const best_score = Math.max(...scores);

  // Count exercises
  const exercise_counts = sessions.reduce((acc, session) => {
    acc[session.exercise_id] = (acc[session.exercise_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    total_sessions,
    average_score,
    best_score,
    exercise_counts
  };
} 