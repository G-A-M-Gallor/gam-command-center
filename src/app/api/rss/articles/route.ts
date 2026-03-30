import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/rss/articles — paginated article list
 * Query params: feed_id, is_read, is_starred, limit, offset
 */
export async function GET(_request: Request) {
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const url = new URL(_request.url);
  const feedId = url.searchParams.get('feed_id');
  const isRead = url.searchParams.get('is_read');
  const isStarred = url.searchParams.get('is_starred');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const supabase = createServiceClient();
  let query = supabase
    .from('rss_articles')
    .select('*, rss_feeds!inner(title, url)', { count: 'exact' })
    .order('pub_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (feedId) query = query.eq('feed_id', parseInt(feedId, 10));
  if (isRead === 'true') query = query.eq('is_read', true);
  if (isRead === 'false') query = query.eq('is_read', false);
  if (isStarred === 'true') query = query.eq('is_starred', true);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data, total: count });
}

/**
 * PATCH /api/rss/articles — mark articles read/starred
 * Body: { ids: number[], is_read?: boolean, is_starred?: boolean }
 */
export async function PATCH(_request: Request) {
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  let body: { ids?: number[]; is_read?: boolean; is_starred?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  if (body.ids.length > 200) {
    return NextResponse.json({ error: 'Maximum 200 ids per _request' }, { status: 400 });
  }

  const updates: Record<string, boolean> = {};
  if (typeof body.is_read === 'boolean') updates.is_read = body.is_read;
  if (typeof body.is_starred === 'boolean') updates.is_starred = body.is_starred;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Provide is_read or is_starred' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('rss_articles')
    .update(updates)
    .in('id', body.ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
