// ===================================================
// GAM Command Center — Health Check Endpoint
// GET /api/health — checks DB, Auth, RLS (read-only)
// ===================================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type CheckStatus = 'pass' | 'fail';

export async function GET() {
  const checks: Record<string, CheckStatus> = {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Database connectivity (service role) — read-only check
  try {
    const supabase = createClient(url, serviceKey);
    const { error } = await supabase.from('projects').select('id').limit(1);
    checks.database = error ? 'fail' : 'pass';
  } catch {
    checks.database = 'fail';
  }

  // 2. Auth service
  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.auth.getSession();
    checks.auth = error ? 'fail' : 'pass';
  } catch {
    checks.auth = 'fail';
  }

  // 3. RLS enforcement — anon client should NOT see authenticated-only data
  try {
    const anonClient = createClient(url, anonKey);
    const { data, error } = await anonClient.from('vb_records').select('id').limit(1);
    if (error) {
      // Error means RLS is blocking — good
      checks.rls = 'pass';
    } else if (!data || data.length === 0) {
      checks.rls = 'pass';
    } else {
      checks.rls = 'fail';
    }
  } catch {
    checks.rls = 'fail';
  }

  // Overall status
  const allPassing = Object.values(checks).every((s) => s === 'pass');

  return NextResponse.json(
    {
      status: allPassing ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allPassing ? 200 : 503 },
  );
}
