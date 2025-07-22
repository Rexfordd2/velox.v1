import { supabase } from './supabase'

interface Session {
  id: number;
  user_id: string;
  exercise_id: number;
  video_url: string;
  score: number;
  feedback?: string;
  created_at: string;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      exercise:exercises(
        id,
        name,
        description,
        category,
        difficulty
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
} 