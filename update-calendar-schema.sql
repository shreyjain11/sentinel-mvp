-- Update subscriptions table to add calendar integration fields
-- Run this in your Supabase SQL editor to add calendar event tracking

-- Add calendar event ID fields to track Google Calendar events
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_calendar_event_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_calendar_event_id TEXT;

-- Create indexes for calendar event IDs for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_calendar_event_id ON subscriptions(renewal_calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_calendar_event_id ON subscriptions(trial_calendar_event_id);

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.renewal_calendar_event_id IS 'Google Calendar event ID for subscription renewal reminder';
COMMENT ON COLUMN subscriptions.trial_calendar_event_id IS 'Google Calendar event ID for trial end reminder';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name IN ('renewal_calendar_event_id', 'trial_calendar_event_id')
ORDER BY column_name; 