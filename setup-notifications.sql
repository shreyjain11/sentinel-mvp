-- Setup Notification System Tables
-- Run this in your Supabase SQL editor to add notification functionality

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification channels
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  
  -- Contact info
  phone_number TEXT,
  verified_phone BOOLEAN DEFAULT false,
  
  -- Timing preferences
  trial_end_days_before INTEGER DEFAULT 3,
  renewal_days_before INTEGER DEFAULT 3,
  
  -- Notification types
  trial_ending_enabled BOOLEAN DEFAULT true,
  renewal_reminder_enabled BOOLEAN DEFAULT true,
  price_change_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Scheduled notifications queue
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their scheduled notifications" ON scheduled_notifications
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);

-- Verify tables
SELECT 'notification_preferences' as table_name, count(*) as row_count FROM notification_preferences
UNION ALL
SELECT 'scheduled_notifications' as table_name, count(*) as row_count FROM scheduled_notifications; 