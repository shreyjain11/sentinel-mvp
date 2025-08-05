-- Email Logs Table Schema
-- This table tracks all emails sent by Sentinel for analytics and debugging

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_id TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on email_logs table
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can insert their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can update their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can delete their own email logs" ON email_logs;

-- Create RLS policies for email_logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email logs" ON email_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email logs" ON email_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS email_logs_user_id_idx ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS email_logs_sent_at_idx ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS email_logs_type_idx ON email_logs(type);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_logs_updated_at 
  BEFORE UPDATE ON email_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_logs'
ORDER BY ordinal_position; 