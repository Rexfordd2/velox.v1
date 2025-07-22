-- Create performance_logs table
create table if not exists performance_logs (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null,
  user_id uuid references auth.users(id),
  start_time timestamptz not null,
  end_time timestamptz,
  
  -- Video metrics
  video_metrics jsonb,
  upload_duration int,
  processing_duration int,
  analysis_duration int,
  total_duration int,
  frame_rate int,
  
  -- Quality metrics
  confidence_scores float[],
  errors jsonb[],
  marks jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create performance_alerts table
create table if not exists performance_alerts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references performance_logs(session_id),
  type text not null,
  message text not null,
  value float not null,
  timestamp timestamptz not null,
  acknowledged boolean default false,
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_performance_logs_session_id on performance_logs(session_id);
create index if not exists idx_performance_logs_user_id on performance_logs(user_id);
create index if not exists idx_performance_logs_start_time on performance_logs(start_time);
create index if not exists idx_performance_alerts_session_id on performance_alerts(session_id);
create index if not exists idx_performance_alerts_type on performance_alerts(type);
create index if not exists idx_performance_alerts_timestamp on performance_alerts(timestamp);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger update_performance_logs_updated_at
  before update on performance_logs
  for each row
  execute function update_updated_at_column();

create trigger update_performance_alerts_updated_at
  before update on performance_alerts
  for each row
  execute function update_updated_at_column();

-- Add RLS policies
alter table performance_logs enable row level security;
alter table performance_alerts enable row level security;

-- Users can view their own performance logs
create policy "Users can view own performance logs"
  on performance_logs for select
  using (auth.uid() = user_id);

-- Users can insert their own performance logs
create policy "Users can insert own performance logs"
  on performance_logs for insert
  with check (auth.uid() = user_id);

-- Users can view alerts for their own sessions
create policy "Users can view own performance alerts"
  on performance_alerts for select
  using (exists (
    select 1 from performance_logs
    where performance_logs.session_id = performance_alerts.session_id
    and performance_logs.user_id = auth.uid()
  ));

-- Create view for performance summary
create or replace view performance_summary as
select
  user_id,
  date_trunc('hour', start_time) as time_bucket,
  count(*) as total_sessions,
  avg(total_duration) as avg_duration,
  avg(array_length(confidence_scores, 1)) as avg_confidence_scores,
  avg(array_length(errors, 1)) as avg_errors
from performance_logs
group by user_id, date_trunc('hour', start_time); 