// ── Sync Engine v2 — Usage Metering ──────────────────────────────────

import { SupabaseClient } from '@supabase/supabase-js';
import type { CallClass, QuotaCheckResult } from './types';

/**
 * Tracks usage by calling the increment_sync_usage RPC.
 * Atomic: inserts event + updates monthly rollup + returns quota status.
 */
export async function trackUsage(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    callClass: CallClass;
    eventType: string;
    records: number;
    provider?: string;
    userId?: string | null;
    configId?: string | null;
    runId?: string | null;
    tokens?: number;
  },
): Promise<QuotaCheckResult> {
  const { data, error } = await supabase.rpc('increment_sync_usage', {
    p_tenant_id: params.tenantId,
    p_call_class: params.callClass,
    p_event_type: params.eventType,
    p_records: params.records,
    p_provider: params.provider ?? null,
    p_user_id: params.userId ?? null,
    p_config_id: params.configId ?? null,
    p_run_id: params.runId ?? null,
    p_tokens: params.tokens ?? 0,
  });

  if (error) {
    console.error('[meter] increment_sync_usage failed:', error.message);
    // Fail open — allow the operation but log the error
    return { allowed: true, remaining_auto: -1, remaining_api: -1 };
  }

  return data as QuotaCheckResult;
}

/**
 * Check quota without incrementing (read-only).
 */
export async function checkQuota(
  supabase: SupabaseClient,
  tenantId: string,
  callClass: CallClass = 'automation',
): Promise<QuotaCheckResult> {
  const { data, error } = await supabase.rpc('check_sync_quota', {
    p_tenant_id: tenantId,
    p_call_class: callClass,
  });

  if (error) {
    console.error('[meter] check_sync_quota failed:', error.message);
    return { allowed: true, remaining_auto: -1, remaining_api: -1 };
  }

  return data as QuotaCheckResult;
}
