-- Migration 006: Integrations Tables
-- Adds slack_integrations and github_app_installations tables for OAuth-based integrations.
-- Also adds notification_preferences to profiles for per-user notification control.

-- Slack OAuth integrations (separate from the simple webhook on teams)
CREATE TABLE IF NOT EXISTS public.slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  team_name TEXT,
  access_token TEXT NOT NULL,
  bot_user_id TEXT,
  channel_id TEXT,
  channel_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- GitHub App installations
CREATE TABLE IF NOT EXISTS public.github_app_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installation_id BIGINT NOT NULL UNIQUE,
  account_login TEXT NOT NULL,
  account_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_app_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slack_integrations_select" ON public.slack_integrations FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "slack_integrations_insert" ON public.slack_integrations FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "slack_integrations_update" ON public.slack_integrations FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "slack_integrations_delete" ON public.slack_integrations FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "github_installations_select" ON public.github_app_installations FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "github_installations_insert" ON public.github_app_installations FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "github_installations_delete" ON public.github_app_installations FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Add per-user notification_preferences to profiles (distinct from team-level preferences on teams table)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"weekly_digest": true, "budget_alerts": true, "slack_enabled": false}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_slack_integrations_user_id ON public.slack_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_github_installations_user_id ON public.github_app_installations(user_id);
