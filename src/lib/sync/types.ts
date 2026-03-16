// ── Sync Engine v2 — Type Definitions ────────────────────────────────

export type SyncPlanId = 'free' | 'starter' | 'pro' | 'enterprise';

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'churned';

export type ConnectionStatus = 'active' | 'pending' | 'error' | 'disabled';
export type AuthMethod = 'api_key' | 'oauth2' | 'webhook_secret';

export type SyncRunStatus = 'running' | 'completed' | 'failed' | 'partial' | 'skipped';
export type TriggerType = 'scheduled' | 'manual' | 'webhook' | 'retry';

export type CallClass = 'automation' | 'user_action' | 'api_external' | 'mcp_external' | 'system';

export type SyncProvider = 'notion' | 'origami' | 'wati' | 'stripe' | 'mcp_custom';
export type SourceType = 'notion_db' | 'origami_entity' | 'wati_contacts';

// ── DB Row Types ────────────────────────────────────────────────────

export interface SyncPlan {
  id: SyncPlanId;
  display_name: string;
  display_name_he: string;
  monthly_auto_ops: number;
  monthly_api_calls: number;
  rate_limit_per_min: number;
  max_connections: number;
  max_sync_configs: number;
  max_team_members: number;
  monthly_ai_tokens: number;
  price_monthly_ils: number | null;
  stripe_price_id: string | null;
  features: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

export interface SyncTenant {
  id: string;
  workspace_id: string;
  display_name: string;
  plan_id: SyncPlanId;
  status: TenantStatus;
  stripe_customer_id: string | null;
  billing_email: string | null;
  override_auto_ops: number | null;
  override_api_calls: number | null;
  override_rate_limit: number | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface SyncConnection {
  id: string;
  tenant_id: string;
  provider: SyncProvider;
  display_name: string;
  status: ConnectionStatus;
  credentials_hint: string | null;
  auth_method: AuthMethod;
  last_verified_at: string | null;
  error_message: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface SyncConfig {
  id: string;
  tenant_id: string;
  connection_id: string;
  name: string;
  source_type: SourceType;
  source_id: string;
  target_table: string;
  field_mapping: Record<string, unknown>;
  sync_frequency: string;
  filters: Record<string, unknown>;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_cursor: string | null;
  last_sync_status: string | null;
  last_sync_records: number;
  created_at: string;
}

export interface SyncRun {
  id: string;
  tenant_id: string;
  config_id: string | null;
  status: SyncRunStatus;
  trigger_type: TriggerType;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_log: Array<{ message: string; record_id?: string; timestamp: string }>;
  retry_count: number;
  parent_run_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
}

export interface SyncEvent {
  id: number;
  tenant_id: string;
  call_class: CallClass;
  event_type: string;
  provider: string | null;
  records_affected: number;
  tokens_used: number;
  bytes_transferred: number;
  user_id: string | null;
  config_id: string | null;
  run_id: string | null;
  billable: boolean;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface SyncUsageMonthly {
  tenant_id: string;
  month: string;
  auto_ops: number;
  api_ops: number;
  mcp_ops: number;
  user_ops: number;
  system_ops: number;
  total_billable: number;
  records_synced: number;
  ai_tokens_used: number;
  plan_auto_limit: number;
  plan_api_limit: number;
  auto_overage: number;
  api_overage: number;
}

// ── RPC Return Types ────────────────────────────────────────────────

export interface QuotaCheckResult {
  allowed: boolean;
  remaining_auto: number;
  remaining_api: number;
  auto_used?: number;
  api_used?: number;
  auto_limit?: number;
  api_limit?: number;
  plan?: string;
  error?: string;
}

// ── Adapter Interface ───────────────────────────────────────────────

export interface DeltaResult {
  items: unknown[];
  newCursor: string | null;
}

export interface SyncAdapter {
  fetchDelta(
    apiKey: string,
    sourceId: string,
    lastCursor: string | null,
  ): Promise<DeltaResult>;
}

// ── Engine Types ────────────────────────────────────────────────────

export interface SyncCycleResult {
  tenantsProcessed: number;
  configsProcessed: number;
  totalRecords: number;
  errors: Array<{ tenantId: string; configId?: string; error: string }>;
  skippedQuota: string[];
  duration_ms: number;
}
