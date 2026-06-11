-- Allow topic_id to be NULL for global facts (facts that apply across all topics)
ALTER TABLE topic_facts ALTER COLUMN topic_id DROP NOT NULL;

-- Update the index to handle NULL topic_id
DROP INDEX IF EXISTS idx_facts_family_topic;
CREATE INDEX idx_facts_family_topic ON topic_facts(family_id, topic_id);
