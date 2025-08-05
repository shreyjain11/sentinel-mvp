-- Add notification_email field to notification_preferences table
-- This allows users to specify a different email for notifications

-- Add the notification_email column
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN notification_preferences.notification_email IS 'Email address for receiving notifications (can be different from auth email)';

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_notification_email ON notification_preferences(notification_email);

-- Update existing records to use auth email as default notification email
UPDATE notification_preferences 
SET notification_email = (
  SELECT email FROM auth.users WHERE auth.users.id = notification_preferences.user_id
)
WHERE notification_email IS NULL;

-- Add a constraint to ensure notification_email is a valid email format
ALTER TABLE notification_preferences 
ADD CONSTRAINT notification_email_format 
CHECK (notification_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'); 