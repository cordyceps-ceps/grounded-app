import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
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
`;

const { data, error } = await supabase.rpc('exec_sql', { query: sql });

if (error) {
  // If rpc doesn't exist, try raw SQL via the management API
  console.log('RPC not available, trying direct approach...');

  // Split and execute each statement
  const statements = sql.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    const { error: stmtError } = await supabase.from('_').select().limit(0);
    // This approach won't work either - we need the SQL editor
  }

  console.log('Cannot execute raw SQL via REST API.');
  console.log('Please run this SQL in the Supabase SQL Editor:');
  console.log('Dashboard → SQL Editor → New Query → paste and run:\n');
  console.log(sql);
} else {
  console.log('Tables created successfully!');
}
