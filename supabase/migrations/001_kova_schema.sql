-- Kova Dashboard Schema
-- Run this against your Supabase PostgreSQL instance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Builds (core fact table)
CREATE TABLE IF NOT EXISTS public.builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  cli_version TEXT NOT NULL DEFAULT '0.1.0',
  plan_name TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
  exit_code INTEGER,
  error_message TEXT,
  os TEXT,
  node_version TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_builds" ON public.builds FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_builds_user_created ON public.builds(user_id, created_at DESC);
CREATE INDEX idx_builds_user_status ON public.builds(user_id, status);

-- 3. Build Tasks (per-task breakdown)
CREATE TABLE IF NOT EXISTS public.build_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES public.builds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  agent_type TEXT,
  model TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.build_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_build_tasks" ON public.build_tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_build_tasks_build ON public.build_tasks(build_id);

-- 4. Subscriptions (synced from Polar.sh webhooks)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  subscription_status TEXT NOT NULL CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'revoked')),
  product_name TEXT NOT NULL DEFAULT 'Pro',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  price_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  polar_customer_id TEXT,
  raw_event JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (user_id, subscription_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_subs" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 5. API Keys (private schema for CLI authentication)
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'CLI Key',
  key_prefix VARCHAR(8) NOT NULL,
  key_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_prefix ON private.api_keys(key_prefix) WHERE is_active = TRUE;

-- API Key verification function (called by service_role from API routes)
CREATE OR REPLACE FUNCTION private.verify_api_key(p_key TEXT)
RETURNS TABLE(valid BOOLEAN, account_id UUID, account_email TEXT, account_plan TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prefix TEXT;
  v_record private.api_keys%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  v_prefix := LEFT(p_key, 8);

  SELECT * INTO v_record FROM private.api_keys
  WHERE key_prefix = v_prefix AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF crypt(p_key, v_record.key_hash) = v_record.key_hash THEN
    UPDATE private.api_keys SET last_used_at = NOW() WHERE id = v_record.id;
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_record.user_id;
    RETURN QUERY SELECT TRUE, v_record.user_id, v_profile.email, v_profile.plan;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Helper: create API key (returns the plaintext key only once)
CREATE OR REPLACE FUNCTION private.create_api_key(p_user_id UUID, p_name TEXT DEFAULT 'CLI Key')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key TEXT;
  v_prefix TEXT;
  v_hash TEXT;
BEGIN
  v_key := 'kova_' || encode(gen_random_bytes(32), 'hex');
  v_prefix := LEFT(v_key, 8);
  v_hash := crypt(v_key, gen_salt('bf', 12));

  INSERT INTO private.api_keys (user_id, name, key_prefix, key_hash)
  VALUES (p_user_id, p_name, v_prefix, v_hash);

  RETURN v_key;
END;
$$;

-- Helper: get user_id by email (for Polar webhook matching)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(input_email TEXT)
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM auth.users WHERE email = input_email LIMIT 1;
$$;

-- Daily stats materialized view (for analytics performance)
CREATE TABLE IF NOT EXISTS public.build_daily_stats (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  total_builds INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(12, 6) DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.build_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_stats" ON public.build_daily_stats FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_daily_stats_user ON public.build_daily_stats(user_id, date DESC);
