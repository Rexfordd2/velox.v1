-- Performance Optimizations

-- 1. Add indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_analysis_exercise_type ON analysis_results(exercise_type);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON video_uploads(created_at);

-- 2. Create materialized view for exercise analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS exercise_analytics AS
SELECT
    exercise_type,
    COUNT(*) as total_attempts,
    AVG(movement_quality_score) as avg_quality_score,
    AVG(confidence_score) as avg_confidence,
    MIN(created_at) as first_attempt,
    MAX(created_at) as last_attempt
FROM analysis_results
GROUP BY exercise_type
WITH DATA;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_analytics ON exercise_analytics(exercise_type);

-- 3. Create materialized view for user progress
CREATE MATERIALIZED VIEW IF NOT EXISTS user_progress AS
SELECT
    user_id,
    exercise_type,
    DATE_TRUNC('day', created_at) as date,
    AVG(movement_quality_score) as avg_score,
    COUNT(*) as attempts
FROM analysis_results
GROUP BY user_id, exercise_type, DATE_TRUNC('day', created_at)
WITH DATA;

-- Create indexes on user progress view
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_date ON user_progress(date);

-- 4. Add RLS policies for demo data
CREATE TABLE IF NOT EXISTS demo_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_type TEXT NOT NULL,
    video_url TEXT NOT NULL,
    perfect_form BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for demo videos
ALTER TABLE demo_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo videos are viewable by everyone"
    ON demo_videos FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify demo videos"
    ON demo_videos FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 5. Add table for caching analysis results
CREATE TABLE IF NOT EXISTS cached_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_hash TEXT NOT NULL UNIQUE,
    exercise_type TEXT NOT NULL,
    analysis_results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cached_analysis_hash ON cached_analysis(video_hash);
CREATE INDEX IF NOT EXISTS idx_cached_analysis_expires ON cached_analysis(expires_at);

-- 6. Add function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress;
END;
$$ LANGUAGE plpgsql;

-- 7. Add function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM cached_analysis
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Create monitoring tables
CREATE TABLE IF NOT EXISTS api_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created_at ON api_metrics(created_at);

CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Add maintenance functions
CREATE OR REPLACE FUNCTION analyze_tables()
RETURNS void AS $$
BEGIN
    ANALYZE analysis_results;
    ANALYZE video_uploads;
    ANALYZE cached_analysis;
    ANALYZE api_metrics;
END;
$$ LANGUAGE plpgsql;

-- 10. Create scheduled tasks (requires pg_cron extension)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Refresh materialized views every hour
SELECT cron.schedule('0 * * * *', $$
    SELECT refresh_analytics_views();
$$);

-- Clean expired cache daily
SELECT cron.schedule('0 0 * * *', $$
    SELECT clean_expired_cache();
$$);

-- Analyze tables weekly
SELECT cron.schedule('0 0 * * 0', $$
    SELECT analyze_tables();
$$); 