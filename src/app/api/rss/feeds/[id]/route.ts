import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { rssFeedUpdateSchema } from '@/lib/api/schemas';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/rss/feeds/[id] — update feed
 */
export async function PATCH(_request: Request, _context: RouteContext) {
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const { id } = await context.params;
  const feedId = parseInt(id, 10);
  if (isNaN(feedId)) {
    return NextResponse.json({ error: 'Invalid feed id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = rssFeedUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid _request' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('rss_feeds')
    .update(parsed.data)
    .eq('id', feedId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feed: data });
}

/**
 * DELETE /api/rss/feeds/[id] — remove non-default feed
 */
export async function DELETE(_request: Request, _context: RouteContext) {
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const { id } = await context.params;
  const feedId = parseInt(id, 10);
  if (isNaN(feedId)) {
    return NextResponse.json({ error: 'Invalid feed id' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check if default
  const { data: feed } = await supabase
    .from('rss_feeds')
    .select('is_default')
    .eq('id', feedId)
    .single();

  if (feed?.is_default) {
    return NextResponse.json({ error: 'Cannot delete default feeds' }, { status: 403 });
  }

  const { error } = await supabase
    .from('rss_feeds')
    .delete()
    .eq('id', feedId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
