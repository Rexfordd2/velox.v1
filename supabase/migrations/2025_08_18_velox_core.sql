-- Velox core schema migration
-- Date: 2025-08-18

-- Utility: admin check based on JWT claims
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
as $$
declare
  claims jsonb;
  role text;
  is_admin_flag boolean;
begin
  begin
    claims := current_setting('request.jwt.claims', true)::jsonb;
  exception when others then
    claims := '{}'::jsonb;
  end;

  role := coalesce(claims->>'role', '');
  is_admin_flag := false;
  begin
    is_admin_flag := coalesce((claims->>'is_admin')::boolean, false);
  exception when others then
    is_admin_flag := false;
  end;

  return role = 'admin' or is_admin_flag;
end;
$$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key,
  handle text unique,
  dob date,
  body_weight_kg real,
  experience text,
  region text,
  gym text,
  school text,
  coaching_style text,
  strictness text,
  units jsonb,
  created_at timestamptz default now()
);

create table if not exists public.workouts (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  device jsonb,
  beat_source text,
  vibe_tags text[]
);

create table if not exists public.sets (
  id uuid primary key,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise text not null,
  load_kg real,
  notes text,
  strictness text,
  verified boolean default false
);

create table if not exists public.reps (
  id uuid primary key,
  set_id uuid not null references public.sets(id) on delete cascade,
  idx int,
  start_ts timestamptz,
  end_ts timestamptz,
  rom_m real,
  tut_ms int,
  mean_con_vel real,
  peak_con_vel real,
  mean_ecc_vel real,
  peak_ecc_vel real,
  mpv real,
  power_w real,
  vel_loss_pct real,
  est1rm real,
  lv_slope real,
  flow_score real,
  form_score real,
  beat_adherence_pct real,
  integrity_score real,
  eligible boolean default true
);

create table if not exists public.media (
  id uuid primary key,
  workout_id uuid references public.workouts(id) on delete cascade,
  set_id uuid references public.sets(id) on delete cascade,
  rep_id uuid references public.reps(id) on delete cascade,
  angle int,
  url text,
  checksum text,
  verified boolean,
  local_only boolean default true
);

create table if not exists public.leaderboards (
  id bigserial primary key,
  exercise text not null,
  bucket jsonb not null,
  score real not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rep_id uuid references public.reps(id) on delete set null,
  created_at timestamptz default now(),
  verified boolean default false
);

create table if not exists public.flags (
  id bigserial primary key,
  rep_id uuid references public.reps(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists workouts_started_at_idx on public.workouts (started_at);
create index if not exists workouts_user_idx on public.workouts (user_id);
create index if not exists sets_workout_idx on public.sets (workout_id);
create index if not exists sets_exercise_idx on public.sets (exercise);
create index if not exists reps_set_idx on public.reps (set_id);
create index if not exists reps_start_ts_idx on public.reps (start_ts);
create index if not exists media_rep_idx on public.media (rep_id);
create index if not exists leaderboards_exercise_idx on public.leaderboards (exercise);
create index if not exists leaderboards_user_created_idx on public.leaderboards (user_id, created_at);
create index if not exists leaderboards_bucket_gin on public.leaderboards using gin (bucket);

-- RLS
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.sets enable row level security;
alter table public.reps enable row level security;
alter table public.media enable row level security;
alter table public.leaderboards enable row level security;

-- Profiles policies: user can select own; admins for moderation
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert
  with check (id = auth.uid() or public.is_admin());

-- Workouts: owner full, admin full
drop policy if exists workouts_owner_select on public.workouts;
create policy workouts_owner_select on public.workouts for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists workouts_owner_modify on public.workouts;
create policy workouts_owner_modify on public.workouts for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Sets: owner via workout
drop policy if exists sets_owner_select on public.sets;
create policy sets_owner_select on public.sets for select
  using (exists (
    select 1 from public.workouts w where w.id = sets.workout_id and (w.user_id = auth.uid() or public.is_admin())
  ));

drop policy if exists sets_owner_modify on public.sets;
create policy sets_owner_modify on public.sets for all
  using (exists (
    select 1 from public.workouts w where w.id = sets.workout_id and (w.user_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.workouts w where w.id = sets.workout_id and (w.user_id = auth.uid() or public.is_admin())
  ));

-- Reps: owner via set->workout
drop policy if exists reps_owner_select on public.reps;
create policy reps_owner_select on public.reps for select
  using (exists (
    select 1 from public.sets s join public.workouts w on w.id = s.workout_id
    where s.id = reps.set_id and (w.user_id = auth.uid() or public.is_admin())
  ));

drop policy if exists reps_owner_modify on public.reps;
create policy reps_owner_modify on public.reps for all
  using (exists (
    select 1 from public.sets s join public.workouts w on w.id = s.workout_id
    where s.id = reps.set_id and (w.user_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.sets s join public.workouts w on w.id = s.workout_id
    where s.id = reps.set_id and (w.user_id = auth.uid() or public.is_admin())
  ));

-- Media: owner via workout/set/rep
drop policy if exists media_owner_select on public.media;
create policy media_owner_select on public.media for select
  using (
    exists (select 1 from public.workouts w where w.id = media.workout_id and (w.user_id = auth.uid() or public.is_admin()))
    or exists (select 1 from public.sets s join public.workouts w on w.id = s.workout_id where s.id = media.set_id and (w.user_id = auth.uid() or public.is_admin()))
    or exists (select 1 from public.reps r join public.sets s on s.id = r.set_id join public.workouts w on w.id = s.workout_id where r.id = media.rep_id and (w.user_id = auth.uid() or public.is_admin()))
  );

drop policy if exists media_owner_modify on public.media;
create policy media_owner_modify on public.media for all
  using (
    exists (select 1 from public.workouts w where w.id = media.workout_id and (w.user_id = auth.uid() or public.is_admin()))
    or exists (select 1 from public.sets s join public.workouts w on w.id = s.workout_id where s.id = media.set_id and (w.user_id = auth.uid() or public.is_admin()))
    or exists (select 1 from public.reps r join public.sets s on s.id = r.set_id join public.workouts w on w.id = s.workout_id where r.id = media.rep_id and (w.user_id = auth.uid() or public.is_admin()))
  )
  with check (
    exists (select 1 from public.workouts w where w.id = media.workout_id and (w.user_id = auth.uid() or public.is_admin()))
    or exists (select 1 from public.sets s join public.workouts w on w.id = s.workout_id where s.id = media.set_id and (w.user_id = auth.uid() or public.is_admin()))
    or exists (select 1 from public.reps r join public.sets s on s.id = r.set_id join public.workouts w on w.id = s.workout_id where r.id = media.rep_id and (w.user_id = auth.uid() or public.is_admin()))
  );

-- Leaderboards: readable by all; writes restricted to admins (service role bypasses)
drop policy if exists leaderboards_select_all on public.leaderboards;
create policy leaderboards_select_all on public.leaderboards for select using (true);

drop policy if exists leaderboards_admin_write on public.leaderboards;
create policy leaderboards_admin_write on public.leaderboards for all
  using (public.is_admin())
  with check (public.is_admin());


