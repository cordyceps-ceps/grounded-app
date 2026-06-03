-- Add pinned column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Index for quick lookup of pinned messages
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(pinned) WHERE pinned = true;
