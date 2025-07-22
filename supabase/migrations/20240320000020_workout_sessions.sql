-- Create workout_sessions table
CREATE TABLE workout_sessions (
  id TEXT PRIMARY KEY,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('squat', 'pushup', 'deadlift')),
  rep_count INTEGER NOT NULL CHECK (rep_count >= 0),
  form_score INTEGER NOT NULL CHECK (form_score >= 0 AND form_score <= 100),
  duration INTEGER NOT NULL CHECK (duration >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON workout_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON workout_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX workout_sessions_user_id_created_at_idx
  ON workout_sessions(user_id, created_at DESC);

-- Create function to get recent sessions
CREATE OR REPLACE FUNCTION get_recent_sessions(
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  exercise_type TEXT,
  rep_count INTEGER,
  form_score INTEGER,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.id,
    ws.exercise_type,
    ws.rep_count,
    ws.form_score,
    ws.duration,
    ws.created_at,
    ws.synced_at
  FROM workout_sessions ws
  WHERE ws.user_id = auth.uid()
  ORDER BY ws.created_at DESC
  LIMIT p_limit;
END;
$$; 