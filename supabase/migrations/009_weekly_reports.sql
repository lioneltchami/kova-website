-- Migration 009: Weekly Email Report Opt-In
-- Adds an explicit boolean column to profiles for weekly cost summary emails.
-- The notification_preferences JSONB on teams already has structure; this adds
-- a dedicated column on profiles for clearer querying and simpler cron targeting.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_reports_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.weekly_reports_enabled IS 'When true, user receives a weekly AI cost summary email every Monday at 8am UTC.';
