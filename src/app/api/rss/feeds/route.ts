import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { rssFeedCreateSchema } from '@/lib/api/schemas';

/**
 * GET /api/rss/feeds — list all feeds
 */
export async function GET(_request: Request) {
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('rss_feeds')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feeds: data });
}

/**
 * POST /api/rss/feeds — add a custom feed
 */
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

  const parsed = rssFeedCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid _request' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('rss_feeds')
    .insert({
      url: parsed.data.url,
      title: parsed.data.title,
      keywords: parsed.data.keywords,
      is_default: false,
      created_by: _user!.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Feed URL already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feed: data }, { status: 201 });
}
