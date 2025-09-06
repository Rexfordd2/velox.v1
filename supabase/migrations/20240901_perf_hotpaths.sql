-- Enable pg_trgm for fast ILIKE on name/slug
create extension if not exists pg_trgm;

-- Exercises hot path indexes
create index if not exists idx_exercises_created_at on public.exercises(created_at desc);
create index if not exists idx_exercises_slug on public.exercises(slug);
create index if not exists idx_exercises_difficulty on public.exercises(difficulty);
create index if not exists idx_exercises_primary_muscle on public.exercises(primary_muscle);
create index if not exists idx_exercises_deleted_at on public.exercises(deleted_at);
create index if not exists idx_exercises_name_trgm on public.exercises using gin (name gin_trgm_ops);

-- Exercise categories join/filter
create index if not exists idx_exercise_to_category_exercise on public.exercise_to_category(exercise_id);
create index if not exists idx_exercise_to_category_category on public.exercise_to_category(category_id);

-- Posts/feed hot paths
create index if not exists idx_posts_created_at_desc on public.posts(created_at desc);
create index if not exists idx_posts_user_id on public.posts(user_id);

-- Comments by post
create index if not exists idx_comments_post_id on public.comments(post_id);

-- Workout sessions list/history
create index if not exists idx_workout_sessions_user_created_at on public.workout_sessions(user_id, created_at desc);
create index if not exists idx_workout_sessions_exercise_type on public.workout_sessions(exercise_type);

-- Leaderboards cache lookups
-- If table exists, add composite index used by cache queries
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'leaderboards_cache'
  ) then
    execute 'create index if not exists idx_leaderboards_cache_lookup on public.leaderboards_cache(movement_id, window, scope, generated_for)';
    execute 'create index if not exists idx_leaderboards_cache_created_at on public.leaderboards_cache(created_at desc)';
  end if;
end $$;

-- Support tickets lookup
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'support_tickets'
  ) then
    execute 'create index if not exists idx_support_tickets_email on public.support_tickets(email)';
  end if;
end $$;


