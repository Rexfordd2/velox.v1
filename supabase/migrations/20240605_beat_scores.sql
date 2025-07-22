create table public.beat_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  bpm integer not null,
  score integer not null,
  reps integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.beat_scores enable row level security;

-- Allow users to read their own scores
create policy "Users can read their own scores"
  on public.beat_scores
  for select
  using (auth.uid() = user_id);

-- Allow users to insert their own scores
create policy "Users can insert their own scores"
  on public.beat_scores
  for insert
  with check (auth.uid() = user_id); 