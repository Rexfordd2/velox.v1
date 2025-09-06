create table if not exists public.user_calibration (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_calibration enable row level security;

create policy "Users can view own calibration" on public.user_calibration
  for select using (auth.uid() = id);

create policy "Users can upsert own calibration" on public.user_calibration
  for insert with check (auth.uid() = id);

create policy "Users can update own calibration" on public.user_calibration
  for update using (auth.uid() = id);


