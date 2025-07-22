import { supabase } from './supabase'
import { Exercise } from '@/components/ExercisePicker'

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')

  if (error) {
    throw error
  }

  // Transform the data to match our Exercise interface
  return (data || []).map(exercise => ({
    id: exercise.id.toString(), // Convert bigint to string
    name: exercise.name,
    description: exercise.description || '',
    category: exercise.category || 'General',
    difficulty: exercise.difficulty || 'intermediate',
    muscle_groups: exercise.muscle_groups || [],
    equipment: exercise.equipment || [],
    instructions: exercise.instructions || undefined,
    primary_muscle: exercise.primary_muscle || undefined,
    secondary_muscles: exercise.secondary_muscles || []
  }))
} 