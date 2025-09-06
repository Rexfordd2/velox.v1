-- Exercises list (with filters)
explain analyze verbose
select e.*
from public.exercises e
left join public.exercise_to_category etc on etc.exercise_id = e.id
left join public.exercise_categories c on c.id = etc.category_id
where e.deleted_at is null
  and ($1::text is null or e.name ilike ('%' || $1 || '%'))
  and ($2::text is null or e.difficulty = $2)
  and ($3::text is null or e.primary_muscle = $3)
  and ($4::bigint is null or etc.category_id = $4)
order by e.created_at desc
limit $5;

-- Exercises detail by slug
explain analyze verbose
select e.*
from public.exercises e
where e.slug = $1 and e.deleted_at is null
limit 1;

-- Posts infinite feed
explain analyze verbose
select * from public.posts
order by created_at desc
limit $1;

-- Workout sessions history
explain analyze verbose
select * from public.workout_sessions
where user_id = $1
order by created_at desc
limit $2;


