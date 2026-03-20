-- Migration 007: Enterprise Schema
-- Adds audit events (partitioned), cost centers, webhook delivery pipeline,
-- health checks, operator flags, role permissions, and extends existing tables
-- for enterprise multi-tenant FinOps features.

-- =============================================================================
-- Section 1: audit_events (partitioned by month)
-- Written exclusively via the audit_trigger_fn trigger (SECURITY DEFINER).
-- No direct client inserts are permitted.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  actor_ip INET,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  team_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2026 partitions (complement usage_records 2026 partitions already in 002)
CREATE TABLE IF NOT EXISTS public.audit_events_2026_01 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_02 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_03 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_04 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_05 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_06 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_07 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_08 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_09 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_10 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_11 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2026_12 PARTITION OF public.audit_events
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- 2027 partitions
CREATE TABLE IF NOT EXISTS public.audit_events_2027_01 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_02 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_03 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_04 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_05 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_06 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_07 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_08 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_09 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_10 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_11 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');

CREATE TABLE IF NOT EXISTS public.audit_events_2027_12 PARTITION OF public.audit_events
  FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');

-- Default partition catches events outside all explicit ranges
CREATE TABLE IF NOT EXISTS public.audit_events_default PARTITION OF public.audit_events DEFAULT;

-- =============================================================================
-- Section 2: cost_centers
-- Budget allocation units scoped to a team.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  budget_usd NUMERIC(10, 2),
  tags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Section 3: project_cost_center_mappings
-- Maps project name glob/prefix patterns to a cost center within a team.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_cost_center_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  project_pattern TEXT NOT NULL,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Section 4: role_permissions
-- Declarative permission matrix for roles across resources and actions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  UNIQUE (role, resource, action)
);

-- =============================================================================
-- Section 5: webhook_endpoints
-- Team-scoped outbound webhook destinations.
-- signing_secret is stored hashed by the application layer; kept in DB for
-- signature verification at delivery time.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  signing_secret TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Section 6: webhook_deliveries
-- Delivery log and retry state for outbound webhook events.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_response_code INTEGER,
  last_response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Section 7: health_checks
-- Component health snapshots written by the health-checker edge function.
-- Publicly readable for status-page use.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  latency_ms INTEGER,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Section 8: operator_flags
-- Runtime feature flags settable by platform operators via service role only.
-- No public RLS access.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.operator_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Section 9: Column extensions on existing tables
-- =============================================================================

-- Link usage records to a cost center for chargeback reporting
ALTER TABLE public.usage_records
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id);

-- Arbitrary tagging on usage records (e.g. environment, feature branch)
ALTER TABLE public.usage_records
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '{}'::jsonb;

-- API key scopes: granular permission model for CLI keys
ALTER TABLE private.api_keys
  ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ARRAY['read', 'write'];

-- Back-fill NULL scopes on existing rows (idempotent)
UPDATE private.api_keys
  SET scopes = ARRAY['read', 'write']
  WHERE scopes IS NULL;

-- Extend team_members role to support enterprise role set.
-- Drop the old constraint first, then add the expanded one.
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'billing_admin', 'cost_center_manager', 'viewer'));

-- Operator flag on user profiles (set only by service role)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_operator BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- Section 10: Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_events_team_time
  ON public.audit_events(team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor
  ON public.audit_events(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON public.audit_events(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_cost_centers_team
  ON public.cost_centers(team_id);

CREATE INDEX IF NOT EXISTS idx_project_mappings_team
  ON public.project_cost_center_mappings(team_id);

CREATE INDEX IF NOT EXISTS idx_project_mappings_cost_center
  ON public.project_cost_center_mappings(cost_center_id);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_team
  ON public.webhook_endpoints(team_id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint_status
  ON public.webhook_deliveries(endpoint_id, status);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending_next
  ON public.webhook_deliveries(next_attempt_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_health_checks_component
  ON public.health_checks(component, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_operator_flags_key
  ON public.operator_flags(key);

CREATE INDEX IF NOT EXISTS idx_usage_records_cost_center
  ON public.usage_records(cost_center_id) WHERE cost_center_id IS NOT NULL;

-- =============================================================================
-- Section 11: Enable RLS on new tables
-- =============================================================================

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_cost_center_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_flags ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Section 12: RLS Policies
-- =============================================================================

-- audit_events: team members may read; all writes are trigger-only (no client policy)
CREATE POLICY "audit_events_select" ON public.audit_events
  FOR SELECT USING (
    team_id IN (SELECT public.get_my_team_ids())
  );

-- Deny direct client inserts; the trigger runs as SECURITY DEFINER (service role)
CREATE POLICY "audit_events_insert_deny" ON public.audit_events
  FOR INSERT WITH CHECK (false);

CREATE POLICY "audit_events_update_deny" ON public.audit_events
  FOR UPDATE USING (false);

CREATE POLICY "audit_events_delete_deny" ON public.audit_events
  FOR DELETE USING (false);

-- cost_centers: team members read; owners/admins write
CREATE POLICY "cost_centers_select" ON public.cost_centers
  FOR SELECT USING (
    team_id IN (SELECT public.get_my_team_ids())
  );

CREATE POLICY "cost_centers_insert" ON public.cost_centers
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "cost_centers_update" ON public.cost_centers
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "cost_centers_delete" ON public.cost_centers
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- project_cost_center_mappings: same access pattern as cost_centers
CREATE POLICY "project_mappings_select" ON public.project_cost_center_mappings
  FOR SELECT USING (
    team_id IN (SELECT public.get_my_team_ids())
  );

CREATE POLICY "project_mappings_insert" ON public.project_cost_center_mappings
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "project_mappings_update" ON public.project_cost_center_mappings
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "project_mappings_delete" ON public.project_cost_center_mappings
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- role_permissions: read-only for all authenticated users (it is a config table)
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "role_permissions_write_deny" ON public.role_permissions
  FOR INSERT WITH CHECK (false);

-- webhook_endpoints: owners/admins manage; all team members may read
CREATE POLICY "webhook_endpoints_select" ON public.webhook_endpoints
  FOR SELECT USING (
    team_id IN (SELECT public.get_my_team_ids())
  );

CREATE POLICY "webhook_endpoints_insert" ON public.webhook_endpoints
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "webhook_endpoints_update" ON public.webhook_endpoints
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "webhook_endpoints_delete" ON public.webhook_endpoints
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- webhook_deliveries: team members may read delivery history (via endpoint join)
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries
  FOR SELECT USING (
    endpoint_id IN (
      SELECT id FROM public.webhook_endpoints
      WHERE team_id IN (SELECT public.get_my_team_ids())
    )
  );

-- Deliveries are written exclusively by the webhook-delivery-worker edge function
CREATE POLICY "webhook_deliveries_write_deny" ON public.webhook_deliveries
  FOR INSERT WITH CHECK (false);

-- health_checks: public read for status page (no auth required)
CREATE POLICY "health_checks_select" ON public.health_checks
  FOR SELECT USING (true);

-- Writes by health-checker edge function (service role) only
CREATE POLICY "health_checks_write_deny" ON public.health_checks
  FOR INSERT WITH CHECK (false);

-- operator_flags: no public access; service role bypasses RLS entirely
CREATE POLICY "operator_flags_deny_all" ON public.operator_flags
  FOR ALL USING (false);

-- =============================================================================
-- Section 13: Audit trigger function
-- Fires on INSERT / UPDATE / DELETE on audited tables.
-- Runs SECURITY DEFINER so it can write audit_events regardless of caller RLS.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_events (
    actor_id,
    event_type,
    resource_type,
    resource_id,
    team_id,
    old_data,
    new_data
  )
  VALUES (
    (SELECT auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN (OLD).id::TEXT
      ELSE (NEW).id::TEXT
    END,
    CASE
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE COALESCE((NEW).team_id, NULL)
    END,
    CASE
      WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
      ELSE NULL
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =============================================================================
-- Section 14: Attach audit trigger to high-value tables
-- Deliberately excludes usage_records (too high volume for row-level audit).
-- =============================================================================

-- teams
DROP TRIGGER IF EXISTS trg_audit_teams ON public.teams;
CREATE TRIGGER trg_audit_teams
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- team_members
DROP TRIGGER IF EXISTS trg_audit_team_members ON public.team_members;
CREATE TRIGGER trg_audit_team_members
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- budgets
DROP TRIGGER IF EXISTS trg_audit_budgets ON public.budgets;
CREATE TRIGGER trg_audit_budgets
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- cost_centers
DROP TRIGGER IF EXISTS trg_audit_cost_centers ON public.cost_centers;
CREATE TRIGGER trg_audit_cost_centers
  AFTER INSERT OR UPDATE OR DELETE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- webhook_endpoints
DROP TRIGGER IF EXISTS trg_audit_webhook_endpoints ON public.webhook_endpoints;
CREATE TRIGGER trg_audit_webhook_endpoints
  AFTER INSERT OR UPDATE OR DELETE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- subscriptions
DROP TRIGGER IF EXISTS trg_audit_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_audit_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- =============================================================================
-- Section 15: Seed role_permissions
-- Covers all combinations of enterprise role x resource x action.
-- Uses INSERT ... ON CONFLICT DO NOTHING for idempotency on re-run.
-- =============================================================================

INSERT INTO public.role_permissions (role, resource, action)
VALUES
  -- owner: full access to everything
  ('owner', 'usage',       'read'),
  ('owner', 'usage',       'write'),
  ('owner', 'usage',       'manage'),
  ('owner', 'budgets',     'read'),
  ('owner', 'budgets',     'write'),
  ('owner', 'budgets',     'manage'),
  ('owner', 'team',        'read'),
  ('owner', 'team',        'write'),
  ('owner', 'team',        'manage'),
  ('owner', 'cost_centers','read'),
  ('owner', 'cost_centers','write'),
  ('owner', 'cost_centers','manage'),
  ('owner', 'audit_log',   'read'),
  ('owner', 'audit_log',   'write'),
  ('owner', 'audit_log',   'manage'),
  ('owner', 'webhooks',    'read'),
  ('owner', 'webhooks',    'write'),
  ('owner', 'webhooks',    'manage'),
  ('owner', 'api_keys',    'read'),
  ('owner', 'api_keys',    'write'),
  ('owner', 'api_keys',    'manage'),

  -- admin: read+write on most resources, no manage on team
  ('admin', 'usage',       'read'),
  ('admin', 'usage',       'write'),
  ('admin', 'usage',       'manage'),
  ('admin', 'budgets',     'read'),
  ('admin', 'budgets',     'write'),
  ('admin', 'budgets',     'manage'),
  ('admin', 'team',        'read'),
  ('admin', 'team',        'write'),
  ('admin', 'cost_centers','read'),
  ('admin', 'cost_centers','write'),
  ('admin', 'cost_centers','manage'),
  ('admin', 'audit_log',   'read'),
  ('admin', 'webhooks',    'read'),
  ('admin', 'webhooks',    'write'),
  ('admin', 'webhooks',    'manage'),
  ('admin', 'api_keys',    'read'),
  ('admin', 'api_keys',    'write'),

  -- member: read usage and team, write own usage
  ('member', 'usage',      'read'),
  ('member', 'usage',      'write'),
  ('member', 'budgets',    'read'),
  ('member', 'team',       'read'),
  ('member', 'cost_centers','read'),
  ('member', 'api_keys',   'read'),
  ('member', 'api_keys',   'write'),

  -- billing_admin: full access to billing resources
  ('billing_admin', 'usage',       'read'),
  ('billing_admin', 'usage',       'manage'),
  ('billing_admin', 'budgets',     'read'),
  ('billing_admin', 'budgets',     'write'),
  ('billing_admin', 'budgets',     'manage'),
  ('billing_admin', 'team',        'read'),
  ('billing_admin', 'cost_centers','read'),
  ('billing_admin', 'cost_centers','write'),
  ('billing_admin', 'cost_centers','manage'),
  ('billing_admin', 'audit_log',   'read'),
  ('billing_admin', 'api_keys',    'read'),

  -- cost_center_manager: manage cost centers and read usage
  ('cost_center_manager', 'usage',        'read'),
  ('cost_center_manager', 'budgets',      'read'),
  ('cost_center_manager', 'team',         'read'),
  ('cost_center_manager', 'cost_centers', 'read'),
  ('cost_center_manager', 'cost_centers', 'write'),
  ('cost_center_manager', 'cost_centers', 'manage'),
  ('cost_center_manager', 'audit_log',    'read'),
  ('cost_center_manager', 'api_keys',     'read'),

  -- viewer: read-only across all resources
  ('viewer', 'usage',       'read'),
  ('viewer', 'budgets',     'read'),
  ('viewer', 'team',        'read'),
  ('viewer', 'cost_centers','read'),
  ('viewer', 'audit_log',   'read'),
  ('viewer', 'webhooks',    'read'),
  ('viewer', 'api_keys',    'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- =============================================================================
-- Section 16: 2027 usage_records partitions
-- Mirrors audit_events 2027 coverage; ensures no records fall to default partition.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_records_2027_01 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_02 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_03 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_04 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_05 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_06 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_07 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_08 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_09 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_10 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_11 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');

CREATE TABLE IF NOT EXISTS public.usage_records_2027_12 PARTITION OF public.usage_records
  FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');
