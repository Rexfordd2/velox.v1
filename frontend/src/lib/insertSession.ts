import { supabase } from './supabase'

interface SessionInput {
  user_id: string
  exercise_id: string  // Changed to string to match our Exercise type
  notes?: string | null
  video_url?: string
  score?: number
  duration?: number
}

export async function insertSession(session: SessionInput): Promise<any> {
  // Convert exercise_id back to number for the database
  const dbSession = {
    ...session,
    exercise_id: parseInt(session.exercise_id, 10)
  }

  if (!supabase) throw new Error('Database not configured')
  const { data, error } = await supabase
    .from('sessions')
    .insert(dbSession)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
} 