-- SQL helper function for dynamic date filtering
create or replace function public.sql(script text)
returns text
language sql
as $$
  select script;
$$;

-- Create friendships table if not exists
create table if not exists public.friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  friend_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- Enable RLS
alter table public.friendships enable row level security;

-- Allow users to read their own friendships
create policy "Users can read their own friendships"
  on public.friendships
  for select
  using (auth.uid() = user_id);

-- Allow users to create friendships
create policy "Users can create friendships"
  on public.friendships
  for insert
  with check (auth.uid() = user_id); 