-- Aggregate personal bests per exercise type for a user (removes N+1 calls)
create or replace function public.get_user_personal_bests(
  p_user_id uuid
) returns table (
  exercise_type text,
  best_form_score integer,
  best_form_score_date timestamptz,
  max_reps integer,
  max_reps_date timestamptz,
  best_duration integer,
  best_duration_date timestamptz,
  max_weight numeric,
  max_weight_date timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  return query
  with et as (
    select distinct exercise_type
    from workout_sessions
    where user_id = p_user_id and exercise_type is not null
  )
  select
    et.exercise_type,
    -- best form score and its date
    (select ws.form_score from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type
      order by ws.form_score desc nulls last, ws.created_at desc
      limit 1) as best_form_score,
    (select ws.created_at from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type
      order by ws.form_score desc nulls last, ws.created_at desc
      limit 1) as best_form_score_date,
    -- max reps and date
    (select ws.rep_count from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type
      order by ws.rep_count desc nulls last, ws.created_at desc
      limit 1) as max_reps,
    (select ws.created_at from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type
      order by ws.rep_count desc nulls last, ws.created_at desc
      limit 1) as max_reps_date,
    -- best duration and date
    (select ws.duration from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type
      order by ws.duration desc nulls last, ws.created_at desc
      limit 1) as best_duration,
    (select ws.created_at from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type
      order by ws.duration desc nulls last, ws.created_at desc
      limit 1) as best_duration_date,
    -- max weight and date (when present)
    (select ws.weight from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type and ws.weight is not null
      order by ws.weight desc nulls last, ws.created_at desc
      limit 1) as max_weight,
    (select ws.created_at from workout_sessions ws
      where ws.user_id = p_user_id and ws.exercise_type = et.exercise_type and ws.weight is not null
      order by ws.weight desc nulls last, ws.created_at desc
      limit 1) as max_weight_date;
end;
$$;


