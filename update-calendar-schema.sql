-- Update subscriptions table to include calendar fields (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'calendar_event_id') THEN
        ALTER TABLE subscriptions ADD COLUMN calendar_event_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'calendar_id') THEN
        ALTER TABLE subscriptions ADD COLUMN calendar_id TEXT;
    END IF;
END $$;

-- Create user_calendars table to store user's dedicated calendar (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calendar_id TEXT UNIQUE NOT NULL,
  calendar_name TEXT NOT NULL,
  calendar_color TEXT DEFAULT '#4285F4',
  auto_sync BOOLEAN DEFAULT true,
  sync_trials BOOLEAN DEFAULT true,
  sync_renewals BOOLEAN DEFAULT true,
  show_canceled BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_calendars table (only if they don't exist)
DO $$ 
BEGIN
    -- Enable RLS
    ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can view own calendars
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_calendars' AND policyname = 'Users can view own calendars') THEN
        CREATE POLICY "Users can view own calendars" ON user_calendars
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can insert their own calendars
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_calendars' AND policyname = 'Users can insert own calendars') THEN
        CREATE POLICY "Users can insert own calendars" ON user_calendars
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy: Users can update their own calendars
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_calendars' AND policyname = 'Users can update own calendars') THEN
        CREATE POLICY "Users can update own calendars" ON user_calendars
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can delete their own calendars
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_calendars' AND policyname = 'Users can delete own calendars') THEN
        CREATE POLICY "Users can delete own calendars" ON user_calendars
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_event_id ON subscriptions(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_id ON subscriptions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_calendar_id ON user_calendars(calendar_id); 