-- Grounded: Invite system + message attribution
-- Run this in the Supabase SQL Editor

-- Invites table
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  used_by uuid references auth.users(id),
  used_at timestamptz
);

-- Add user_id to messages for attribution
alter table messages add column if not exists user_id uuid references auth.users(id);

-- Enable RLS
alter table invites enable row level security;

-- Family members can see their own family's invites
create policy "Users can read own family invites"
  on invites for select
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

-- Family members can create invites for their family
create policy "Users can create invites for own family"
  on invites for insert
  with check (family_id in (select family_id from user_profiles where id = auth.uid()));

-- Anyone authenticated can look up an invite by code (for redemption)
-- This is handled server-side with service role key, so no extra policy needed

-- Allow updating invites (marking as used) via service role only
-- No user-facing update policy needed

-- Index for fast code lookups
create index if not exists idx_invites_code on invites(code);
create index if not exists idx_invites_family on invites(family_id);
