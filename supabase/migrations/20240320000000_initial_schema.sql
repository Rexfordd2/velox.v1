-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type music_service as enum ('spotify', 'apple', 'none');

-- Users table (extends auth.users)
create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    full_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- User settings
create table user_settings (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    preferred_music_service music_service default 'none' not null,
    goals jsonb,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    unique(user_id)
);

-- Movements library
create table movements (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    difficulty_level smallint,
    muscle_groups text[],
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Workouts
create table workouts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    title text not null,
    description text,
    duration interval,
    spotify_track_id text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Workout sets
create table workout_sets (
    id uuid primary key default uuid_generate_v4(),
    workout_id uuid references workouts(id) on delete cascade not null,
    movement_id uuid references movements(id) not null,
    set_number integer not null,
    reps integer,
    weight numeric,
    rpe numeric,
    notes text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- VBT (Velocity Based Training) sets
create table vbt_sets (
    id uuid primary key default uuid_generate_v4(),
    workout_set_id uuid references workout_sets(id) on delete cascade not null,
    mean_velocity numeric,
    peak_velocity numeric,
    velocity_data jsonb,
    movement_quality_score numeric,
    joint_angles jsonb,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Badges
create table badges (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    image_url text,
    criteria jsonb,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- User badges
create table user_badges (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    badge_id uuid references badges(id) on delete cascade not null,
    awarded_at timestamp with time zone default now() not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    unique(user_id, badge_id)
);

-- Saved workouts
create table saved_workouts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    workout_id uuid references workouts(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    unique(user_id, workout_id)
);

-- PDF uploads
create table pdf_uploads (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    file_name text not null,
    file_url text not null,
    file_size integer not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Social posts
create table posts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    workout_id uuid references workouts(id),
    content text not null,
    media_urls text[],
    likes_count integer default 0,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Comments
create table comments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    post_id uuid references posts(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Challenges
create table challenges (
    id uuid primary key default uuid_generate_v4(),
    creator_id uuid references users(id) on delete cascade not null,
    title text not null,
    description text,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    movement_id uuid references movements(id),
    criteria jsonb,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Challenge participants
create table challenge_participants (
    id uuid primary key default uuid_generate_v4(),
    challenge_id uuid references challenges(id) on delete cascade not null,
    user_id uuid references users(id) on delete cascade not null,
    status text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    unique(challenge_id, user_id)
);

-- Friendships
create table friendships (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    friend_id uuid references users(id) on delete cascade not null,
    status text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    unique(user_id, friend_id)
);

-- Leaderboards
create table leaderboards (
    id uuid primary key default uuid_generate_v4(),
    movement_id uuid references movements(id) not null,
    user_id uuid references users(id) on delete cascade not null,
    score numeric not null,
    week date not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Notifications
create table notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    type text not null,
    content text not null,
    read boolean default false,
    data jsonb,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Create indexes
create index idx_workouts_user_created on workouts(user_id, created_at desc);
create index idx_posts_created_user on posts(created_at desc, user_id);
create index idx_workout_sets_workout on workout_sets(workout_id);
create index idx_comments_post on comments(post_id);
create index idx_notifications_user_read on notifications(user_id, read);
create index idx_vbt_sets_workout_set on vbt_sets(workout_set_id);
create index idx_leaderboards_movement_week_composite on leaderboards(movement_id, week);

-- Enable Row Level Security
alter table users enable row level security;
alter table user_settings enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table vbt_sets enable row level security;
alter table user_badges enable row level security;
alter table saved_workouts enable row level security;
alter table pdf_uploads enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table friendships enable row level security;
alter table leaderboards enable row level security;
alter table notifications enable row level security;

-- Create RLS Policies
create policy "Users can read their own data"
    on users for select
    using (id = auth.uid());

create policy "Users can update their own data"
    on users for update
    using (id = auth.uid());

create policy "Users can read their own settings"
    on user_settings for select
    using (user_id = auth.uid());

create policy "Users can update their own settings"
    on user_settings for update
    using (user_id = auth.uid());

create policy "Users can read their own workouts"
    on workouts for select
    using (user_id = auth.uid());

create policy "Users can create their own workouts"
    on workouts for insert
    with check (user_id = auth.uid());

create policy "Users can update their own workouts"
    on workouts for update
    using (user_id = auth.uid());

create policy "Users can delete their own workouts"
    on workouts for delete
    using (user_id = auth.uid());

-- Add triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
    before update on users
    for each row
    execute function update_updated_at_column();

create trigger update_user_settings_updated_at
    before update on user_settings
    for each row
    execute function update_updated_at_column();

-- Add similar triggers for all other tables 