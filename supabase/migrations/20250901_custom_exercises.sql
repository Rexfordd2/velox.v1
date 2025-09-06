-- Custom Exercise Definitions
-- - Table: public.custom_exercises
-- - RLS: users can CRUD only their own rows
-- - Validation: basic JSON schema validator via check constraint

-- Ensure required extension for gen_random_uuid
create extension if not exists pgcrypto;

-- Validation function for custom exercise JSON schema
create or replace function public.validate_exercise_schema(s jsonb)
returns boolean
language plpgsql
as $$
begin
  if s is null then return false; end if;
  if jsonb_typeof(s) <> 'object' then return false; end if;

  -- movementType is required and must be a string
  if not (s ? 'movementType') then return false; end if;
  if jsonb_typeof(s->'movementType') <> 'string' then return false; end if;

  -- Optional keys must be the expected types when present
  if (s ? 'joints') and jsonb_typeof(s->'joints') <> 'array' then return false; end if;
  if (s ? 'ranges') and jsonb_typeof(s->'ranges') <> 'array' then return false; end if;
  if (s ? 'cues') and jsonb_typeof(s->'cues') <> 'array' then return false; end if;
  if (s ? 'tempo') and (jsonb_typeof(s->'tempo') not in ('string','object')) then return false; end if;

  return true;
end;
$$;

-- Table for user-defined custom exercises
create table if not exists public.custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_exercises_schema_valid check (public.validate_exercise_schema(schema))
);

-- Case-insensitive uniqueness per user
create unique index if not exists custom_exercises_user_name_unique
  on public.custom_exercises(user_id, lower(name));

-- Helpful index for querying by user
create index if not exists idx_custom_exercises_user on public.custom_exercises(user_id);

-- Trigger to keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_custom_exercises_updated on public.custom_exercises;
create trigger trg_custom_exercises_updated
before update on public.custom_exercises
for each row execute function public.set_updated_at();

-- Enable Row Level Security and add policies
alter table public.custom_exercises enable row level security;

drop policy if exists "custom_exercises_select_own" on public.custom_exercises;
create policy "custom_exercises_select_own"
  on public.custom_exercises
  for select
  using (auth.uid() = user_id);

drop policy if exists "custom_exercises_insert_own" on public.custom_exercises;
create policy "custom_exercises_insert_own"
  on public.custom_exercises
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "custom_exercises_update_own" on public.custom_exercises;
create policy "custom_exercises_update_own"
  on public.custom_exercises
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "custom_exercises_delete_own" on public.custom_exercises;
create policy "custom_exercises_delete_own"
  on public.custom_exercises
  for delete
  using (auth.uid() = user_id);

-- Optional: minimal sanity check via a dry run (no-op without a logged-in user)
-- insert into public.custom_exercises (user_id, name, schema)
-- values (auth.uid(), 'Tempo Squat', '{"movementType":"squat","joints":["hip","knee"],"ranges":[],"cues":["chest up","knees track"]}'::jsonb)
-- on conflict do nothing;


