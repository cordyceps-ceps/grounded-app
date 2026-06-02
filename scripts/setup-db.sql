-- Grounded: Database setup
-- Run this in Supabase Dashboard → SQL Editor → New Query

-- Document chunks table for RAG
CREATE TABLE IF NOT EXISTS document_chunks (
  id BIGSERIAL PRIMARY KEY,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  chapter TEXT,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_chunks_fts
ON document_chunks
USING GIN (to_tsvector('english', content));

-- Index for filtering by book
CREATE INDEX IF NOT EXISTS idx_chunks_book
ON document_chunks (book_title);

-- Full-text search function
CREATE OR REPLACE FUNCTION search_chunks(
  search_query TEXT,
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
  WHERE to_tsvector('english', dc.content) @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT match_limit;
$$;
