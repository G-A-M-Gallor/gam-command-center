// ===================================================
// GAM Command Center — Health Check Endpoint
// GET /api/health — checks DB, Auth, RLS, write cycle
// ===================================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number;
  error?: string;
}

export async function GET() {
  const checks: Record<string, HealthCheck> = {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Database connectivity (service role)
  const dbStart = Date.now();
  try {
    const supabase = createClient(url, serviceKey);
    const { error } = await supabase.from('projects').select('id').limit(1);
    checks.database = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - dbStart,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    checks.database = { status: 'down', latency: Date.now() - dbStart, error: String(e) };
  }

  // 2. Auth service
  const authStart = Date.now();
  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.auth.getSession();
    checks.auth = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - authStart,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    checks.auth = { status: 'down', latency: Date.now() - authStart, error: String(e) };
  }

  // 3. RLS enforcement — anon client should NOT see authenticated-only data
  const rlsStart = Date.now();
  try {
    const anonClient = createClient(url, anonKey);
    const { data, error } = await anonClient.from('vb_records').select('id').limit(1);
    if (error) {
      // Error means RLS is blocking — good
      checks.rls = { status: 'healthy', latency: Date.now() - rlsStart };
    } else if (!data || data.length === 0) {
      checks.rls = { status: 'healthy', latency: Date.now() - rlsStart };
    } else {
      checks.rls = {
        status: 'degraded',
        latency: Date.now() - rlsStart,
        error: 'RLS may be misconfigured — anonymous user can read vb_records',
      };
    }
  } catch (e) {
    checks.rls = { status: 'unknown', latency: Date.now() - rlsStart, error: String(e) };
  }

  // 4. Write cycle — insert + update + delete a test record (service role)
  const writeStart = Date.now();
  try {
    const supabase = createClient(url, serviceKey);

    // Insert
    const { data: inserted, error: insertErr } = await supabase
      .from('vb_records')
      .insert({
        title: '_health_check',
        record_type: '_health_check',
        content: { test: true },
        workspace_id: '00000000-0000-0000-0000-000000000000',
        entity_id: '00000000-0000-0000-0000-000000000000',
        created_by: '00000000-0000-0000-0000-000000000000',
      })
      .select('id')
      .single();

    if (insertErr || !inserted) {
      checks.write = {
        status: 'degraded',
        latency: Date.now() - writeStart,
        error: `Insert failed: ${insertErr?.message || 'no data'}`,
      };
    } else {
      // Update
      const { error: updateErr } = await supabase
        .from('vb_records')
        .update({ title: '_health_check_updated' })
        .eq('id', inserted.id);

      // Delete (hard delete for cleanup)
      await supabase.from('vb_records').delete().eq('id', inserted.id);

      checks.write = {
        status: updateErr ? 'degraded' : 'healthy',
        latency: Date.now() - writeStart,
        ...(updateErr && { error: `Update failed: ${updateErr.message}` }),
      };
    }
  } catch (e) {
    checks.write = { status: 'down', latency: Date.now() - writeStart, error: String(e) };
  }

  // Overall status
  const statuses = Object.values(checks).map((c) => c.status);
  const overallStatus = statuses.includes('down')
    ? 'down'
    : statuses.includes('degraded')
      ? 'degraded'
      : 'healthy';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: overallStatus === 'down' ? 503 : 200 },
  );
}
