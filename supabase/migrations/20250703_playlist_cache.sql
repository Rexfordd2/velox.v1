create table if not exists public.playlist_cache (
  playlist_id  text primary key,
  fetched_at   timestamptz not null default now(),
  features     jsonb       not null
);

-- RLS: anyone can select, only ownerless service role can insert/update
alter table public.playlist_cache enable row level security;

create policy "read cache" on public.playlist_cache
  for select using ( true );

create policy "service upsert cache" on public.playlist_cache
  for insert with check ( auth.role() = 'service_role' )
  to service_role;

create policy "service update cache" on public.playlist_cache
  for update using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' )
  to service_role; 