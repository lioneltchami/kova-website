ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_alerts": true, "email_digest": true, "slack_alerts": true, "alert_threshold": "high"}'::jsonb;
