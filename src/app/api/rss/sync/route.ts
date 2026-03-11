import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10_000 });

/**
 * POST /api/rss/sync
 * Auth: JWT (manual trigger) or CRON_SECRET header (Vercel Cron)
 * Fetches all active RSS feeds, filters by keywords, upserts articles.
 */
export async function POST(request: Request) {
  // Auth: either JWT or CRON_SECRET
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  const isVercelCron = process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

  if (!isVercelCron) {
    const { error: authError } = await requireAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }
  }

  const supabase = createServiceClient();

  // Fetch all active feeds
  const { data: feeds, error: feedsError } = await supabase
    .from('rss_feeds')
    .select('*')
    .eq('is_active', true);

  if (feedsError) {
    return NextResponse.json({ error: feedsError.message }, { status: 500 });
  }

  if (!feeds || feeds.length === 0) {
    return NextResponse.json({ success: true, synced: 0, message: 'No active feeds' });
  }

  let totalNew = 0;
  const feedResults: Array<{ feed_id: number; title: string; new_articles: number; error?: string }> = [];

  for (const feed of feeds) {
    try {
      const rss = await parser.parseURL(feed.url);
      const items = rss.items || [];
      const feedKeywords: string[] = feed.keywords || [];

      // Filter by keywords if feed has them
      const filtered = feedKeywords.length > 0
        ? items.filter((item) => {
            const text = `${item.title || ''} ${item.contentSnippet || item.content || ''}`.toLowerCase();
            return feedKeywords.some((kw) => text.includes(kw.toLowerCase()));
          })
        : items;

      // Prepare articles for upsert
      const articles = filtered.map((item) => {
        const text = `${item.title || ''} ${item.contentSnippet || item.content || ''}`.toLowerCase();
        const matchedKeywords = feedKeywords.filter((kw) => text.includes(kw.toLowerCase()));
        return {
          feed_id: feed.id,
          guid: item.guid || item.link || item.title || `${feed.id}-${Date.now()}`,
          title: (item.title || '').slice(0, 500),
          link: item.link || null,
          description: (item.contentSnippet || item.content || '').slice(0, 2000),
          pub_date: item.isoDate || item.pubDate || null,
          categories: item.categories || [],
          matched_keywords: matchedKeywords,
        };
      });

      if (articles.length > 0) {
        const { data: inserted } = await supabase
          .from('rss_articles')
          .upsert(articles, { onConflict: 'feed_id,guid', ignoreDuplicates: true })
          .select('id');

        const newCount = inserted?.length || 0;
        totalNew += newCount;
        feedResults.push({ feed_id: feed.id, title: feed.title, new_articles: newCount });
      } else {
        feedResults.push({ feed_id: feed.id, title: feed.title, new_articles: 0 });
      }

      // Update last_synced
      await supabase
        .from('rss_feeds')
        .update({ last_synced: new Date().toISOString(), last_error: null })
        .eq('id', feed.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      feedResults.push({ feed_id: feed.id, title: feed.title, new_articles: 0, error: errorMsg });

      await supabase
        .from('rss_feeds')
        .update({ last_error: errorMsg })
        .eq('id', feed.id);
    }
  }

  // Record in automation_runs
  await supabase
    .from('automation_runs')
    .insert({
      job_name: 'rss-sync',
      status: 'success',
      result: { total_new: totalNew, feeds: feedResults },
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: 0,
    });

  return NextResponse.json({
    success: true,
    synced: totalNew,
    feeds: feedResults,
  });
}
