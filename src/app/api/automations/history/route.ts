import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const jobFilter = searchParams.get('job');

  let query = supabase
    .from('automation_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50);

  if (jobFilter) {
    query = query.eq('job_name', jobFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ runs: data });
}
