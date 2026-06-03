CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 30);

CREATE OR REPLACE FUNCTION match_chunks_semantic(
  query_embedding extensions.vector(1536),
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
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_limit;
$$;
