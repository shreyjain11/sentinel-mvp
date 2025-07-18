-- Fix Gmail Tokens Schema
-- Make refresh_token optional or provide a default value

-- Option 1: Make refresh_token nullable (if you want to allow NULL values)
-- ALTER TABLE gmail_tokens ALTER COLUMN refresh_token DROP NOT NULL;

-- Option 2: Add a default value for refresh_token
ALTER TABLE gmail_tokens ALTER COLUMN refresh_token SET DEFAULT 'no_refresh_token_available';

-- Option 3: Update existing records that might have NULL or empty refresh_token
UPDATE gmail_tokens 
SET refresh_token = 'legacy_refresh_token' 
WHERE refresh_token IS NULL OR refresh_token = '';

-- Verify the current schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'gmail_tokens' 
ORDER BY ordinal_position; 