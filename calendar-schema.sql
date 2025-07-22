-- Calendar Integration Schema Updates

-- Create user_calendars table to store user's dedicated calendar
CREATE TABLE IF NOT EXISTS user_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL UNIQUE,
  calendar_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add calendar-related columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_id TEXT,
ADD COLUMN IF NOT EXISTS source_email_subject TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_event_id ON subscriptions(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);

-- Enable RLS on user_calendars table
ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_calendars
CREATE POLICY "Users can view their own calendars" ON user_calendars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendars" ON user_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendars" ON user_calendars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendars" ON user_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing RLS policies on subscriptions to include calendar fields
-- (These will be applied automatically by existing policies)

-- Create function to clean up calendar events when subscriptions are deleted
CREATE OR REPLACE FUNCTION cleanup_calendar_events()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be handled by the application layer
  -- The trigger ensures we have a hook for cleanup
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription deletion
CREATE TRIGGER cleanup_calendar_events_trigger
  BEFORE DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_calendar_events();

-- Add comments for documentation
COMMENT ON TABLE user_calendars IS 'Stores user-specific Google Calendar IDs for subscription events';
COMMENT ON COLUMN subscriptions.calendar_event_id IS 'Google Calendar event ID for this subscription';
COMMENT ON COLUMN subscriptions.calendar_id IS 'Google Calendar ID where the event is stored';
COMMENT ON COLUMN subscriptions.source_email_subject IS 'Original email subject for reference'; 