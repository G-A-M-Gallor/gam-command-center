-- =====================================================================
-- Sync Engine v2 — Full SaaS Infrastructure
-- Multi-tenant sync with usage metering, delta tracking, audit trail
-- =====================================================================

-- Ensure pgcrypto is available (Supabase has it by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. SYNC PLANS ───────────────────────────────────────────────────
-- Plan definitions for tiered pricing

CREATE TABLE IF NOT EXISTS sync_plans (
  id                  TEXT PRIMARY KEY,
  display_name        TEXT NOT NULL,
  display_name_he     TEXT NOT NULL,
  -- Automation limits (background sync operations)
  monthly_auto_ops    INT NOT NULL DEFAULT 1000,
  -- API limits (direct API calls from users/external)
  monthly_api_calls   INT NOT NULL DEFAULT 500,
  -- Rate limits (per minute)
  rate_limit_per_min  INT NOT NULL DEFAULT 10,
  -- Resource limits
  max_connections     INT NOT NULL DEFAULT 1,
  max_sync_configs    INT NOT NULL DEFAULT 3,
  max_team_members    INT NOT NULL DEFAULT 3,
  -- AI limits
  monthly_ai_tokens   INT NOT NULL DEFAULT 0,
  -- Pricing
  price_monthly_ils   NUMERIC(10,2) DEFAULT 0,
  stripe_price_id     TEXT,
  features            JSONB DEFAULT '{}',
  is_active           BOOLEAN DEFAULT true,
  sort_order          INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Seed plan tiers
INSERT INTO sync_plans (id, display_name, display_name_he, monthly_auto_ops, monthly_api_calls, rate_limit_per_min, max_connections, max_sync_configs, max_team_members, monthly_ai_tokens, price_monthly_ils, sort_order) VALUES
  ('free',       'Free',       'חינם',    1000,       500,     10,  1,   3,   3,        0, 0,     0),
  ('starter',    'Starter',    'סטארטר',  10000,      5000,    50,  3,   10,  5,   100000, 99,    1),
  ('pro',        'Pro',        'פרו',     50000,      25000,  120,  10,  50,  15,  500000, 299,   2),
  ('enterprise', 'Enterprise', 'ארגוני',  2147483647, 2147483647, 240, 2147483647, 2147483647, 2147483647, 2147483647, NULL, 3)
ON CONFLICT (id) DO NOTHING;


-- ── 2. SYNC TENANTS ─────────────────────────────────────────────────
-- One tenant per workspace. Multi-tenant from day 1.

CREATE TABLE IF NOT EXISTS sync_tenants (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id          UUID UNIQUE REFERENCES vb_workspaces(id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL,
  plan_id               TEXT REFERENCES sync_plans(id) DEFAULT 'free',
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','trial','churned')),
  -- Stripe (future)
  stripe_customer_id    TEXT,
  billing_email         TEXT,
  -- Overrides (for custom deals)
  override_auto_ops     INT,
  override_api_calls    INT,
  override_rate_limit   INT,
  -- Settings
  settings              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_tenants_workspace ON sync_tenants(workspace_id);
CREATE INDEX idx_sync_tenants_plan ON sync_tenants(plan_id);
CREATE INDEX idx_sync_tenants_status ON sync_tenants(status);

-- Audit trigger
DROP TRIGGER IF EXISTS trg_audit_sync_tenants ON sync_tenants;
CREATE TRIGGER trg_audit_sync_tenants
  AFTER INSERT OR UPDATE OR DELETE ON sync_tenants
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Seed GAM as enterprise tenant
INSERT INTO sync_tenants (id, workspace_id, display_name, plan_id, status)
SELECT
  gen_random_uuid(),
  w.id,
  'GAM',
  'enterprise',
  'active'
FROM workspaces w WHERE w.slug = 'gam'
ON CONFLICT (workspace_id) DO NOTHING;


-- ── 3. SYNC CONNECTIONS ─────────────────────────────────────────────
-- Encrypted credential storage for external APIs

CREATE TABLE IF NOT EXISTS sync_connections (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES sync_tenants(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','pending','error','disabled')),
  -- Encrypted credentials (pgcrypto pgp_sym_encrypt)
  credentials_enc   BYTEA,
  credentials_hint  TEXT,
  -- Auth method
  auth_method       TEXT NOT NULL DEFAULT 'api_key'
                    CHECK (auth_method IN ('api_key','oauth2','webhook_secret')),
  oauth_refresh_enc BYTEA,
  oauth_expires_at  TIMESTAMPTZ,
  -- Health
  last_verified_at  TIMESTAMPTZ,
  error_message     TEXT,
  meta              JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_connections_tenant ON sync_connections(tenant_id);
CREATE INDEX idx_sync_connections_provider ON sync_connections(provider);

-- Audit trigger
DROP TRIGGER IF EXISTS trg_audit_sync_connections ON sync_connections;
CREATE TRIGGER trg_audit_sync_connections
  AFTER INSERT OR UPDATE OR DELETE ON sync_connections
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- SECURITY DEFINER RPC: decrypt credentials (only callable server-side)
CREATE OR REPLACE FUNCTION decrypt_connection_credentials(
  p_connection_id UUID,
  p_encryption_key TEXT
)
RETURNS JSONB AS $$
  SELECT pgp_sym_decrypt(credentials_enc, p_encryption_key)::jsonb
  FROM sync_connections
  WHERE id = p_connection_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: encrypt credentials for INSERT/UPDATE
CREATE OR REPLACE FUNCTION encrypt_credentials(
  p_credentials JSONB,
  p_encryption_key TEXT
)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(p_credentials::text, p_encryption_key);
$$ LANGUAGE sql SECURITY DEFINER;


-- ── 4. SYNC CONFIGS ─────────────────────────────────────────────────
-- What to sync: source → target mapping

CREATE TABLE IF NOT EXISTS sync_configs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES sync_tenants(id) ON DELETE CASCADE,
  connection_id     UUID NOT NULL REFERENCES sync_connections(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  source_type       TEXT NOT NULL,
  source_id         TEXT NOT NULL,
  target_table      TEXT NOT NULL,
  field_mapping     JSONB DEFAULT '{}',
  sync_frequency    TEXT NOT NULL DEFAULT '5min',
  filters           JSONB DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  -- Delta tracking
  last_sync_at      TIMESTAMPTZ,
  last_sync_cursor  TEXT,
  last_sync_status  TEXT,
  last_sync_records INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_configs_tenant ON sync_configs(tenant_id);
CREATE INDEX idx_sync_configs_connection ON sync_configs(connection_id);
CREATE INDEX idx_sync_configs_active ON sync_configs(is_active) WHERE is_active = true;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_audit_sync_configs ON sync_configs;
CREATE TRIGGER trg_audit_sync_configs
  AFTER INSERT OR UPDATE OR DELETE ON sync_configs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


-- ── 5. SYNC RUNS ────────────────────────────────────────────────────
-- Job execution log

CREATE TABLE IF NOT EXISTS sync_runs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES sync_tenants(id) ON DELETE CASCADE,
  config_id         UUID REFERENCES sync_configs(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','completed','failed','partial','skipped')),
  trigger_type      TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (trigger_type IN ('scheduled','manual','webhook','retry')),
  records_processed INT DEFAULT 0,
  records_created   INT DEFAULT 0,
  records_updated   INT DEFAULT 0,
  records_failed    INT DEFAULT 0,
  error_log         JSONB DEFAULT '[]',
  retry_count       INT DEFAULT 0,
  parent_run_id     UUID REFERENCES sync_runs(id),
  started_at        TIMESTAMPTZ DEFAULT now(),
  finished_at       TIMESTAMPTZ,
  duration_ms       INT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_runs_tenant ON sync_runs(tenant_id);
CREATE INDEX idx_sync_runs_config ON sync_runs(config_id);
CREATE INDEX idx_sync_runs_status ON sync_runs(status);
CREATE INDEX idx_sync_runs_started ON sync_runs(started_at DESC);


-- ── 6. SYNC EVENTS ──────────────────────────────────────────────────
-- Granular usage metering — the billing source of truth

CREATE TABLE IF NOT EXISTS sync_events (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES sync_tenants(id) ON DELETE CASCADE,
  -- Call classification (separate billing tracks)
  call_class        TEXT NOT NULL
                    CHECK (call_class IN ('automation','user_action','api_external','mcp_external','system')),
  event_type        TEXT NOT NULL,
  provider          TEXT,
  -- Metrics
  records_affected  INT DEFAULT 0,
  tokens_used       INT DEFAULT 0,
  bytes_transferred BIGINT DEFAULT 0,
  -- Attribution
  user_id           UUID,
  config_id         UUID,
  run_id            UUID,
  -- Billing
  billable          BOOLEAN DEFAULT true,
  meta              JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_events_tenant ON sync_events(tenant_id);
CREATE INDEX idx_sync_events_class ON sync_events(call_class);
CREATE INDEX idx_sync_events_created ON sync_events(created_at DESC);
CREATE INDEX idx_sync_events_billing ON sync_events(tenant_id, call_class, created_at)
  WHERE billable = true;


-- ── 7. SYNC USAGE MONTHLY ───────────────────────────────────────────
-- Monthly rollup for fast billing queries

CREATE TABLE IF NOT EXISTS sync_usage_monthly (
  tenant_id        UUID NOT NULL REFERENCES sync_tenants(id) ON DELETE CASCADE,
  month            DATE NOT NULL,
  -- Separated by call_class
  auto_ops         INT DEFAULT 0,
  api_ops          INT DEFAULT 0,
  mcp_ops          INT DEFAULT 0,
  user_ops         INT DEFAULT 0,
  system_ops       INT DEFAULT 0,
  -- Totals
  total_billable   INT DEFAULT 0,
  records_synced   INT DEFAULT 0,
  ai_tokens_used   INT DEFAULT 0,
  -- Plan snapshot at month start
  plan_auto_limit  INT NOT NULL DEFAULT 0,
  plan_api_limit   INT NOT NULL DEFAULT 0,
  -- Overage
  auto_overage     INT DEFAULT 0,
  api_overage      INT DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tenant_id, month)
);


-- ── 8. SYNC AUDIT LOG ──────────────────────────────────────────────
-- Dedicated audit for sync operations — never purged (legal evidence)

CREATE TABLE IF NOT EXISTS sync_audit_log (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id        UUID,
  actor_id         UUID,
  actor_type       TEXT DEFAULT 'system'
                   CHECK (actor_type IN ('user','system','cron','webhook','mcp')),
  action           TEXT NOT NULL,
  resource_type    TEXT NOT NULL,
  resource_id      TEXT,
  old_value        JSONB,
  new_value        JSONB,
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_audit_tenant ON sync_audit_log(tenant_id);
CREATE INDEX idx_sync_audit_action ON sync_audit_log(action);
CREATE INDEX idx_sync_audit_created ON sync_audit_log(created_at DESC);


-- ── 9. INCREMENT USAGE RPC ──────────────────────────────────────────
-- Atomic: insert event + upsert monthly rollup + quota check

CREATE OR REPLACE FUNCTION increment_sync_usage(
  p_tenant_id   UUID,
  p_call_class  TEXT,
  p_event_type  TEXT,
  p_records     INT DEFAULT 1,
  p_provider    TEXT DEFAULT NULL,
  p_user_id     UUID DEFAULT NULL,
  p_config_id   UUID DEFAULT NULL,
  p_run_id      UUID DEFAULT NULL,
  p_tokens      INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_month         DATE;
  v_plan_id       TEXT;
  v_auto_limit    INT;
  v_api_limit     INT;
  v_override_auto INT;
  v_override_api  INT;
  v_current_auto  INT;
  v_current_api   INT;
  v_effective_auto_limit INT;
  v_effective_api_limit  INT;
  v_allowed       BOOLEAN;
  v_billable      BOOLEAN;
BEGIN
  v_month := date_trunc('month', now())::date;
  v_billable := (p_call_class != 'system');

  -- 1. Get tenant plan limits
  SELECT t.plan_id, t.override_auto_ops, t.override_api_calls,
         p.monthly_auto_ops, p.monthly_api_calls
  INTO v_plan_id, v_override_auto, v_override_api, v_auto_limit, v_api_limit
  FROM sync_tenants t
  JOIN sync_plans p ON p.id = t.plan_id
  WHERE t.id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'tenant_not_found');
  END IF;

  -- Apply overrides
  v_effective_auto_limit := COALESCE(v_override_auto, v_auto_limit);
  v_effective_api_limit := COALESCE(v_override_api, v_api_limit);

  -- 2. Insert event
  INSERT INTO sync_events (
    tenant_id, call_class, event_type, provider,
    records_affected, tokens_used, user_id, config_id, run_id, billable
  ) VALUES (
    p_tenant_id, p_call_class, p_event_type, p_provider,
    p_records, p_tokens, p_user_id, p_config_id, p_run_id, v_billable
  );

  -- 3. Upsert monthly rollup
  INSERT INTO sync_usage_monthly (
    tenant_id, month, plan_auto_limit, plan_api_limit,
    auto_ops, api_ops, mcp_ops, user_ops, system_ops,
    total_billable, records_synced, ai_tokens_used
  ) VALUES (
    p_tenant_id, v_month, v_effective_auto_limit, v_effective_api_limit,
    CASE WHEN p_call_class = 'automation' THEN p_records ELSE 0 END,
    CASE WHEN p_call_class = 'api_external' THEN p_records ELSE 0 END,
    CASE WHEN p_call_class = 'mcp_external' THEN p_records ELSE 0 END,
    CASE WHEN p_call_class = 'user_action' THEN p_records ELSE 0 END,
    CASE WHEN p_call_class = 'system' THEN p_records ELSE 0 END,
    CASE WHEN v_billable THEN p_records ELSE 0 END,
    p_records,
    p_tokens
  )
  ON CONFLICT (tenant_id, month) DO UPDATE SET
    auto_ops       = sync_usage_monthly.auto_ops + CASE WHEN p_call_class = 'automation' THEN p_records ELSE 0 END,
    api_ops        = sync_usage_monthly.api_ops + CASE WHEN p_call_class = 'api_external' THEN p_records ELSE 0 END,
    mcp_ops        = sync_usage_monthly.mcp_ops + CASE WHEN p_call_class = 'mcp_external' THEN p_records ELSE 0 END,
    user_ops       = sync_usage_monthly.user_ops + CASE WHEN p_call_class = 'user_action' THEN p_records ELSE 0 END,
    system_ops     = sync_usage_monthly.system_ops + CASE WHEN p_call_class = 'system' THEN p_records ELSE 0 END,
    total_billable = sync_usage_monthly.total_billable + CASE WHEN v_billable THEN p_records ELSE 0 END,
    records_synced = sync_usage_monthly.records_synced + p_records,
    ai_tokens_used = sync_usage_monthly.ai_tokens_used + p_tokens,
    auto_overage   = GREATEST(0, sync_usage_monthly.auto_ops + CASE WHEN p_call_class = 'automation' THEN p_records ELSE 0 END - v_effective_auto_limit),
    api_overage    = GREATEST(0, sync_usage_monthly.api_ops + CASE WHEN p_call_class = 'api_external' THEN p_records ELSE 0 END - v_effective_api_limit),
    updated_at     = now();

  -- 4. Check quota
  SELECT auto_ops, api_ops INTO v_current_auto, v_current_api
  FROM sync_usage_monthly
  WHERE tenant_id = p_tenant_id AND month = v_month;

  v_allowed := true;
  IF p_call_class = 'automation' AND v_current_auto > v_effective_auto_limit THEN
    v_allowed := false;
  ELSIF p_call_class IN ('api_external', 'mcp_external') AND v_current_api > v_effective_api_limit THEN
    v_allowed := false;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining_auto', GREATEST(0, v_effective_auto_limit - COALESCE(v_current_auto, 0)),
    'remaining_api', GREATEST(0, v_effective_api_limit - COALESCE(v_current_api, 0)),
    'plan', v_plan_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 10. CHECK QUOTA RPC (read-only) ─────────────────────────────────

CREATE OR REPLACE FUNCTION check_sync_quota(
  p_tenant_id  UUID,
  p_call_class TEXT DEFAULT 'automation'
)
RETURNS JSONB AS $$
DECLARE
  v_month          DATE;
  v_auto_limit     INT;
  v_api_limit      INT;
  v_current_auto   INT DEFAULT 0;
  v_current_api    INT DEFAULT 0;
  v_allowed        BOOLEAN;
BEGIN
  v_month := date_trunc('month', now())::date;

  -- Get effective limits
  SELECT
    COALESCE(t.override_auto_ops, p.monthly_auto_ops),
    COALESCE(t.override_api_calls, p.monthly_api_calls)
  INTO v_auto_limit, v_api_limit
  FROM sync_tenants t
  JOIN sync_plans p ON p.id = t.plan_id
  WHERE t.id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'tenant_not_found');
  END IF;

  -- Get current usage
  SELECT auto_ops, api_ops INTO v_current_auto, v_current_api
  FROM sync_usage_monthly
  WHERE tenant_id = p_tenant_id AND month = v_month;

  v_allowed := true;
  IF p_call_class = 'automation' AND v_current_auto >= v_auto_limit THEN
    v_allowed := false;
  ELSIF p_call_class IN ('api_external', 'mcp_external') AND v_current_api >= v_api_limit THEN
    v_allowed := false;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining_auto', GREATEST(0, v_auto_limit - v_current_auto),
    'remaining_api', GREATEST(0, v_api_limit - v_current_api),
    'auto_used', v_current_auto,
    'api_used', v_current_api,
    'auto_limit', v_auto_limit,
    'api_limit', v_api_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 11. RLS POLICIES ────────────────────────────────────────────────

-- Helper: get tenant_id for current user
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT st.id
  FROM sync_tenants st
  JOIN vb_workspace_users wm ON wm.workspace_id = st.workspace_id
  WHERE wm.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- sync_plans: everyone can read
ALTER TABLE sync_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_read" ON sync_plans FOR SELECT TO authenticated USING (true);

-- sync_tenants: workspace members can read, owners can update
ALTER TABLE sync_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_read" ON sync_tenants FOR SELECT TO authenticated
  USING (id = get_user_tenant_id());
CREATE POLICY "tenants_update" ON sync_tenants FOR UPDATE TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM vb_workspace_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- sync_connections: tenant members can read (no credentials), admins can manage
ALTER TABLE sync_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "connections_read" ON sync_connections FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "connections_manage" ON sync_connections FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT st.id FROM sync_tenants st
      JOIN vb_workspace_users wm ON wm.workspace_id = st.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- sync_configs: tenant members can read, admins can manage
ALTER TABLE sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "configs_read" ON sync_configs FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "configs_manage" ON sync_configs FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT st.id FROM sync_tenants st
      JOIN vb_workspace_users wm ON wm.workspace_id = st.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- sync_runs: tenant members can read
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runs_read" ON sync_runs FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- sync_events: tenant members can read
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read" ON sync_events FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- sync_usage_monthly: tenant members can read
ALTER TABLE sync_usage_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_read" ON sync_usage_monthly FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- sync_audit_log: tenant members can read their own
ALTER TABLE sync_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read" ON sync_audit_log FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());


-- ── 12. SEED GAM NOTION CONNECTION + CONFIGS ────────────────────────
-- These use DO blocks to reference the tenant dynamically

DO $$
DECLARE
  v_tenant_id UUID;
  v_conn_id   UUID;
BEGIN
  -- Get GAM tenant
  SELECT st.id INTO v_tenant_id
  FROM sync_tenants st
  JOIN workspaces w ON w.id = st.workspace_id
  WHERE w.slug = 'gam';

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'GAM tenant not found, skipping seed';
    RETURN;
  END IF;

  -- Create Notion connection (credentials stored encrypted — set via API later)
  v_conn_id := gen_random_uuid();
  INSERT INTO sync_connections (id, tenant_id, provider, display_name, status, auth_method, credentials_hint, last_verified_at)
  VALUES (
    v_conn_id,
    v_tenant_id,
    'notion',
    'Notion — GAM Workspace',
    'active',
    'api_key',
    '...5gx',
    now()
  )
  ON CONFLICT DO NOTHING;

  -- If connection already existed, get its ID
  IF NOT FOUND THEN
    SELECT id INTO v_conn_id FROM sync_connections
    WHERE tenant_id = v_tenant_id AND provider = 'notion' LIMIT 1;
  END IF;

  -- Seed 7 sync configs for existing Notion DBs
  INSERT INTO sync_configs (tenant_id, connection_id, name, source_type, source_id, target_table) VALUES
    (v_tenant_id, v_conn_id, 'Goals',      'notion_db', '5c763111-a2a3-492d-a8cd-8b1ee8520610', 'goals'),
    (v_tenant_id, v_conn_id, 'Portfolios', 'notion_db', '72be2bbc-ba3e-49b5-9ec9-1009df235777', 'portfolios'),
    (v_tenant_id, v_conn_id, 'Projects',   'notion_db', '95e23b99-655c-4784-958f-4779f15d5e3c', 'roadmap_projects'),
    (v_tenant_id, v_conn_id, 'Sprints',    'notion_db', '2529dae7-6133-4e01-ae0a-38760df51f27', 'sprints'),
    (v_tenant_id, v_conn_id, 'Tasks',      'notion_db', '453d2402-8c33-4a9a-a6b2-c677a109bc05', 'tasks'),
    (v_tenant_id, v_conn_id, 'Sub-tasks',  'notion_db', '3191236e-1458-4cf0-81ef-afee9840460d', 'sub_tasks'),
    (v_tenant_id, v_conn_id, 'CEO Intake', 'notion_db', '938f1761-465b-4541-aa27-e7bc1a327375', 'ceo_intake')
  ON CONFLICT DO NOTHING;

END $$;
