// ── Sync Engine v2 — Core Orchestrator ───────────────────────────────

import { SupabaseClient } from '@supabase/supabase-js';
import { notionAdapter } from './adapters/notion';
import { trackUsage, checkQuota } from './meter';
import type {
  SyncTenant,
  SyncConfig,
  SyncConnection,
  SyncCycleResult,
  SyncAdapter,
  TriggerType,
} from './types';

const EDGE_FN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notion-sync`;

/**
 * Run a full sync cycle across all active tenants + configs.
 * Called by Vercel Cron every 5 minutes.
 */
export async function runSyncCycle(
  supabase: SupabaseClient,
  triggerType: TriggerType = 'scheduled',
): Promise<SyncCycleResult> {
  const startTime = Date.now();
  const result: SyncCycleResult = {
    tenantsProcessed: 0,
    configsProcessed: 0,
    totalRecords: 0,
    errors: [],
    skippedQuota: [],
    duration_ms: 0,
  };

  // 1. Get all active tenants
  const { data: tenants, error: tenantErr } = await supabase
    .from('sync_tenants')
    .select('*')
    .eq('status', 'active');

  if (tenantErr || !tenants) {
    result.errors.push({ tenantId: '*', error: tenantErr?.message || 'No tenants found' });
    result.duration_ms = Date.now() - startTime;
    return result;
  }

  for (const tenant of tenants as SyncTenant[]) {
    try {
      await processTenant(supabase, tenant, triggerType, result);
      result.tenantsProcessed++;
    } catch (err) {
      result.errors.push({
        tenantId: tenant.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}

/**
 * Process all sync configs for a single tenant.
 */
async function processTenant(
  supabase: SupabaseClient,
  tenant: SyncTenant,
  triggerType: TriggerType,
  result: SyncCycleResult,
) {
  // Check quota before processing any configs
  const quota = await checkQuota(supabase, tenant.id, 'automation');
  if (!quota.allowed) {
    result.skippedQuota.push(tenant.id);
    console.log(`[sync] Tenant ${tenant.display_name} over quota — skipping`);
    return;
  }

  // Get active configs with their connections
  const { data: configs, error: configErr } = await supabase
    .from('sync_configs')
    .select('*, sync_connections(*)')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);

  if (configErr || !configs) return;

  for (const configRow of configs) {
    const config = configRow as SyncConfig & { sync_connections: SyncConnection };
    const connection = config.sync_connections;

    if (!connection || connection.status !== 'active') continue;

    try {
      await processConfig(supabase, tenant, config, connection, triggerType, result);
      result.configsProcessed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.errors.push({ tenantId: tenant.id, configId: config.id, error: errorMsg });

      // Update config with error status
      await supabase
        .from('sync_configs')
        .update({ last_sync_status: 'error', last_sync_at: new Date().toISOString() })
        .eq('id', config.id);
    }
  }
}

/**
 * Process a single sync config: delta fetch → upsert → meter.
 */
async function processConfig(
  supabase: SupabaseClient,
  tenant: SyncTenant,
  config: SyncConfig,
  connection: SyncConnection,
  triggerType: TriggerType,
  result: SyncCycleResult,
) {
  // 1. Get adapter for this source type
  const adapter = getAdapter(config.source_type);
  if (!adapter) {
    throw new Error(`No adapter for source_type: ${config.source_type}`);
  }

  // 2. Get API key (from connection credentials or env fallback)
  const apiKey = await getApiKey(supabase, connection);
  if (!apiKey) {
    throw new Error(`No API key for connection: ${connection.id}`);
  }

  // 3. Delta fetch
  const { items, newCursor } = await adapter.fetchDelta(
    apiKey,
    config.source_id,
    config.last_sync_cursor,
  );

  // Nothing changed → zero load
  if (items.length === 0) {
    await supabase
      .from('sync_configs')
      .update({ last_sync_at: new Date().toISOString(), last_sync_status: 'idle' })
      .eq('id', config.id);
    return;
  }

  // 4. Create sync run
  const { data: run } = await supabase
    .from('sync_runs')
    .insert({
      tenant_id: tenant.id,
      config_id: config.id,
      status: 'running',
      trigger_type: triggerType,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  const runId = run?.id;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  const errorLog: Array<{ message: string; record_id?: string; timestamp: string }> = [];

  // 5. Upsert each item via Edge Function (reuses existing notion-sync handlers)
  for (const item of items) {
    try {
      const page = item as { id: string; parent?: { database_id?: string } };

      // Ensure parent.database_id is set (Edge Function uses it for routing)
      if (!page.parent?.database_id) {
        // Set it from config.source_id
        if (!page.parent) (page as Record<string, unknown>).parent = {};
        (page.parent as Record<string, string>).database_id = config.source_id.replace(/-/g, '');
      }

      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        _headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ data: page }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Edge Function error ${response.status}: ${text}`);
      }

      recordsCreated++; // Edge function does upsert, so we count all as created/updated
    } catch (err) {
      recordsFailed++;
      errorLog.push({
        message: err instanceof Error ? err.message : String(err),
        record_id: (item as { id?: string }).id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const totalProcessed = recordsCreated + recordsFailed;
  recordsUpdated = recordsCreated; // upserts are effectively updates
  result.totalRecords += recordsCreated;

  // 6. Track usage
  await trackUsage(supabase, {
    tenantId: tenant.id,
    callClass: 'automation',
    eventType: 'sync_pull',
    records: totalProcessed,
    provider: connection.provider,
    configId: config.id,
    runId,
  });

  // 7. Complete the run
  const finishedAt = new Date().toISOString();
  const duration = run ? Date.now() - new Date(run.id ? finishedAt : finishedAt).getTime() : 0;

  if (runId) {
    await supabase
      .from('sync_runs')
      .update({
        status: recordsFailed > 0 ? (recordsCreated > 0 ? 'partial' : 'failed') : 'completed',
        records_processed: totalProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        error_log: errorLog,
        finished_at: finishedAt,
        duration_ms: Date.now() - new Date(finishedAt).getTime(),
      })
      .eq('id', runId);
  }

  // 8. Update config cursor for next delta
  await supabase
    .from('sync_configs')
    .update({
      last_sync_at: finishedAt,
      last_sync_cursor: newCursor,
      last_sync_status: recordsFailed > 0 ? 'partial' : 'ok',
      last_sync_records: recordsCreated,
    })
    .eq('id', config.id);

  console.log(
    `[sync] ${config.name}: ${recordsCreated} synced, ${recordsFailed} failed (tenant: ${tenant.display_name})`,
  );
}

/**
 * Get the right adapter for a source type.
 */
function getAdapter(sourceType: string): SyncAdapter | null {
  switch (sourceType) {
    case 'notion_db':
      return notionAdapter;
    // Future: case 'origami_entity': return origamiAdapter;
    default:
      return null;
  }
}

/**
 * Get API key from encrypted connection credentials, with env fallback.
 */
async function getApiKey(
  supabase: SupabaseClient,
  connection: SyncConnection,
): Promise<string | null> {
  // Try decrypting stored credentials
  const encryptionKey = process.env.SYNC_ENCRYPTION_KEY;
  if (encryptionKey) {
    const { data } = await supabase.rpc('decrypt_connection_credentials', {
      p_connection_id: connection.id,
      p_encryption_key: encryptionKey,
    });

    if (data?.api_key) return data.api_key;
  }

  // Fallback: use environment variable for the provider
  switch (connection.provider) {
    case 'notion':
      return process.env.NOTION_API_KEY || null;
    case 'origami':
      return process.env.ORIGAMI_API_KEY || null;
    default:
      return null;
  }
}
