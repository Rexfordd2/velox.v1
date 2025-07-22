alter table public.reps
  add column if not exists confidence numeric check (confidence >= 0 and confidence <= 1) default 0.5; 