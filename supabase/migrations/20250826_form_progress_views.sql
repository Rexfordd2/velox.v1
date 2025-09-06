-- Form progress daily and rolling trends
-- View: v_form_daily(user_id, exercise, date, reps, avg_score, p95_score, rom_mean)
-- Materialized view: mv_form_rolling_28d(user_id, exercise, date, avg28d, delta7d)

create or replace view public.v_form_daily as
with rep_days as (
  select
    w.user_id,
    s.exercise,
    date_trunc('day', coalesce(r.start_ts, w.started_at))::date as date,
    r.form_score,
    r.rom_m,
    r.eligible
  from public.reps r
  join public.sets s on s.id = r.set_id
  join public.workouts w on w.id = s.workout_id
)
select
  user_id,
  exercise,
  date,
  count(*) filter (where eligible) as reps,
  avg(form_score) filter (where eligible) as avg_score,
  percentile_cont(0.95) within group (order by form_score) filter (where eligible) as p95_score,
  avg(rom_m) filter (where eligible) as rom_mean
from rep_days
group by 1,2,3;

drop materialized view if exists public.mv_form_rolling_28d;
create materialized view public.mv_form_rolling_28d as
with d as (
  select * from public.v_form_daily
),
ordered as (
  select
    user_id,
    exercise,
    date,
    avg_score
  from d
)
select
  user_id,
  exercise,
  date,
  -- 28-day rolling average of daily avg_score
  avg(avg_score) over (
    partition by user_id, exercise
    order by date
    rows between 27 preceding and current row
  ) as avg28d,
  -- Difference between last 7 days avg and the 7 days before that
  (
    avg(avg_score) over (
      partition by user_id, exercise
      order by date
      rows between 6 preceding and current row
    )
    -
    avg(avg_score) over (
      partition by user_id, exercise
      order by date
      rows between 13 preceding and 7 preceding
    )
  ) as delta7d
from ordered;

create index if not exists mv_form_rolling_28d_idx
  on public.mv_form_rolling_28d (user_id, exercise, date);

-- Optional convenience function to refresh concurrently when supported
create or replace function public.refresh_form_trends()
returns void
language sql
as $$
  refresh materialized view concurrently public.mv_form_rolling_28d;
$$;

-- Enable RLS and policies to restrict rows to owners
alter view public.v_form_daily set (security_invoker = on);
alter materialized view public.mv_form_rolling_28d set (security_invoker = on);

-- RLS-like policies via SECURITY INVOKER views typically rely on underlying tables' RLS.
-- Ensure underlying tables (workouts, sets, reps) already enforce auth.uid() = user_id visibility.

-- Optional: listen/notify hook to refresh rolling view asynchronously
create or replace function public.queue_refresh_form_trends()
returns trigger as $$
begin
  perform pg_notify('refresh_form_trends', '');
  return null;
end; $$ language plpgsql;

drop trigger if exists trg_refresh_form_trends on public.reps;
create trigger trg_refresh_form_trends
after insert or update or delete on public.reps
for each statement execute procedure public.queue_refresh_form_trends();


