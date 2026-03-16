import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/sync/status
 * Auth: JWT required
 * Returns sync status for the current user's tenant.
 */
export async function GET(request: Request) {
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get all sync configs with latest run info
  const { data: configs } = await supabase
    .from('sync_configs')
    .select('id, name, source_type, target_table, is_active, last_sync_at, last_sync_status, last_sync_records, last_sync_cursor')
    .order('name');

  // Get last 10 runs
  const { data: recentRuns } = await supabase
    .from('sync_runs')
    .select('id, config_id, status, trigger_type, records_processed, records_failed, started_at, finished_at, duration_ms')
    .order('started_at', { ascending: false })
    .limit(10);

  // Get current month usage
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const { data: usage } = await supabase
    .from('sync_usage_monthly')
    .select('*')
    .eq('month', currentMonth)
    .limit(1)
    .single();

  return NextResponse.json({
    configs: configs || [],
    recentRuns: recentRuns || [],
    usage: usage || null,
  });
}
