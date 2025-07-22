-- Create challenges table
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  challenger_id uuid references auth.users(id) on delete cascade not null,
  opponent_id uuid references auth.users(id) on delete cascade not null,
  movement text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.challenges enable row level security;

-- Allow users to read their own challenges (as challenger or opponent)
create policy "Users can read their own challenges"
  on public.challenges
  for select
  using (auth.uid() in (challenger_id, opponent_id));

-- Allow users to create challenges
create policy "Users can create challenges"
  on public.challenges
  for insert
  with check (auth.uid() = challenger_id);

-- Create challenge function with broadcast
create or replace function public.create_challenge(opponent_id uuid, movement text)
returns void
language plpgsql
security definer
as $$
declare
  new_challenge challenges;
begin
  -- Don't allow challenging yourself
  if opponent_id = auth.uid() then
    raise exception 'Cannot challenge yourself';
  end if;

  -- Insert the challenge
  insert into public.challenges (challenger_id, opponent_id, movement)
  values (auth.uid(), opponent_id, movement)
  returning * into new_challenge;

  -- Broadcast to realtime
  perform pg_notify(
    'realtime',
    json_build_object(
      'type', 'broadcast',
      'event', 'new_challenge',
      'topic', 'challenges',
      'payload', row_to_json(new_challenge)
    )::text
  );
end;
$$; 