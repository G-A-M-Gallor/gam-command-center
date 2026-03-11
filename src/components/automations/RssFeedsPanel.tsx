'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Rss,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchFeeds, fetchArticles, type RssFeed, type RssArticle } from '@/lib/supabase/rssQueries';

const supabase = createClient();

interface RssFeedsPanelProps {
  t: Record<string, string>;
  rssT: Record<string, string>;
}

function feedStatusIcon(feed: RssFeed) {
  if (feed.last_error) return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (!feed.last_synced) return <Clock className="h-3.5 w-3.5 text-slate-500" />;
  const age = Date.now() - new Date(feed.last_synced).getTime();
  if (age > 12 * 60 * 60 * 1000) return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
}

function timeAgo(date: string | null): string {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function RssFeedsPanel({ t, rssT }: RssFeedsPanelProps) {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [feedData, articleData] = await Promise.all([
        fetchFeeds(),
        fetchArticles({ limit: 5, isRead: false }),
      ]);
      setFeeds(feedData);
      setArticles(articleData.articles);
      setUnreadCount(articleData.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/rss/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      await load();
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const activeFeeds = feeds.filter((f) => f.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: rssT.activeFeeds, value: activeFeeds.length, color: 'text-emerald-400' },
          { label: rssT.totalArticles, value: feeds.reduce(() => 0, 0) || '—', color: 'text-blue-400' },
          { label: rssT.unreadCount, value: unreadCount, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sync button */}
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.05] disabled:opacity-50"
      >
        {syncing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {syncing ? rssT.syncing : rssT.syncNow}
      </button>

      {/* Feed list */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-slate-400">{rssT.feeds}</h4>
        <div className="space-y-1">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2"
            >
              {feedStatusIcon(feed)}
              <span className="flex-1 truncate text-xs text-slate-300">{feed.title}</span>
              <span className="text-[10px] text-slate-600">
                {feed.last_synced ? timeAgo(feed.last_synced) : rssT.never}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest headlines */}
      {articles.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-slate-400">{rssT.articles}</h4>
          <div className="space-y-1">
            {articles.slice(0, 5).map((article) => (
              <a
                key={article.id}
                href={article.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <Rss className="mt-0.5 h-3 w-3 shrink-0 text-orange-400/60" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-slate-300 group-hover:text-slate-100">
                    {article.title}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <span>{article.rss_feeds?.title}</span>
                    {article.pub_date && <span>{timeAgo(article.pub_date)}</span>}
                  </div>
                </div>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-600 opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      )}

      {articles.length === 0 && (
        <p className="py-4 text-center text-xs text-slate-600">{rssT.noArticles}</p>
      )}
    </div>
  );
}
