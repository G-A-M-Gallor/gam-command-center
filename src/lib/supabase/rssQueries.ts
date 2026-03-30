import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ─── Types ────────────────────────────────────────────────────

export interface RssFeed {
  id: number;
  url: string;
  title: string;
  is_default: boolean;
  is_active: boolean;
  keywords: string[];
  last_synced: string | null;
  last_error: string | null;
  created_at: string;
}

export interface RssArticle {
  id: number;
  feed_id: number;
  guid: string;
  title: string;
  link: string | null;
  description: string | null;
  pub_date: string | null;
  categories: string[];
  matched_keywords: string[];
  is_read: boolean;
  is_starred: boolean;
  created_at: string;
  rss_feeds?: { title: string; url: string };
}

// ─── Feed Queries ─────────────────────────────────────────────

export async function fetchFeeds(): Promise<RssFeed[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from("rss_feeds")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return (data as RssFeed[]) || [];
}

// ─── Article Queries ──────────────────────────────────────────

export async function fetchArticles(opts?: {
  feedId?: number;
  isRead?: boolean;
  isStarred?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ articles: RssArticle[]; total: number }> {
  const supabase = getClient();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("rss_articles")
    .select("*, rss_feeds!inner(title, url)", { count: "exact" })
    .order("pub_date", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (opts?.feedId) query = query.eq("feed_id", opts.feedId);
  if (typeof opts?.isRead === "boolean") query = query.eq("is_read", opts.isRead);
  if (opts?.isStarred) query = query.eq("is_starred", true);

  const { data, count } = await query;
  return { articles: (data as RssArticle[]) || [], total: count || 0 };
}

export async function fetchUnreadCount(): Promise<number> {
  const supabase = getClient();
  const { count } = await supabase
    .from("rss_articles")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  return count || 0;
}

// ─── Mutations ────────────────────────────────────────────────

export async function markArticlesRead(ids: number[]): Promise<void> {
  const supabase = getClient();
  await supabase
    .from("rss_articles")
    .update({ is_read: true })
    .in("id", ids);
}

export async function markAllArticlesRead(): Promise<void> {
  const supabase = getClient();
  await supabase
    .from("rss_articles")
    .update({ is_read: true })
    .eq("is_read", false);
}

export async function toggleArticleStar(id: number, starred: boolean): Promise<void> {
  const supabase = getClient();
  await supabase
    .from("rss_articles")
    .update({ is_starred: starred })
    .eq("id", id);
}
