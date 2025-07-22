create materialized view if not exists public.weekly_progress as
select
  user_id,
  movement_id,
  date_trunc('week', created_at) as week_start,
  max(score)                    as best_velocity
from public.movement_scores
group by 1,2,3
order by 3 desc;
-- refresh every insert trigger
create or replace function public.refresh_weekly_progress()
returns trigger language plpgsql as $$
begin
  refresh materialized view concurrently public.weekly_progress;
  return null;
end $$;
drop trigger if exists refresh_weekly_progress_tg on public.movement_scores;
create trigger refresh_weekly_progress_tg
after insert on public.movement_scores
for each statement execute procedure public.refresh_weekly_progress();
-- RLS
alter materialized view public.weekly_progress enable row level security;
create policy "users view own progress"
  on public.weekly_progress for select
  using ( auth.uid() = user_id ); 