create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  topic_id text not null default 'bf',
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources text[],
  created_at timestamptz default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users can read family conversations"
  on conversations for select
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can insert family conversations"
  on conversations for insert
  with check (family_id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can update family conversations"
  on conversations for update
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can delete family conversations"
  on conversations for delete
  using (family_id in (select family_id from user_profiles where id = auth.uid()));

create policy "Users can read conversation messages"
  on messages for select
  using (conversation_id in (
    select id from conversations where family_id in (
      select family_id from user_profiles where id = auth.uid()
    )
  ));

create policy "Users can insert conversation messages"
  on messages for insert
  with check (conversation_id in (
    select id from conversations where family_id in (
      select family_id from user_profiles where id = auth.uid()
    )
  ));

create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_conversations_family_id on conversations(family_id);
