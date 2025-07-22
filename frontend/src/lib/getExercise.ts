import { createClient } from '@supabase/supabase-js';

interface Exercise {
  id: number;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups: string[];
  instructions: string[];
  created_at: string;
}

export async function getExercise(id: number): Promise<Exercise> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Exercise not found');
  }

  return data;
} 