-- Dumbo Couple Hub - Complete Database Schema & Row Level Security (RLS) Policies

-- 1. Create Core Tables

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pairing_code text unique,
  pairing_code_expires_at timestamptz
);

create table if not exists users (
  id text primary key,
  couple_id uuid references couples(id),
  display_name text not null,
  avatar_url text,
  is_dnd boolean default false,
  is_online boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  title text not null,
  artist text,
  storage_path text not null,
  cover_art_url text,
  duration_seconds integer default 180,
  added_by text references users(id),
  added_by_name text,
  queue_position integer,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  sender_id text references users(id),
  sender_name text,
  content text,
  photo_storage_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists hydration_logs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  user_id text references users(id),
  user_name text,
  logged_at timestamptz not null default now(),
  amount_ml integer not null default 250
);

create table if not exists saved_doodles (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  created_by text references users(id),
  created_by_name text,
  title text default 'Untitled Doodle',
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  phase text not null default 'idle', -- 'focus', 'break', 'idle'
  remaining_seconds integer not null default 1500,
  total_seconds integer not null default 1500,
  started_by text references users(id),
  started_by_name text,
  is_running boolean default false,
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS) for 2-user couple isolation

alter table couples enable row level security;
alter table users enable row level security;
alter table songs enable row level security;
alter table chat_messages enable row level security;
alter table hydration_logs enable row level security;
alter table saved_doodles enable row level security;
alter table pomodoro_sessions enable row level security;

-- 3. RLS Policies Pattern for Couple Isolation

-- Couples table policy
create policy "couple_isolation_select_couples" on couples
  for select using (
    id = (select couple_id from users where id = auth.uid())
  );

-- Users table policies
create policy "couple_isolation_select_users" on users
  for select using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_update_users" on users
  for update using (
    id = auth.uid()
  );

-- Songs table policies
create policy "couple_isolation_select_songs" on songs
  for select using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_insert_songs" on songs
  for insert with check (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_update_songs" on songs
  for update using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_delete_songs" on songs
  for delete using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

-- Chat messages policies
create policy "couple_isolation_select_chat" on chat_messages
  for select using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_insert_chat" on chat_messages
  for insert with check (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_update_chat" on chat_messages
  for update using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

-- Hydration logs policies
create policy "couple_isolation_select_hydration" on hydration_logs
  for select using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_insert_hydration" on hydration_logs
  for insert with check (
    couple_id = (select couple_id from users where id = auth.uid())
  );

-- Saved doodles policies
create policy "couple_isolation_select_doodles" on saved_doodles
  for select using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_insert_doodles" on saved_doodles
  for insert with check (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_delete_doodles" on saved_doodles
  for delete using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

-- Pomodoro sessions policies
create policy "couple_isolation_select_pomodoro" on pomodoro_sessions
  for select using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_insert_pomodoro" on pomodoro_sessions
  for insert with check (
    couple_id = (select couple_id from users where id = auth.uid())
  );

create policy "couple_isolation_update_pomodoro" on pomodoro_sessions
  for update using (
    couple_id = (select couple_id from users where id = auth.uid())
  );

-- 4. Storage Buckets (Execute via Supabase Dashboard or API)
-- Bucket Names: 'photos', 'audio', 'doodles'
-- Public: true for all three buckets
