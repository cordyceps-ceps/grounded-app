-- Admin analytics functions (service role only — no RLS needed)

-- Count all user messages excluding admin family
CREATE OR REPLACE FUNCTION admin_count_messages(admin_fam uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE m.role = 'user'
    AND c.family_id != admin_fam;
$$;

-- Daily conversation count (last 30 days)
CREATE OR REPLACE FUNCTION admin_daily_conversations(admin_fam uuid, since timestamptz)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT date_trunc('day', created_at)::date AS day, count(*) AS count
  FROM conversations
  WHERE created_at >= since
    AND family_id != admin_fam
  GROUP BY day
  ORDER BY day;
$$;

-- Daily active users (distinct users who sent a message)
CREATE OR REPLACE FUNCTION admin_daily_active_users(admin_fam uuid, since timestamptz)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT date_trunc('day', m.created_at)::date AS day, count(DISTINCT m.user_id) AS count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE m.created_at >= since
    AND m.role = 'user'
    AND c.family_id != admin_fam
  GROUP BY day
  ORDER BY day;
$$;

-- Top N users by conversation count
CREATE OR REPLACE FUNCTION admin_top_users(admin_fam uuid, lim int)
RETURNS TABLE(display_name text, convo_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT up.display_name, count(DISTINCT c.id) AS convo_count
  FROM user_profiles up
  JOIN conversations c ON up.family_id = c.family_id
  WHERE up.family_id != admin_fam
  GROUP BY up.id, up.display_name
  ORDER BY convo_count DESC
  LIMIT lim;
$$;

-- Daily signups
CREATE OR REPLACE FUNCTION admin_daily_signups(admin_fam uuid, since timestamptz)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT date_trunc('day', created_at)::date AS day, count(*) AS count
  FROM user_profiles
  WHERE created_at >= since
    AND family_id != admin_fam
  GROUP BY day
  ORDER BY day;
$$;
