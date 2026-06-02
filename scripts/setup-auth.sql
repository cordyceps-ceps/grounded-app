-- Grounded: Auth + family tables
-- Run this in the Supabase SQL Editor

-- Families table
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

-- User profiles (extends Supabase auth.users)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references families(id),
  display_name text,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Baby profiles (one per family for MVP)
create table if not exists baby_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  name text not null,
  born boolean default true,
  dob date,
  due_date date,
  birth_weight text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table families enable row level security;
alter table user_profiles enable row level security;
alter table baby_profiles enable row level security;

-- RLS policies: users can only access their own family's data

-- user_profiles: users can read/update their own profile
create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- families: users can read their own family
create policy "Users can read own family"
  on families for select
  using (id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can create a family"
  on families for insert
  with check (true);

-- baby_profiles: users can access their family's baby profiles
create policy "Users can read family baby profiles"
  on baby_profiles for select
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can insert family baby profiles"
  on baby_profiles for insert
  with check (family_id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can update family baby profiles"
  on baby_profiles for update
  using (family_id in (select family_id from user_profiles where id = auth.uid()));
