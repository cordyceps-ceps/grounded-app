-- Grounded: Multi-topic migration
-- Adds topic_id to document_chunks and updates all search RPCs
-- Run in Supabase Dashboard → SQL Editor → New Query

-- 1. Add topic_id column (default 'bf' backfills existing chunks)
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS topic_id TEXT NOT NULL DEFAULT 'bf';
CREATE INDEX IF NOT EXISTS idx_chunks_topic ON document_chunks (topic_id);

-- 2. Drop old function signatures so we can recreate with topic param
DROP FUNCTION IF EXISTS search_chunks(TEXT, INTEGER);
DROP FUNCTION IF EXISTS match_chunks_semantic(extensions.vector, INT, FLOAT);

-- 3. Keyword search (AND-based) — now topic-scoped
CREATE OR REPLACE FUNCTION search_chunks(
  search_query TEXT,
  topic TEXT DEFAULT 'bf',
  match_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id BIGINT,
  book_title TEXT,
  book_author TEXT,
  content TEXT,
  chunk_index INTEGER,
  rank REAL
)
LANGUAGE sql
AS $$
  SELECT
    dc.id,
    dc.book_title,
    dc.book_author,
    dc.content,
    dc.chunk_index,
    ts_rank(to_tsvector('english', dc.content), websearch_to_tsquery('english', search_query)) AS rank
  FROM document_chunks dc
  WHERE dc.topic_id = topic
    AND to_tsvector('english', dc.content) @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT match_limit;
$$;

-- 4. Semantic vector search — now topic-scoped
CREATE OR REPLACE FUNCTION match_chunks_semantic(
  query_embedding extensions.vector(1536),
  topic TEXT DEFAULT 'bf',
  match_limit INT DEFAULT 8,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id BIGINT,
  book_title TEXT,
  book_author TEXT,
  content TEXT,
  chunk_index INT,
  similarity FLOAT
) LANGUAGE sql AS $$
  SELECT
    dc.id,
    dc.book_title,
    dc.book_author,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.topic_id = topic
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_limit;
$$;

-- 5. Broad OR-based search (was missing — now created, topic-scoped)
CREATE OR REPLACE FUNCTION search_chunks_broad(
  search_terms TEXT[],
  topic TEXT DEFAULT 'bf',
  match_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  id BIGINT,
  book_title TEXT,
  book_author TEXT,
  content TEXT,
  chunk_index INTEGER,
  rank REAL
)
LANGUAGE sql
AS $$
  SELECT
    dc.id,
    dc.book_title,
    dc.book_author,
    dc.content,
    dc.chunk_index,
    ts_rank(to_tsvector('english', dc.content), to_tsquery('english', array_to_string(search_terms, ' | '))) AS rank
  FROM document_chunks dc
  WHERE dc.topic_id = topic
    AND to_tsvector('english', dc.content) @@ to_tsquery('english', array_to_string(search_terms, ' | '))
  ORDER BY rank DESC
  LIMIT match_limit;
$$;
