import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceClient();

  // pg_cron stores execution details in cron.job_run_details
  // This requires pg_cron extension (Supabase Pro plan)
  const { data, error } = await supabase.rpc('get_cron_history');

  if (error) {
    // pg_cron not available or RPC not found — return empty gracefully
    return NextResponse.json({ jobs: [], available: false });
  }

  return NextResponse.json({ jobs: data || [], available: true });
}
