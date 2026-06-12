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
