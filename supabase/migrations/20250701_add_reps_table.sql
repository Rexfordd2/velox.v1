-- Reps table (per-rep metrics)
create table if not exists public.reps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  set_id uuid references public.movement_scores(id) on delete cascade,
  rep_index int not null,
  metrics jsonb not null,  -- { tempo: {ecc:Ms, con:Ms}, rom:Deg, peakVel:Num, score:Int }
  created_at timestamptz default now()
);

alter table public.reps enable row level security;
create policy "users own their reps"
  on public.reps for all using ( auth.uid() = (
    select user_id from public.sessions s where s.id = session_id
  )); 