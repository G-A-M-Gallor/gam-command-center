import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { automationRunJobSchema } from '@/lib/api/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(_request: Request) {
  const { _user, error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = automationRunJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid _request' },
      { status: 400 },
    );
  }

  const { job } = parsed.data;
  const supabase = createServiceClient();
  const startedAt = new Date();

  // Record run start
  const { data: runRow } = await supabase
    .from('automation_runs')
    .insert({ job_name: job, status: 'running', triggered_by: _user!.id, started_at: startedAt.toISOString() })
    .select('id')
    .single();

  const runId = runRow?.id;

  try {
    let result: Record<string, unknown> = {};
    let success = false;

    switch (job) {
      case 'origami-sync': {
        const origin = new URL(_request.url).origin;
        const res = await fetch(`${origin}/api/origami/sync`, {
          method: 'POST',
          headers: {
            Authorization: _request._headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
        });
        result = await res.json();
        success = res.ok;
        break;
      }

      case 'health-check': {
        const origin = new URL(_request.url).origin;
        const res = await fetch(`${origin}/api/health`);
        result = await res.json();
        success = res.ok;
        break;
      }

      case 'rss-sync': {
        const origin = new URL(_request.url).origin;
        const res = await fetch(`${origin}/api/rss/sync`, {
          method: 'POST',
          headers: {
            Authorization: _request._headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
        });
        result = await res.json();
        success = res.ok;
        break;
      }

      case 'test-notification': {
        const origin = new URL(_request.url).origin;
        const res = await fetch(`${origin}/api/push/send`, {
          method: 'POST',
          headers: {
            Authorization: _request._headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Notification',
            body: `Test from Automation Hub — ${new Date().toLocaleTimeString()}`,
            userId: user!.id,
          }),
        });
        result = await res.json();
        success = res.ok;
        break;
      }
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    // Record run completion
    if (runId) {
      await supabase
        .from('automation_runs')
        .update({
          status: success ? 'success' : 'error',
          result,
          finished_at: finishedAt.toISOString(),
          duration_ms: durationMs,
        })
        .eq('id', runId);
    }

    return NextResponse.json({ success, result });
  } catch (err) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    // Record run failure
    if (runId) {
      await supabase
        .from('automation_runs')
        .update({
          status: 'error',
          result: { error: errorMsg },
          finished_at: finishedAt.toISOString(),
          duration_ms: durationMs,
        })
        .eq('id', runId);
    }

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
