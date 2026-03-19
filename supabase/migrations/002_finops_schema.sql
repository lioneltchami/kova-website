-- Kova FinOps Schema - Migration 002
-- Additive migration: does not drop any tables from 001
-- Adds usage tracking, team management, budgets, and rollup infrastructure

-- =============================================================================
-- Section 1: Teams and Team Members (not present in 001)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  seats_purchased INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

-- =============================================================================
-- Section 2: Usage Records (core fact table, partitioned by month)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_records (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'unknown',
  session_id TEXT NOT NULL DEFAULT '',
  project TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER,
  cli_version TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions for 2026
CREATE TABLE IF NOT EXISTS public.usage_records_2026_01 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_02 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_03 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_04 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_05 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_06 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_07 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_08 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_09 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_10 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_11 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2026_12 PARTITION OF public.usage_records
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Default partition catches records outside all explicit ranges
CREATE TABLE IF NOT EXISTS public.usage_records_default PARTITION OF public.usage_records DEFAULT;

-- =============================================================================
-- Section 3: Pre-aggregated Rollup Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_daily_rollups (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tool TEXT NOT NULL,
  model TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(14, 8) DEFAULT 0,
  PRIMARY KEY (team_id, user_id, date, tool, model)
);

CREATE TABLE IF NOT EXISTS public.usage_monthly_rollups (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  tool TEXT NOT NULL,
  model TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(14, 8) DEFAULT 0,
  PRIMARY KEY (team_id, user_id, month, tool, model)
);

-- =============================================================================
-- Section 4: Budgets and Budget Alerts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'team' CHECK (scope IN ('personal', 'team')),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'monthly')),
  amount_usd NUMERIC(10, 2) NOT NULL,
  warn_at_percent INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_type TEXT NOT NULL,
  threshold_pct INTEGER NOT NULL,
  current_spend NUMERIC(14, 8) NOT NULL,
  budget_amount NUMERIC(10, 2) NOT NULL
);

-- =============================================================================
-- Section 5: Enable RLS on all new tables
-- =============================================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_daily_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_monthly_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Section 6: RLS Helper Function
-- =============================================================================

-- Returns all team_ids for the current user; SECURITY DEFINER avoids
-- recursive RLS evaluation on team_members inside policy expressions
CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid());
$$;

-- =============================================================================
-- Section 7: RLS Policies
-- =============================================================================

-- teams: members can read; owners/admins can update; anyone can create (their own)
CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "teams_delete" ON public.teams
  FOR DELETE USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role = 'owner'
    )
  );

-- team_members: members can see other members of shared teams; owners/admins manage
CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
    -- Allow self-insert when creating personal workspace (owner inserts themselves)
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE USING (
    -- Members can remove themselves
    user_id = (SELECT auth.uid())
    -- Owners and admins can remove others
    OR team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- usage_records: users see own records + records from teams they belong to
CREATE POLICY "usage_records_select" ON public.usage_records
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR team_id IN (SELECT public.get_my_team_ids())
  );

-- Inserts done only via service-role RPC (upload_usage_records), no user policy needed
-- but we create a permissive service-role policy via SECURITY DEFINER on the RPC function

-- usage_daily_rollups: same visibility as usage_records
CREATE POLICY "usage_daily_rollups_select" ON public.usage_daily_rollups
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR team_id IN (SELECT public.get_my_team_ids())
  );

-- usage_monthly_rollups: same visibility
CREATE POLICY "usage_monthly_rollups_select" ON public.usage_monthly_rollups
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR team_id IN (SELECT public.get_my_team_ids())
  );

-- budgets: users manage their own and team budgets
CREATE POLICY "budgets_select" ON public.budgets
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR team_id IN (SELECT public.get_my_team_ids())
  );

CREATE POLICY "budgets_insert" ON public.budgets
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    OR team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "budgets_update" ON public.budgets
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
    OR team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "budgets_delete" ON public.budgets
  FOR DELETE USING (
    user_id = (SELECT auth.uid())
    OR team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- budget_alerts: visible to team members who can see the budget
CREATE POLICY "budget_alerts_select" ON public.budget_alerts
  FOR SELECT USING (
    team_id IN (SELECT public.get_my_team_ids())
  );

-- =============================================================================
-- Section 8: Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_usage_team_time ON public.usage_records(team_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_user_time ON public.usage_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tool ON public.usage_records(team_id, tool);
CREATE INDEX IF NOT EXISTS idx_usage_model ON public.usage_records(team_id, model);
CREATE INDEX IF NOT EXISTS idx_usage_project ON public.usage_records(team_id, project) WHERE project IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_daily_rollup_team ON public.usage_daily_rollups(team_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_rollup_team ON public.usage_monthly_rollups(team_id, month DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_team ON public.budgets(team_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id) WHERE is_active = TRUE;

-- =============================================================================
-- Section 9: Trigger Functions
-- =============================================================================

-- Trigger: maintain daily rollup on usage_records insert.
-- Note: triggers on partitioned tables fire on the root table and propagate
-- to all partitions automatically in PostgreSQL 13+.
CREATE OR REPLACE FUNCTION public.update_daily_rollup()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- team_id may be NULL for records not yet assigned to a team; skip rollup in that case
  IF NEW.team_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.usage_daily_rollups (
    team_id, user_id, date, tool, model,
    total_sessions, total_input_tokens, total_output_tokens, total_cost_usd
  )
  VALUES (
    NEW.team_id, NEW.user_id, DATE(NEW.recorded_at), NEW.tool, NEW.model,
    1, NEW.input_tokens, NEW.output_tokens, NEW.cost_usd
  )
  ON CONFLICT (team_id, user_id, date, tool, model)
  DO UPDATE SET
    total_sessions     = usage_daily_rollups.total_sessions + 1,
    total_input_tokens  = usage_daily_rollups.total_input_tokens  + EXCLUDED.total_input_tokens,
    total_output_tokens = usage_daily_rollups.total_output_tokens + EXCLUDED.total_output_tokens,
    total_cost_usd      = usage_daily_rollups.total_cost_usd      + EXCLUDED.total_cost_usd;

  RETURN NEW;
END;
$$;

-- Attach trigger to root partitioned table
CREATE TRIGGER trg_update_daily_rollup
  AFTER INSERT ON public.usage_records
  FOR EACH ROW EXECUTE FUNCTION public.update_daily_rollup();

-- Trigger: roll daily data up into monthly rollups when a daily row is inserted or updated.
--
-- On INSERT: add the full NEW values to the monthly total.
-- On UPDATE: apply only the delta (NEW - OLD) so the monthly total stays accurate when
--   the daily row is incremented by update_daily_rollup.  Adding the full NEW value on
--   UPDATE would double-count any data that was already rolled up when the row was first
--   inserted or previously updated.
CREATE OR REPLACE FUNCTION public.update_monthly_rollup()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_month          DATE;
  v_sessions_delta INT;
  v_input_delta    BIGINT;
  v_output_delta   BIGINT;
  v_cost_delta     NUMERIC(14, 8);
BEGIN
  v_month := DATE_TRUNC('month', NEW.date)::DATE;

  IF TG_OP = 'INSERT' THEN
    v_sessions_delta := NEW.total_sessions;
    v_input_delta    := NEW.total_input_tokens;
    v_output_delta   := NEW.total_output_tokens;
    v_cost_delta     := NEW.total_cost_usd;
  ELSE
    -- UPDATE: only propagate the increment that was just applied to the daily row
    v_sessions_delta := NEW.total_sessions      - OLD.total_sessions;
    v_input_delta    := NEW.total_input_tokens  - OLD.total_input_tokens;
    v_output_delta   := NEW.total_output_tokens - OLD.total_output_tokens;
    v_cost_delta     := NEW.total_cost_usd      - OLD.total_cost_usd;
  END IF;

  INSERT INTO public.usage_monthly_rollups (
    team_id, user_id, month, tool, model,
    total_sessions, total_input_tokens, total_output_tokens, total_cost_usd
  )
  VALUES (
    NEW.team_id, NEW.user_id, v_month, NEW.tool, NEW.model,
    v_sessions_delta, v_input_delta, v_output_delta, v_cost_delta
  )
  ON CONFLICT (team_id, user_id, month, tool, model)
  DO UPDATE SET
    total_sessions      = usage_monthly_rollups.total_sessions      + EXCLUDED.total_sessions,
    total_input_tokens  = usage_monthly_rollups.total_input_tokens  + EXCLUDED.total_input_tokens,
    total_output_tokens = usage_monthly_rollups.total_output_tokens + EXCLUDED.total_output_tokens,
    total_cost_usd      = usage_monthly_rollups.total_cost_usd      + EXCLUDED.total_cost_usd;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_monthly_rollup
  AFTER INSERT OR UPDATE ON public.usage_daily_rollups
  FOR EACH ROW EXECUTE FUNCTION public.update_monthly_rollup();

-- =============================================================================
-- Section 10: RPC Functions
-- =============================================================================

-- upload_usage_records: called by the /api/v1/usage route (service role).
-- Accepts a JSONB array of records and performs idempotent upsert via
-- unique_violation handling. Returns counts of accepted and duplicate records.
CREATE OR REPLACE FUNCTION public.upload_usage_records(
  p_team_id UUID,
  p_user_id UUID,
  p_records JSONB
)
RETURNS TABLE(accepted INT, duplicates INT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_record  JSONB;
  v_accepted   INT := 0;
  v_duplicates INT := 0;
BEGIN
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    BEGIN
      INSERT INTO public.usage_records (
        id, user_id, team_id, tool, model, session_id, project,
        input_tokens, output_tokens, cost_usd,
        recorded_at, duration_ms, cli_version
      )
      VALUES (
        v_record->>'id',
        p_user_id,
        p_team_id,
        v_record->>'tool',
        COALESCE(v_record->>'model', 'unknown'),
        COALESCE(v_record->>'session_id', ''),
        NULLIF(v_record->>'project', ''),
        COALESCE((v_record->>'input_tokens')::INT, 0),
        COALESCE((v_record->>'output_tokens')::INT, 0),
        COALESCE((v_record->>'cost_usd')::NUMERIC, 0),
        (v_record->>'timestamp')::TIMESTAMPTZ,
        (v_record->>'duration_ms')::INT,
        v_record->>'cli_version'
      );
      v_accepted := v_accepted + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_accepted, v_duplicates;
END;
$$;
