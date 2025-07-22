insert into public.posts (id, user_id, content)
select gen_random_uuid(), auth.uid(), '🚀 Hello from my phone feed!'
where not exists (select 1 from public.posts limit 1); 