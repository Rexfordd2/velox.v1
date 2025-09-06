-- Challenges, Attempts, and Packs schema (2025-08-18)
-- Note: aligns with new BYLS and pack-based challenges model

-- Enable required extensions (safe if already enabled)
create extension if not exists "uuid-ossp";

-- Packs
create table if not exists public.packs (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    description text,
    weeks jsonb,
    visibility text default 'private',
    price real,
    version int default 1,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists packs_owner_id_idx on public.packs(owner_id);

-- Challenges
create table if not exists public.challenges (
    id uuid primary key default uuid_generate_v4(),
    type text not null check (type in ('coach','ugc','velox')),
    created_by uuid references public.users(id) on delete set null,
    title text not null,
    exercise text not null,
    metric text not null,
    rules jsonb,
    music_mode text,
    verification_level text,
    stakes text,
    vibe_tags text[] default '{}'::text[],
    start_at timestamptz,
    end_at timestamptz,
    visibility text default 'public',
    pack_id uuid references public.packs(id) on delete set null,
    version int default 1,
    status text default 'draft',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists challenges_type_idx on public.challenges(type);
create index if not exists challenges_pack_id_idx on public.challenges(pack_id);
create index if not exists challenges_visibility_idx on public.challenges(visibility);
create index if not exists challenges_created_by_idx on public.challenges(created_by);

-- Challenge Attempts
create table if not exists public.challenge_attempts (
    id uuid primary key default uuid_generate_v4(),
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    score real,
    integrity_score real,
    passed boolean,
    media_id uuid,
    verified boolean default false,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists challenge_attempts_challenge_id_idx on public.challenge_attempts(challenge_id);
create index if not exists challenge_attempts_user_id_idx on public.challenge_attempts(user_id);
create index if not exists challenge_attempts_created_at_idx on public.challenge_attempts(created_at);

-- Optional RLS enablement (policies defined elsewhere)
-- alter table public.packs enable row level security;
-- alter table public.challenges enable row level security;
-- alter table public.challenge_attempts enable row level security;


