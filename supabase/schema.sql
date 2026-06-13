-- Users
create table users (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  age_range text,
  interests text[] default '{}',
  notifications jsonb default '{"email": true, "whatsapp": true, "app": false}',
  created_at timestamp with time zone default now()
);

-- Events
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null,
  color text,
  icon text,
  description text,
  location text,
  audience text default 'Open to everyone',
  recurring text,
  event_date date,
  start_time time,
  end_time time,
  created_at timestamp with time zone default now()
);

-- Event RSVPs
create table event_rsvps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, event_id)
);

-- Midweek groups
create table midweek_groups (
  id uuid default gen_random_uuid() primary key,
  host text not null,
  initials text,
  zone text,
  address text,
  phone text,
  lat decimal,
  lng decimal,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Midweek RSVPs
create table midweek_rsvps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  group_id uuid references midweek_groups(id) on delete cascade,
  week_date date not null,
  created_at timestamp with time zone default now(),
  unique(user_id, week_date)
);

-- News
create table news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  category text default 'Announcement',
  color text default '#5b8cff',
  published_at date default current_date,
  created_at timestamp with time zone default now()
);

-- Link app profiles to Supabase Auth users
alter table users add column if not exists auth_id uuid references auth.users(id) on delete cascade;
create unique index if not exists users_auth_id_idx on users(auth_id);

-- Push subscriptions
create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamp with time zone default now(),
  unique(user_id)
);

-- Schedule the send-reminders edge function to run every 15 minutes.
-- Requires the pg_cron and pg_net extensions enabled (Database -> Extensions),
-- and `app.service_role_key` set via:
--   alter database postgres set app.service_role_key = '<your-service-role-key>';
-- Replace [YOUR-PROJECT-REF] with the project ref from Settings -> General.
select cron.schedule(
  'send-event-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  ) as request_id;
  $$
);
