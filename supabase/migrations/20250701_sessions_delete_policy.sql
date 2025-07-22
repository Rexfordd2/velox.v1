-- Allow users to DELETE only their own sessions
alter table public.sessions enable row level security;

create policy "Users can delete their sessions"
  on public.sessions for delete
  using ( auth.uid() = user_id );

-- make sure movement_scores already has ON DELETE CASCADE (adjust if missing)
alter table public.movement_scores
  drop constraint if exists movement_scores_session_id_fkey,
  add constraint movement_scores_session_id_fkey
    foreign key (session_id) references public.sessions(id) on delete cascade;

-- reps already references session_id / set_id ON DELETE CASCADE from prior migration 