"use client";

import { useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface Props {
  query: string;
  onChange: (q: string) => void;
  language: "he" | "en" | "ru";
  resultCount: number;
}

const FILTERS = [
  { key: "all", he: "הכל", en: "All", ru: "Все" },
  { key: "page", he: "דפים", en: "Pages", ru: "Страницы" },
  { key: "widget", he: "ווידג׳טים", en: "Widgets", ru: "Виджеты" },
  { key: "active", he: "פעילים", en: "Active", ru: "Активные" },
];

export function AppLauncherSearch({ query, onChange, language, resultCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Cmd+K / Ctrl+K focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && query) {
        onChange("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [query, onChange]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={language === "he" ? "חפש אפליקציה, ווידג׳ט או דף..." : "Search apps, widgets or pages..."}
          dir="auto"
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-12 pr-24 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-purple-500/20 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-lg p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg p-1.5 transition-colors ${showFilters ? "bg-purple-500/20 text-purple-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <kbd className="hidden sm:flex items-center rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Filter pills */}
      {showFilters && (
        <div className="mt-2 flex items-center gap-2 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            >
              {f[language]}
            </button>
          ))}
        </div>
      )}

      {/* Result count when searching */}
      {query && (
        <p className="mt-2 px-1 text-xs text-slate-500">
          {resultCount} {language === "he" ? "תוצאות" : "results"}
        </p>
      )}
    </div>
  );
}
