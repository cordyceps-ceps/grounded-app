-- Video recommendations table
-- Stores indexed YouTube videos from vetted channels/playlists per topic

CREATE TABLE IF NOT EXISTS topic_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id TEXT NOT NULL,
  channel_handle TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  duration TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast topic filtering
CREATE INDEX IF NOT EXISTS idx_topic_videos_topic ON topic_videos(topic_id);

-- IVFFlat index for semantic search on embeddings
CREATE INDEX IF NOT EXISTS idx_topic_videos_embedding ON topic_videos
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- RPC function for semantic video search
CREATE OR REPLACE FUNCTION match_videos_semantic(
  query_embedding TEXT,
  topic TEXT,
  match_limit INT DEFAULT 3,
  similarity_threshold FLOAT DEFAULT 0.28
)
RETURNS TABLE (
  id UUID,
  video_id TEXT,
  title TEXT,
  description TEXT,
  channel_name TEXT,
  channel_handle TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  published_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tv.id,
    tv.video_id,
    tv.title,
    tv.description,
    tv.channel_name,
    tv.channel_handle,
    tv.thumbnail_url,
    tv.duration,
    tv.published_at,
    1 - (tv.embedding <=> query_embedding::vector) AS similarity
  FROM topic_videos tv
  WHERE tv.topic_id = topic
    AND tv.embedding IS NOT NULL
    AND 1 - (tv.embedding <=> query_embedding::vector) > similarity_threshold
  ORDER BY tv.embedding <=> query_embedding::vector
  LIMIT match_limit;
END;
$$;
