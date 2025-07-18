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

-- Update the subscriptions table to include source email tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS source_email_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_url TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.0; 