'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Rss,
  Star,
  ExternalLink,
  RefreshCw,
  Loader2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Filter,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';
import { createClient } from '@/lib/supabase/client';
import {
  fetchFeeds,
  fetchArticles,
  markArticlesRead,
  markAllArticlesRead,
  toggleArticleStar,
  type RssFeed,
  type RssArticle,
} from '@/lib/supabase/rssQueries';

type ArticleFilter = 'all' | 'unread' | 'starred';

function feedStatusIcon(feed: RssFeed) {
  if (feed.last_error) return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (!feed.last_synced) return <Clock className="h-3.5 w-3.5 text-slate-500" />;
  const age = Date.now() - new Date(feed.last_synced).getTime();
  if (age > 12 * 60 * 60 * 1000) return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
}

function timeAgo(date: string | null, r: Record<string, string>): string {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return r.today;
  if (mins < 60) return `${mins} ${r.minutes} ${r.ago}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${r.hours} ${r.ago}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return r.yesterday;
  return `${days} ${r.days} ${r.ago}`;
}

const supabase = createClient();

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export default function FeedsPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const r = t.rss as Record<string, string>;
  const isRtl = language === 'he';

  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<ArticleFilter>('all');
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null);

  // Add feed form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [feedData, articleData] = await Promise.all([
        fetchFeeds(),
        fetchArticles({
          feedId: selectedFeed || undefined,
          isRead: filter === 'unread' ? false : undefined,
          isStarred: filter === 'starred' ? true : undefined,
          limit: 50,
        }),
      ]);
      setFeeds(feedData);
      setArticles(articleData.articles);
      setTotal(articleData.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter, selectedFeed]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSync = async () => {
    if (syncing) return;
    const token = await getToken();
    if (!token) return;
    setSyncing(true);
    try {
      await fetch('/api/rss/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadData();
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    await markArticlesRead([id]);
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  };

  const handleMarkAllRead = async () => {
    await markAllArticlesRead();
    setArticles((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const handleToggleStar = async (id: number, current: boolean) => {
    await toggleArticleStar(id, !current);
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, is_starred: !current } : a));
  };

  const handleAddFeed = async () => {
    if (!newUrl.trim() || !newTitle.trim()) return;
    const token = await getToken();
    if (!token) return;
    setAdding(true);
    try {
      const res = await fetch('/api/rss/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: newUrl.trim(),
          title: newTitle.trim(),
          keywords: newKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setNewUrl('');
        setNewTitle('');
        setNewKeywords('');
        setShowAddForm(false);
        await loadData();
      }
    } catch {
      // silent
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFeedActive = async (feed: RssFeed) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/rss/feeds/${feed.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: !feed.is_active }),
    });
    await loadData();
  };

  const handleDeleteFeed = async (feed: RssFeed) => {
    if (feed.is_default) return;
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/rss/feeds/${feed.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (selectedFeed === feed.id) setSelectedFeed(null);
    await loadData();
  };

  const filterTabs: { id: ArticleFilter; label: string }[] = [
    { id: 'all', label: r.allArticles },
    { id: 'unread', label: r.unread },
    { id: 'starred', label: r.starred },
  ];

  const unreadCount = articles.filter((a) => !a.is_read).length;

  return (
    <div className="min-h-screen" dir={isRtl ? 'rtl' : 'ltr'} data-cc-id="feeds.page">
      <PageHeader pageKey="feeds" />

      <div className="mt-6 flex gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* ── Articles (2/3) ────────────────── */}
        <div className="flex-[2] min-w-0 space-y-4">
          {/* Filter tabs + actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg bg-slate-800/50 p-0.5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === tab.id
                      ? 'bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'unread' && unreadCount > 0 && (
                    <span className="ms-1.5 rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-400">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
                >
                  <Eye className="h-3 w-3" />
                  {r.markAllRead}
                </button>
              )}
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200 disabled:opacity-50"
              >
                {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {syncing ? r.syncing : r.syncNow}
              </button>
            </div>
          </div>

          {/* Article list */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <Rss className="h-8 w-8 text-slate-700" />
              <p className="text-sm">{r.noArticles}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`group rounded-xl border transition-colors ${
                    article.is_read
                      ? 'border-white/[0.04] bg-white/[0.01]'
                      : 'border-white/[0.08] bg-white/[0.03]'
                  } hover:bg-white/[0.05]`}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Star */}
                    <button
                      type="button"
                      onClick={() => handleToggleStar(article.id, article.is_starred)}
                      className={`mt-0.5 shrink-0 transition-colors ${
                        article.is_starred ? 'text-amber-400' : 'text-slate-700 hover:text-amber-400'
                      }`}
                    >
                      <Star className="h-4 w-4" fill={article.is_starred ? 'currentColor' : 'none'} />
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-sm leading-snug ${
                            article.is_read ? 'text-slate-400' : 'text-slate-100 font-medium'
                          }`}
                        >
                          {article.title}
                        </h3>
                        <div className="flex shrink-0 items-center gap-2">
                          {!article.is_read && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(article.id)}
                              className="rounded p-1 text-slate-600 opacity-0 transition-all hover:bg-white/[0.05] hover:text-slate-300 group-hover:opacity-100"
                              title={r.markRead}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {article.link && (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-slate-600 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
                              title={r.openArticle}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Description snippet */}
                      {article.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {article.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {/* Source badge */}
                        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                          {article.rss_feeds?.title || 'RSS'}
                        </span>

                        {/* Date */}
                        {article.pub_date && (
                          <span className="text-[10px] text-slate-600">
                            {timeAgo(article.pub_date, r)}
                          </span>
                        )}

                        {/* Matched keywords */}
                        {article.matched_keywords.length > 0 &&
                          article.matched_keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400"
                            >
                              {kw}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {total > articles.length && (
                <p className="py-2 text-center text-xs text-slate-600">
                  {articles.length} / {total}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Feed Management Sidebar (1/3) ──── */}
        <div className="w-80 shrink-0 space-y-4">
          {/* Filter by feed */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-300">
              <Filter className="h-3.5 w-3.5" />
              {r.filterByFeed}
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedFeed(null)}
                className={`w-full rounded-lg px-3 py-1.5 text-start text-xs transition-colors ${
                  !selectedFeed
                    ? 'bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                {r.filterAll}
              </button>
              {feeds.filter((f) => f.is_active).map((feed) => (
                <button
                  key={feed.id}
                  type="button"
                  onClick={() => setSelectedFeed(feed.id)}
                  className={`w-full rounded-lg px-3 py-1.5 text-start text-xs transition-colors truncate ${
                    selectedFeed === feed.id
                      ? 'bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  {feed.title}
                </button>
              ))}
            </div>
          </div>

          {/* Feed list with status */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-300">{r.feeds}</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded p-1 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add feed form */}
            {showAddForm && (
              <div className="mb-3 space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder={r.feedUrl}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none"
                />
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={r.feedTitle}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none"
                />
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder={r.keywordsPlaceholder}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFeed}
                  disabled={adding || !newUrl.trim() || !newTitle.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-50"
                >
                  {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {r.addFeed}
                </button>
              </div>
            )}

            <div className="space-y-1">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
                >
                  {feedStatusIcon(feed)}
                  <span className={`flex-1 truncate text-xs ${feed.is_active ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                    {feed.title}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleToggleFeedActive(feed)}
                      className="rounded p-1 text-slate-600 hover:text-slate-300"
                      title={feed.is_active ? 'Disable' : 'Enable'}
                    >
                      {feed.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    {!feed.is_default && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFeed(feed)}
                        className="rounded p-1 text-slate-600 hover:text-red-400"
                        title={r.removeFeed}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-700">
                    {feed.is_default ? r.defaultFeed : r.customFeed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
