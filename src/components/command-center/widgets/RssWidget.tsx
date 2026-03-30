'use client';

import { useState, useEffect, useCallback } from 'react';
import { Rss, _ExternalLink, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import { fetchArticles, markAllArticlesRead, fetchUnreadCount, type RssArticle } from '@/lib/supabase/rssQueries';
import type { WidgetSize } from './WidgetRegistry';

function timeAgo(date: string | null): string {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function RssPanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const r = t.rss as Record<string, string>;
  const _router = useRouter();

  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchArticles({ isRead: false, limit: 8 });
      setArticles(data.articles);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    await markAllArticlesRead();
    setArticles([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-72 p-3" data-cc-id="widget.rss.panel">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-300">{r.title}</h3>
        {articles.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
          >
            <Eye className="h-3 w-3" />
            {r.markAllRead}
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-600">{r.noArticles}</p>
      ) : (
        <div className="space-y-1">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
            >
              <Rss className="mt-0.5 h-3 w-3 shrink-0 text-orange-400/60" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-slate-300 group-hover:text-slate-100">
                  {article.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <span>{article.rss_feeds?.title}</span>
                  {article.pub_date && <span>· {timeAgo(article.pub_date)}</span>}
                </div>
              </div>
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-700 opacity-0 group-hover:opacity-100" />
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/dashboard/feeds')}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-1.5 text-[11px] text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
      >
        {r.viewAll} →
      </button>
    </div>
  );
}

export function RssBarContent({ size }: { size: WidgetSize }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchUnreadCount().then(setUnread).catch(() => { /* no-op */ });
    const interval = setInterval(() => {
      fetchUnreadCount().then(setUnread).catch(() => { /* no-op */ });
    }, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Rss className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -end-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>
      {size >= 2 && (
        <span className="text-xs text-slate-400">RSS</span>
      )}
    </div>
  );
}
