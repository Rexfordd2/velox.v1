-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_friend ON friendships(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_name ON movements(name);

-- Enhanced RLS policies for public data access
CREATE POLICY "Anyone can read public movements"
    ON movements FOR SELECT
    USING (true);

CREATE POLICY "Users can read friends' posts"
    ON posts FOR SELECT
    USING (
        user_id IN (
            SELECT friend_id FROM friendships 
            WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships 
            WHERE friend_id = auth.uid() AND status = 'accepted'
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can read public badges"
    ON badges FOR SELECT
    USING (true);

-- Add policies for challenge visibility
CREATE POLICY "Users can see public challenges"
    ON challenges FOR SELECT
    USING (
        creator_id = auth.uid() OR
        id IN (
            SELECT challenge_id FROM challenge_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Add policies for workout sharing
CREATE POLICY "Users can see shared workouts"
    ON workouts FOR SELECT
    USING (
        user_id = auth.uid() OR
        id IN (
            SELECT workout_id FROM saved_workouts 
            WHERE user_id = auth.uid()
        )
    );

-- Add policies for leaderboard visibility
CREATE POLICY "Users can see leaderboard entries"
    ON leaderboards FOR SELECT
    USING (true);

-- Add policies for public profile visibility
CREATE POLICY "Users can see other users' public profiles"
    ON users FOR SELECT
    USING (
        id = auth.uid() OR
        id IN (
            SELECT friend_id FROM friendships 
            WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships 
            WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    ); 