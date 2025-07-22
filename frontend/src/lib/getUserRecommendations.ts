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

interface Exercise {
  id: number;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups: string[];
  instructions: string[];
  created_at: string;
}

interface ExerciseWithReason extends Exercise {
  reason: string;
}

interface UserRecommendations {
  practice_more: ExerciseWithReason[];
  try_next: ExerciseWithReason[];
}

const TARGET_SCORE = 85;
const MIN_SESSIONS_FOR_MASTERY = 3;

export async function getUserRecommendations(userId: string): Promise<UserRecommendations> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get user's sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sessionsError) {
    throw sessionsError;
  }

  // Get all exercises
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('*')
    .order('difficulty', { ascending: true });

  if (exercisesError) {
    throw exercisesError;
  }

  if (!exercises || exercises.length === 0) {
    return {
      practice_more: [],
      try_next: []
    };
  }

  // If user has no sessions, recommend all beginner exercises
  if (!sessions || sessions.length === 0) {
    return {
      practice_more: [],
      try_next: exercises
        .filter(exercise => exercise.difficulty === 'beginner')
        .map(exercise => ({
          ...exercise,
          reason: 'Start with this beginner exercise'
        }))
    };
  }

  // Group sessions by exercise
  const exerciseSessions = sessions.reduce((acc, session) => {
    if (!acc[session.exercise_id]) {
      acc[session.exercise_id] = [];
    }
    acc[session.exercise_id].push(session);
    return acc;
  }, {} as Record<number, Session[]>);

  // Calculate exercise mastery
  const masteredExercises = new Set<number>();
  const practiceMore: ExerciseWithReason[] = [];
  const tryNext: ExerciseWithReason[] = [];

  // Process each exercise
  exercises.forEach(exercise => {
    const sessions = exerciseSessions[exercise.id] || [];
    const lastSession = sessions[0];
    const totalSessions = sessions.length;

    if (lastSession) {
      if (lastSession.score < TARGET_SCORE) {
        practiceMore.push({
          ...exercise,
          reason: `Your last score was ${lastSession.score}, which is below the target score of ${TARGET_SCORE}`
        });
      } else if (totalSessions >= MIN_SESSIONS_FOR_MASTERY) {
        masteredExercises.add(exercise.id);
      }
    }

    // If exercise hasn't been attempted and user has mastered previous difficulty
    if (!lastSession) {
      const previousDifficulty = exercise.difficulty === 'intermediate' ? 'beginner' : 
                               exercise.difficulty === 'advanced' ? 'intermediate' : null;

      if (previousDifficulty) {
        const hasMasteredPrevious = exercises
          .filter(e => e.difficulty === previousDifficulty)
          .every(e => masteredExercises.has(e.id));

        if (hasMasteredPrevious) {
          tryNext.push({
            ...exercise,
            reason: `You have mastered ${previousDifficulty} exercises, try this ${exercise.difficulty} exercise`
          });
        }
      } else if (exercise.difficulty === 'beginner') {
        tryNext.push({
          ...exercise,
          reason: 'Start with this beginner exercise'
        });
      }
    }
  });

  return {
    practice_more: practiceMore,
    try_next: tryNext
  };
} 