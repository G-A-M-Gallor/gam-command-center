import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select('id, table_name, record_id, action, changed_by, changed_at')
    .order('changed_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}
