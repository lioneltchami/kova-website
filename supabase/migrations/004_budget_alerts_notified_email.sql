-- Migration 004: Add notified_email column to budget_alerts
-- This column tracks whether an email notification has been sent for each alert.
-- The notifications/budget-alert internal endpoint reads rows where notified_email = FALSE
-- and sets it to TRUE after successfully sending via Resend.

ALTER TABLE public.budget_alerts
  ADD COLUMN IF NOT EXISTS notified_email BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to speed up the "find unnotified recent alerts" query in the notification endpoint.
CREATE INDEX IF NOT EXISTS idx_budget_alerts_unnotified_email
  ON public.budget_alerts(triggered_at DESC)
  WHERE notified_email = FALSE;
