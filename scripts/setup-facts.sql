-- Topic facts: short statements about the baby, scoped per topic per family
CREATE TABLE IF NOT EXISTS topic_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE topic_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_family_facts" ON topic_facts FOR SELECT
  USING (family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "insert_family_facts" ON topic_facts FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "update_family_facts" ON topic_facts FOR UPDATE
  USING (family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "delete_family_facts" ON topic_facts FOR DELETE
  USING (family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_facts_family_topic ON topic_facts(family_id, topic_id);
