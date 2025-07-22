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

interface ExerciseMastery {
  total_sessions: number;
  best_score: number;
  average_score: number;
}

interface Achievement {
  type: 'perfect_score' | 'high_score';
  exercise_id: number;
  date: string;
  score: number;
}

interface UserAchievements {
  total_sessions: number;
  perfect_scores: number;
  high_scores: number;
  exercise_mastery: Record<number, ExerciseMastery>;
  recent_achievements: Achievement[];
}

const PERFECT_SCORE_THRESHOLD = 95;
const HIGH_SCORE_THRESHOLD = 90;

export async function getUserAchievements(userId: string): Promise<UserAchievements> {
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
      perfect_scores: 0,
      high_scores: 0,
      exercise_mastery: {},
      recent_achievements: []
    };
  }

  // Calculate basic stats
  const total_sessions = sessions.length;
  let perfect_scores = 0;
  let high_scores = 0;
  const exercise_mastery: Record<number, ExerciseMastery> = {};
  const recent_achievements: Achievement[] = [];

  // Process each session
  sessions.forEach(session => {
    // Update exercise mastery
    if (!exercise_mastery[session.exercise_id]) {
      exercise_mastery[session.exercise_id] = {
        total_sessions: 0,
        best_score: 0,
        average_score: 0
      };
    }

    const mastery = exercise_mastery[session.exercise_id];
    mastery.total_sessions++;
    mastery.best_score = Math.max(mastery.best_score, session.score);
    mastery.average_score = Number(((mastery.average_score * (mastery.total_sessions - 1) + session.score) / mastery.total_sessions).toFixed(2));

    // Check for achievements
    if (session.score >= PERFECT_SCORE_THRESHOLD) {
      perfect_scores++;
      recent_achievements.push({
        type: 'perfect_score',
        exercise_id: session.exercise_id,
        date: session.created_at,
        score: session.score
      });
    } else if (session.score >= HIGH_SCORE_THRESHOLD) {
      high_scores++;
      recent_achievements.push({
        type: 'high_score',
        exercise_id: session.exercise_id,
        date: session.created_at,
        score: session.score
      });
    }
  });

  // Sort achievements by date and limit to most recent 5
  recent_achievements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  recent_achievements.splice(5);

  return {
    total_sessions,
    perfect_scores,
    high_scores,
    exercise_mastery,
    recent_achievements
  };
} 