create table if not exists public.device_settings (
  user_id uuid references public.profiles(id) on delete cascade,
  px_per_meter numeric not null,
  primary key (user_id)
);

alter table public.device_settings enable row level security;

create policy "Users access own settings"
  on public.device_settings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id); 