-- Update subscriptions table to include calendar fields
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_id TEXT;

-- Create user_calendars table to store user's dedicated calendar
CREATE TABLE IF NOT EXISTS user_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calendar_id TEXT UNIQUE NOT NULL,
  calendar_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_calendars table
ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own calendars
CREATE POLICY "Users can view own calendars" ON user_calendars
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own calendars
CREATE POLICY "Users can insert own calendars" ON user_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calendars
CREATE POLICY "Users can update own calendars" ON user_calendars
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own calendars
CREATE POLICY "Users can delete own calendars" ON user_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_event_id ON subscriptions(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_calendar_id ON user_calendars(calendar_id); 