-- 🚀 Demo post
insert into public.posts(id,user_id,content,created_at)
values (gen_random_uuid(), auth.uid(), 'First post from my local Velox build!', now())
on conflict do nothing;

-- 🏋🏻 Demo movement score for "squat"
insert into public.movement_scores(id,user_id,movement_id,score,created_at)
values (gen_random_uuid(), auth.uid(), 'squat', 1.25, now())
on conflict do nothing; 