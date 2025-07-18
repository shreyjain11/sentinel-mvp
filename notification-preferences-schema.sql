-- Create notification preferences table
-- Run this in your Supabase SQL editor to add notification preferences support

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification channels (can enable multiple)
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  
  -- User contact info for notifications
  phone_number TEXT,
  verified_phone BOOLEAN DEFAULT false,
  
  -- Notification timing (days before event)
  trial_end_days_before INTEGER DEFAULT 3 CHECK (trial_end_days_before >= 0 AND trial_end_days_before <= 30),
  renewal_days_before INTEGER DEFAULT 3 CHECK (renewal_days_before >= 0 AND renewal_days_before <= 30),
  
  -- Notification types
  trial_ending_enabled BOOLEAN DEFAULT true,
  renewal_reminder_enabled BOOLEAN DEFAULT true,
  price_change_enabled BOOLEAN DEFAULT true,
  unused_subscription_enabled BOOLEAN DEFAULT false,
  
  -- Advanced settings
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one preference record per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_sms_enabled ON notification_preferences(sms_enabled);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email_enabled ON notification_preferences(email_enabled);

-- Enable Row Level Security (RLS)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scheduled notifications queue table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN ('trial_ending', 'renewal_reminder', 'price_change', 'unused_subscription')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_channel ON scheduled_notifications(channel);

-- Enable Row Level Security (RLS)
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications" ON scheduled_notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Comments for documentation
COMMENT ON TABLE notification_preferences IS 'User preferences for notification channels and timing';
COMMENT ON TABLE scheduled_notifications IS 'Queue of notifications to be sent to users';
COMMENT ON COLUMN notification_preferences.trial_end_days_before IS 'How many days before trial ends to send notification';
COMMENT ON COLUMN notification_preferences.renewal_days_before IS 'How many days before renewal to send notification';
COMMENT ON COLUMN notification_preferences.phone_number IS 'User phone number for SMS notifications';
COMMENT ON COLUMN notification_preferences.verified_phone IS 'Whether phone number has been verified';

-- Sample data for testing (optional)
-- INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, trial_end_days_before, renewal_days_before)
-- VALUES ('your-user-id-here', true, false, 3, 3);

-- Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('notification_preferences', 'scheduled_notifications')
ORDER BY table_name, ordinal_position; 