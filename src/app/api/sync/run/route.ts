import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { runSyncCycle } from '@/lib/sync/engine';
import type { TriggerType } from '@/lib/sync/types';

/**
 * GET /api/sync/run  — Vercel Cron (sends GET with Authorization header)
 * POST /api/sync/run — Manual trigger from admin UI
 * Auth: CRON_SECRET or JWT
 */
export async function GET(_request: Request) {
  return handleSyncRun(_request);
}

export async function POST(_request: Request) {
  return handleSyncRun(_request);
}

async function handleSyncRun(_request: Request) {
  // Auth: either CRON_SECRET or JWT
  const cronSecret =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  const isVercelCron = process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

  let triggerType: TriggerType = 'scheduled';

  if (!isVercelCron) {
    const { error: authError } = await requireAuth(_request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }
    triggerType = 'manual';
  }

  const supabase = createServiceClient();

  try {
    const result = await runSyncCycle(supabase, triggerType);

    // Log to automation_runs for observability
    await supabase.from('automation_runs').insert({
      job_name: 'sync-engine-v2',
      status: result.errors.length > 0 ? 'partial' : 'success',
      result: {
        tenants: result.tenantsProcessed,
        configs: result.configsProcessed,
        records: result.totalRecords,
        errors: result.errors.length,
        skipped_quota: result.skippedQuota.length,
      },
      started_at: new Date(Date.now() - result.duration_ms).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: result.duration_ms,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[sync/run] Fatal error:', errorMsg);

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
