-- Create materialized views for frequently accessed data
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT s.id) as total_sets,
  COUNT(DISTINCT s.exercise_id) as unique_exercises,
  MAX(s.created_at) as last_activity,
  SUM(s.score) as total_score,
  AVG(s.score) as avg_score,
  COUNT(DISTINCT CASE WHEN s.score >= 90 THEN s.id END) as perfect_sets
FROM auth.users u
LEFT JOIN public.sets s ON s.user_id = u.id
GROUP BY u.id, u.username;

CREATE UNIQUE INDEX user_stats_id_idx ON user_stats(id);

-- Create materialized view for exercise leaderboards
CREATE MATERIALIZED VIEW exercise_leaderboards AS
SELECT 
  s.exercise_id,
  s.user_id,
  u.username,
  MAX(s.score) as best_score,
  AVG(s.score) as avg_score,
  COUNT(*) as total_attempts,
  MAX(s.created_at) as last_attempt
FROM public.sets s
JOIN auth.users u ON u.id = s.user_id
GROUP BY s.exercise_id, s.user_id, u.username;

CREATE UNIQUE INDEX exercise_leaderboards_exercise_user_idx 
ON exercise_leaderboards(exercise_id, user_id);

-- Create materialized view for weekly progress
CREATE MATERIALIZED VIEW weekly_progress AS
SELECT 
  user_id,
  date_trunc('week', created_at) as week,
  COUNT(*) as total_sets,
  AVG(score) as avg_score,
  COUNT(DISTINCT exercise_id) as unique_exercises
FROM public.sets
GROUP BY user_id, date_trunc('week', created_at);

CREATE UNIQUE INDEX weekly_progress_user_week_idx 
ON weekly_progress(user_id, week);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_leaderboards;
  REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_progress;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh views on data changes
CREATE OR REPLACE FUNCTION refresh_views_trigger()
RETURNS trigger AS $$
BEGIN
  -- Queue refresh job to run asynchronously
  PERFORM pg_notify('refresh_views', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sets_refresh_views_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sets
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_views_trigger();

-- Optimize existing leaderboard function to use materialized views
CREATE OR REPLACE FUNCTION get_leaderboard(
  exercise_id_param UUID,
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  best_score NUMERIC,
  avg_score NUMERIC,
  total_attempts INTEGER,
  last_attempt TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.user_id,
    el.username,
    el.best_score,
    el.avg_score,
    el.total_attempts,
    el.last_attempt
  FROM exercise_leaderboards el
  WHERE el.exercise_id = exercise_id_param
  ORDER BY el.best_score DESC, el.avg_score DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql; 