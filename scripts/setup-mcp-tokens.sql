-- Grounded: MCP connector tokens
-- Personal tokens that let a family connect Claude (custom connector) to Grounded.
-- The token is embedded in the connector URL: /api/mcp/connect/<token>
-- Run this in the Supabase SQL Editor.

create table if not exists mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table mcp_tokens enable row level security;

-- Family members can see their own family's tokens
create policy "Users can read own family mcp tokens"
  on mcp_tokens for select
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

-- Family members can create tokens for their family
create policy "Users can create mcp tokens for own family"
  on mcp_tokens for insert
  with check (family_id in (select family_id from user_profiles where id = auth.uid()));

-- Family members can revoke (update) their own family's tokens
create policy "Users can update own family mcp tokens"
  on mcp_tokens for update
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

-- Token lookups happen server-side via the service role key (no user-facing lookup policy needed).

create index if not exists idx_mcp_tokens_token on mcp_tokens(token);
create index if not exists idx_mcp_tokens_family on mcp_tokens(family_id);
