-- Update subscriptions table to add fields for Gmail integration
-- Run this in your Supabase SQL editor to add the missing fields

-- Add source_email_id to track which email this subscription was parsed from
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS source_email_id TEXT;

-- Add cancel_url to store cancellation links found in emails
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_url TEXT;

-- Add confidence_score to track AI parsing confidence (0.0 to 1.0)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0);

-- Add created_by to track if subscription was added manually or via AI
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'manual' CHECK (created_by IN ('manual', 'ai', 'import'));

-- Add parsed_data to store raw AI parsing results for debugging
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS parsed_data JSONB;

-- Create index on source_email_id for duplicate detection
CREATE INDEX IF NOT EXISTS idx_subscriptions_source_email_id ON subscriptions(source_email_id);

-- Create index on confidence_score for filtering high/low confidence results
CREATE INDEX IF NOT EXISTS idx_subscriptions_confidence_score ON subscriptions(confidence_score);

-- Create index on created_by for filtering AI vs manual subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by ON subscriptions(created_by);

COMMENT ON COLUMN subscriptions.source_email_id IS 'Gmail message ID that this subscription was parsed from';
COMMENT ON COLUMN subscriptions.cancel_url IS 'URL to cancel this subscription, extracted from email';
COMMENT ON COLUMN subscriptions.confidence_score IS 'AI parsing confidence score (0.0 to 1.0)';
COMMENT ON COLUMN subscriptions.created_by IS 'How this subscription was created: manual, ai, or import';
COMMENT ON COLUMN subscriptions.parsed_data IS 'Raw data from AI parsing for debugging purposes'; 