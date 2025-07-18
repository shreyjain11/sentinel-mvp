-- Setup Gmail Tokens Table
-- Run this in your Supabase SQL editor to ensure the table exists

-- Create gmail_tokens table to store OAuth tokens securely
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one token record per user
  UNIQUE(user_id)
);

-- Enable RLS on gmail_tokens table
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own Gmail tokens" ON gmail_tokens;
DROP POLICY IF EXISTS "Users can insert their own Gmail tokens" ON gmail_tokens;
DROP POLICY IF EXISTS "Users can update their own Gmail tokens" ON gmail_tokens;
DROP POLICY IF EXISTS "Users can delete their own Gmail tokens" ON gmail_tokens;

-- Create RLS policies for gmail_tokens
CREATE POLICY "Users can view their own Gmail tokens" ON gmail_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail tokens" ON gmail_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail tokens" ON gmail_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail tokens" ON gmail_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS gmail_tokens_user_id_idx ON gmail_tokens(user_id);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'gmail_tokens' 
ORDER BY ordinal_position; 