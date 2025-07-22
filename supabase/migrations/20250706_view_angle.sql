do $$
begin
  if not exists (select 1 from pg_type where typname = 'view_angle') then
    create type public.view_angle as enum ('front', 'side');
  end if;
end$$;

alter table public.sessions
  add column if not exists view_angle public.view_angle not null default 'front'; 