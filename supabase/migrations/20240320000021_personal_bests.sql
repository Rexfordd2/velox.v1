-- Function to get personal bests for a specific exercise
CREATE OR REPLACE FUNCTION get_exercise_personal_bests(
  p_user_id UUID,
  p_exercise_type TEXT
) RETURNS TABLE (
  best_form_score INTEGER,
  best_form_score_date TIMESTAMP WITH TIME ZONE,
  max_reps INTEGER,
  max_reps_date TIMESTAMP WITH TIME ZONE,
  best_duration INTEGER,
  best_duration_date TIMESTAMP WITH TIME ZONE,
  max_weight NUMERIC,
  max_weight_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Best form score
    (SELECT form_score
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
     ORDER BY form_score DESC
     LIMIT 1) AS best_form_score,
    
    (SELECT created_at
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
     ORDER BY form_score DESC
     LIMIT 1) AS best_form_score_date,

    -- Max reps
    (SELECT rep_count
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
     ORDER BY rep_count DESC
     LIMIT 1) AS max_reps,
    
    (SELECT created_at
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
     ORDER BY rep_count DESC
     LIMIT 1) AS max_reps_date,

    -- Best duration
    (SELECT duration
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
     ORDER BY duration DESC
     LIMIT 1) AS best_duration,
    
    (SELECT created_at
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
     ORDER BY duration DESC
     LIMIT 1) AS best_duration_date,

    -- Max weight
    (SELECT weight
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
       AND weight IS NOT NULL
     ORDER BY weight DESC
     LIMIT 1) AS max_weight,
    
    (SELECT created_at
     FROM workout_sessions
     WHERE user_id = p_user_id
       AND exercise_type = p_exercise_type
       AND weight IS NOT NULL
     ORDER BY weight DESC
     LIMIT 1) AS max_weight_date;
END;
$$; 