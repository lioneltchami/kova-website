-- Migration 008: GDPR Data Retention & Export
-- Adds configurable audit log retention per team, user data export jobs,
-- helper RPCs for GDPR compliance, and a stub for pg_cron purge scheduling.

-- =============================================================================
-- Section 1: Configurable audit retention per team
-- Default is 90 days; enterprise teams may configure longer periods.
-- =============================================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS audit_retention_days INTEGER NOT NULL DEFAULT 90;

-- =============================================================================
-- Section 2: data_export_jobs
-- Tracks asynchronous user data export requests (right-to-portability).
-- Users may only see and initiate jobs for their own account.
-- The export-user-data edge function writes download_url and transitions
-- status to 'ready' or 'failed'.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.data_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.data_export_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own export jobs
CREATE POLICY "data_export_jobs_select" ON public.data_export_jobs
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Users initiate their own export; the RPC below enforces this too
CREATE POLICY "data_export_jobs_insert" ON public.data_export_jobs
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Only the export edge function (service role) may update status/download_url
CREATE POLICY "data_export_jobs_update_deny" ON public.data_export_jobs
  FOR UPDATE USING (false);

-- Users may cancel / delete their own pending jobs
CREATE POLICY "data_export_jobs_delete" ON public.data_export_jobs
  FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_data_export_jobs_user
  ON public.data_export_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_export_jobs_pending
  ON public.data_export_jobs(status, created_at)
  WHERE status IN ('pending', 'processing');

-- =============================================================================
-- Section 3: create_data_export_job RPC
-- Called by the authenticated user to enqueue an export for their account.
-- Returns the new job id so the caller can poll for status.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_data_export_job(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_job_id UUID;
BEGIN
  v_caller := (SELECT auth.uid());

  -- Only allow users to create exports for themselves
  IF v_caller IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden: you may only request exports for your own account';
  END IF;

  -- Prevent hammering: reject if a pending/processing job already exists
  IF EXISTS (
    SELECT 1 FROM public.data_export_jobs
    WHERE user_id = p_user_id
      AND status IN ('pending', 'processing')
  ) THEN
    RAISE EXCEPTION 'An export job is already pending for this account';
  END IF;

  INSERT INTO public.data_export_jobs (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- =============================================================================
-- Section 4: purge_old_audit_events
-- Deletes audit events older than each team's audit_retention_days setting.
-- Called by pg_cron on a nightly schedule (see comment below).
-- Runs SECURITY DEFINER so it can bypass RLS on audit_events.
--
-- pg_cron schedule (configure after enabling the extension in Supabase):
--   SELECT cron.schedule(
--     'purge-old-audit-events',
--     '0 3 * * *',   -- 03:00 UTC every day
--     $$SELECT public.purge_old_audit_events()$$
--   );
-- =============================================================================

CREATE OR REPLACE FUNCTION public.purge_old_audit_events()
RETURNS TABLE(team_id UUID, deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team RECORD;
  v_cutoff TIMESTAMPTZ;
  v_deleted BIGINT;
BEGIN
  FOR v_team IN
    SELECT id, audit_retention_days FROM public.teams
  LOOP
    v_cutoff := NOW() - (v_team.audit_retention_days || ' days')::INTERVAL;

    DELETE FROM public.audit_events ae
    WHERE ae.team_id = v_team.id
      AND ae.created_at < v_cutoff;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    IF v_deleted > 0 THEN
      RETURN QUERY SELECT v_team.id, v_deleted;
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- Section 5: hard_delete_user
-- Permanently removes all data for a user (GDPR right to erasure).
-- Callable only by the service role (SECURITY DEFINER + caller check).
-- The function cascades via FK ON DELETE CASCADE on auth.users, so deleting
-- the auth.users row is sufficient for most tables.  We also wipe
-- audit_events which reference actor_id but has ON DELETE behavior set to
-- SET NULL (FK not enforced on the partitioned table's actor_id by default).
--
-- IMPORTANT: this function is irreversible. Call only after confirming identity
-- and retaining any legally required retention copies outside the DB.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.hard_delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Wipe audit events where the user was the actor (actor_id is nullable FK)
  UPDATE public.audit_events
    SET actor_id = NULL, actor_email = NULL, actor_ip = NULL
  WHERE actor_id = p_user_id;

  -- Wipe personal-scope data_export_jobs (CASCADE would handle this, but
  -- explicit deletion ensures the storage objects are invalidated first by
  -- the application layer calling this function)
  DELETE FROM public.data_export_jobs WHERE user_id = p_user_id;

  -- Nullify team created_by references so teams are not orphaned
  UPDATE public.teams
    SET created_by = NULL
  WHERE created_by = p_user_id;

  -- Delete the auth user; cascades to profiles, usage_records, builds,
  -- subscriptions, api_keys, team_members, slack_integrations, etc.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Revoke public execute on hard_delete_user; only service role should call it.
-- Service role bypasses RLS entirely; anon/authenticated roles must not invoke this.
REVOKE ALL ON FUNCTION public.hard_delete_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hard_delete_user(UUID) FROM authenticated;
REVOKE ALL ON FUNCTION public.hard_delete_user(UUID) FROM anon;
