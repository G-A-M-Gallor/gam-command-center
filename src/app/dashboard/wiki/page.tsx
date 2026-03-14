"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, BookOpen, Tag } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import { timeAgo } from "@/lib/utils/timeAgo";

interface WikiEntry {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  qa_pairs: { q: string; a: string }[] | null;
  created_at: string;
  updated_at: string | null;
}

const WIKI_CATEGORIES = ["sales", "ops", "tech", "people", "products"] as const;

export default function WikiPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === "he";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wikiT = t.wiki as any;
  const tw = wikiT as Record<string, string>;
  const catLabels = wikiT.categories as Record<string, string>;

  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wiki_entries")
        .select("*")
        .order("updated_at", { ascending: false, nullsFirst: false });
      setEntries(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (categoryFilter) {
      result = result.filter((e) => e.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.qa_pairs?.some(
            (p) => p.q.toLowerCase().includes(q) || p.a.toLowerCase().includes(q)
          )
      );
    }
    return result;
  }, [entries, search, categoryFilter]);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6 p-6">
      <PageHeader pageKey="wiki" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tw.search}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 ps-9 pe-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-[var(--cc-accent-500)]/40 focus:ring-1 focus:ring-[var(--cc-accent-500)]/20"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[var(--cc-accent-500)]/40"
        >
          <option value="">{tw.allCategories}</option>
          {WIKI_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {catLabels[cat]}
            </option>
          ))}
        </select>

        {/* New entry */}
        <Link
          href="/dashboard/wiki/new"
          className="flex items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)]"
        >
          <Plus className="h-4 w-4" />
          {tw.newEntry}
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--cc-accent-400)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg font-medium">
            {search || categoryFilter ? tw.noResults : tw.noEntries}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {search || categoryFilter ? tw.tryDifferentSearch : tw.noEntriesDesc}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <Link
              key={entry.id}
              href={`/dashboard/wiki/${entry.id}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-[var(--cc-accent-500)]/30 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-slate-200 group-hover:text-[var(--cc-accent-300)] transition-colors line-clamp-1">
                  {entry.title}
                </h3>
                {entry.category && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--cc-accent-600)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--cc-accent-400)]">
                    <Tag className="h-2.5 w-2.5" />
                    {catLabels[entry.category] ?? entry.category}
                  </span>
                )}
              </div>

              {entry.description && (
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                  {entry.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {entry.qa_pairs?.length ?? 0} Q&A
                </span>
                <span>
                  {timeAgo(new Date(entry.updated_at || entry.created_at).getTime(), language)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
