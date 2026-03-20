-- Migration 010: Performance Indexes for Dashboard Query Patterns
-- These indexes target the exact filter + sort patterns used by the dashboard
-- pages (app/dashboard/page.tsx and app/dashboard/analytics/page.tsx).
--
-- All indexes use regular CREATE INDEX IF NOT EXISTS (not CONCURRENTLY) for
-- migration compatibility -- Supabase runs migrations inside transactions and
-- CONCURRENTLY cannot run inside a transaction block.

-- usage_records: primary dashboard pattern (filter by user, order by date)
CREATE INDEX IF NOT EXISTS idx_usage_records_user_date
  ON public.usage_records(user_id, recorded_at DESC);

-- usage_records: analytics per-tool breakdown pattern
CREATE INDEX IF NOT EXISTS idx_usage_records_user_tool_date
  ON public.usage_records(user_id, tool, recorded_at DESC);

-- usage_daily_rollups: primary rollup pattern (filter by user, order by date)
CREATE INDEX IF NOT EXISTS idx_usage_daily_rollups_user_date
  ON public.usage_daily_rollups(user_id, date DESC);

-- usage_daily_rollups: per-tool rollup pattern (model distribution, tool comparison)
CREATE INDEX IF NOT EXISTS idx_usage_daily_rollups_user_tool_date
  ON public.usage_daily_rollups(user_id, tool, date DESC);
