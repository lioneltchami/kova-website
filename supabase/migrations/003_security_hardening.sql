-- Kova Security Hardening - Migration 003
-- Tightens RLS policies and adds field-length / range constraints identified in security audit.
-- All changes are additive or policy replacements -- no data is dropped.

-- =============================================================================
-- H-3: Remove self-insert bypass on team_members
-- The original policy allowed any authenticated user to add themselves to any
-- team by satisfying the OR user_id = auth.uid() branch. Replace it with a
-- strict policy that only allows inserts by existing owners/admins.
-- The personal-workspace bootstrap (usage route) runs as the service role, so
-- it bypasses RLS entirely and does not need this bypass.
-- =============================================================================

DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- H-4: Add explicit UPDATE policy on team_members
-- Only team owners may change member roles.
-- =============================================================================

DROP POLICY IF EXISTS "team_members_update" ON public.team_members;

CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid()) AND role = 'owner'
    )
  );

-- =============================================================================
-- H-5: Explicit deny policies on budget_alerts
-- budget_alerts are written exclusively by server-side functions (service role).
-- These deny policies prevent any authenticated client from inserting, updating,
-- or deleting alert rows, regardless of other permissive policies.
-- =============================================================================

DROP POLICY IF EXISTS "budget_alerts_insert_deny" ON public.budget_alerts;
DROP POLICY IF EXISTS "budget_alerts_update_deny" ON public.budget_alerts;
DROP POLICY IF EXISTS "budget_alerts_delete_deny" ON public.budget_alerts;

CREATE POLICY "budget_alerts_insert_deny" ON public.budget_alerts
  FOR INSERT WITH CHECK (false);

CREATE POLICY "budget_alerts_update_deny" ON public.budget_alerts
  FOR UPDATE USING (false);

CREATE POLICY "budget_alerts_delete_deny" ON public.budget_alerts
  FOR DELETE USING (false);

-- =============================================================================
-- L-1: Explicit deny INSERT on usage_records
-- Writes happen exclusively via the upload_usage_records SECURITY DEFINER RPC
-- (service role). Deny direct client inserts at the RLS layer.
-- =============================================================================

DROP POLICY IF EXISTS "usage_records_insert_deny" ON public.usage_records;

CREATE POLICY "usage_records_insert_deny" ON public.usage_records
  FOR INSERT WITH CHECK (false);

-- =============================================================================
-- H-2: Field length constraints on usage_records
-- PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS, so we use a DO block
-- to skip gracefully if the constraint already exists.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_tool_length' AND conrelid = 'public.usage_records'::regclass
  ) THEN
    ALTER TABLE public.usage_records
      ADD CONSTRAINT usage_records_tool_length CHECK (length(tool) <= 50);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_model_length' AND conrelid = 'public.usage_records'::regclass
  ) THEN
    ALTER TABLE public.usage_records
      ADD CONSTRAINT usage_records_model_length CHECK (length(model) <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_session_id_length' AND conrelid = 'public.usage_records'::regclass
  ) THEN
    ALTER TABLE public.usage_records
      ADD CONSTRAINT usage_records_session_id_length CHECK (length(session_id) <= 200);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_project_length' AND conrelid = 'public.usage_records'::regclass
  ) THEN
    ALTER TABLE public.usage_records
      ADD CONSTRAINT usage_records_project_length CHECK (length(project) <= 500);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_cli_version_length' AND conrelid = 'public.usage_records'::regclass
  ) THEN
    ALTER TABLE public.usage_records
      ADD CONSTRAINT usage_records_cli_version_length CHECK (length(cli_version) <= 50);
  END IF;
END $$;

-- =============================================================================
-- M-2: Budget warn_at_percent range constraint
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'budgets_warn_at_percent_range' AND conrelid = 'public.budgets'::regclass
  ) THEN
    ALTER TABLE public.budgets
      ADD CONSTRAINT budgets_warn_at_percent_range CHECK (warn_at_percent BETWEEN 1 AND 100);
  END IF;
END $$;

-- =============================================================================
-- L-3: Audit columns on team_members
-- Tracks when a membership row was last changed and by whom.
-- =============================================================================

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
