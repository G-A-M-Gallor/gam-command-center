"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ExternalLink,
  Check,
  Copy,
  Info,
  Sparkles,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui";
import {
  libraryRegistry,
  INSTALLED_COMPONENTS,
  SOURCE_COLORS,
  LIBRARY_CATEGORY_COLORS,
  LIBRARY_CATEGORY_LABELS,
  type LibrarySource,
  type LibraryCategory,
  type LibraryComponentEntry,
} from "./libraryRegistry";

// ─── Types ───────────────────────────────────────────────────────────

interface LibraryTabProps {
  isRtl: boolean;
  language: "he" | "en" | "ru";
  td: Record<string, string>;
}

// ─── Source tab config ───────────────────────────────────────────────

const SOURCE_TABS: { id: LibrarySource | "all"; labelKey: string }[] = [
  { id: "all", labelKey: "libraryAll" },
  { id: "shadcn", labelKey: "libraryShadcn" },
  { id: "magicui", labelKey: "libraryMagicUi" },
  { id: "21st", labelKey: "library21st" },
];

// ─── Component ───────────────────────────────────────────────────────

export function LibraryTab({ language, td }: LibraryTabProps) {
  const langKey = language === "he" ? "he" as const : "en" as const;
  const [activeSource, setActiveSource] = useState<LibrarySource | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | "all">("all");
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<LibraryComponentEntry | null>(null);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(INSTALLED_COMPONENTS);

  // Fetch real installed components on mount
  useEffect(() => {
    fetch("/api/installed-components")
      .then((r) => r.json())
      .then((data: { slugs: string[] }) => {
        if (data.slugs.length > 0) {
          // Build set of "shadcn-{slug}" IDs from filesystem slugs
          const realInstalled = new Set<string>();
          for (const slug of data.slugs) {
            realInstalled.add(`shadcn-${slug}`);
          }
          setInstalledSlugs(realInstalled);
        }
      })
      .catch(() => {/* keep fallback */});
  }, []);

  // Count per source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: libraryRegistry.length };
    for (const c of libraryRegistry) {
      counts[c.source] = (counts[c.source] || 0) + 1;
    }
    return counts;
  }, []);

  // Filter entries
  const filtered = useMemo(() => {
    let items = libraryRegistry;

    if (activeSource !== "all") {
      items = items.filter((c) => c.source === activeSource);
    }
    if (selectedCategory !== "all") {
      items = items.filter((c) => c.category === selectedCategory);
    }
    if (showInstalledOnly) {
      items = items.filter((c) => installedSlugs.has(c.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.he.includes(q) ||
          c.description.en.toLowerCase().includes(q) ||
          c.slug.includes(q) ||
          c.tags.some((t) => t.includes(q))
      );
    }
    return items;
  }, [activeSource, selectedCategory, showInstalledOnly, searchQuery, installedSlugs]);

  // Available categories for current source filter
  const availableCategories = useMemo(() => {
    let items = libraryRegistry;
    if (activeSource !== "all") {
      items = items.filter((c) => c.source === activeSource);
    }
    const cats = new Map<LibraryCategory, number>();
    for (const c of items) {
      cats.set(c.category, (cats.get(c.category) || 0) + 1);
    }
    return cats;
  }, [activeSource]);

  // Copy install command
  const handleCopy = useCallback((entry: LibraryComponentEntry) => {
    navigator.clipboard.writeText(entry.installCmd).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  // Open AI panel with install command pre-filled
  const handleInstallViaAI = useCallback((entry: LibraryComponentEntry) => {
    const message = langKey === "he"
      ? `התקן את הקומפוננטה ${entry.name}: ${entry.installCmd}`
      : `Install ${entry.name} component: ${entry.installCmd}`;
    window.dispatchEvent(new CustomEvent("cc-open-ai"));
    // Small delay to let the panel open first
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("cc-ai-prefill", { detail: { message } })
      );
    }, 150);
  }, [langKey]);

  // Close preview on Escape
  useEffect(() => {
    if (!previewEntry) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewEntry(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewEntry]);

  const installedCount = useMemo(
    () => libraryRegistry.filter((c) => installedSlugs.has(c.id)).length,
    [installedSlugs]
  );

  return (
    <div className="space-y-4">
      {/* Source sub-tabs + sync info */}
      <div className="flex flex-wrap items-center gap-2">
        {SOURCE_TABS.map((tab) => {
          const count = sourceCounts[tab.id] || 0;
          const isActive = activeSource === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSource(tab.id);
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.id !== "all" && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[tab.id as LibrarySource].color }}
                />
              )}
              {td[tab.labelKey]}
              <span
                className={`rounded-full px-1.5 py-px text-[10px] ${
                  isActive
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-slate-700/40 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Installed count + Sync hint */}
        <div className="ms-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-emerald-400/70">
            <Check size={11} />
            {installedCount} {td.libraryInstalledBadge}
          </span>
          <button
            onClick={() => {
              const msg = langKey === "he"
                ? "רענן את קטלוג הקומפוננטות — בדוק מה זמין ב-shadcn/ui ו-Magic UI דרך ה-MCP tools"
                : "Refresh the component catalog — check what's available in shadcn/ui and Magic UI via MCP tools";
              window.dispatchEvent(new CustomEvent("cc-open-ai"));
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("cc-ai-prefill", { detail: { message: msg } })
                );
              }, 150);
            }}
            className="flex items-center gap-1 rounded-md bg-slate-800/60 px-2 py-1 text-[11px] text-slate-500 transition-colors hover:text-slate-300"
            title={td.libraryRefreshTitle}
          >
            <RefreshCw size={11} />
            {td.librarySync}
          </button>
        </div>
      </div>

      {/* Search + installed toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={td.librarySearch}
            iconStart={<Search size={14} />}
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-400 transition-colors hover:text-slate-300">
          <input
            type="checkbox"
            checked={showInstalledOnly}
            onChange={(e) => setShowInstalledOnly(e.target.checked)}
            className="accent-emerald-500"
          />
          {td.libraryInstalled}
        </label>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-purple-500/20 text-purple-300"
              : "bg-slate-800 text-slate-500 hover:text-slate-400"
          }`}
        >
          {td.libraryAll} ({filtered.length})
        </button>
        {Array.from(availableCategories.entries()).map(([cat, count]) => {
          const cc = LIBRARY_CATEGORY_COLORS[cat];
          const label = LIBRARY_CATEGORY_LABELS[cat][langKey];
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-slate-800 text-slate-500 hover:text-slate-400"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: cc.color }}
              />
              {label}
              <span className="text-[10px] text-slate-600">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 21st.dev note */}
      {activeSource === "21st" && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300/80">
          <Info size={14} className="mt-0.5 shrink-0" />
          {td.library21stNote}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-800/20">
          <p className="text-sm text-slate-500">{td.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => {
            const isInstalled = installedSlugs.has(entry.id);
            const sc = SOURCE_COLORS[entry.source];
            const cc = LIBRARY_CATEGORY_COLORS[entry.category];
            const desc = entry.description[langKey];
            const catLabel = LIBRARY_CATEGORY_LABELS[entry.category][langKey];
            const isCopied = copiedId === entry.id;

            return (
              <div
                key={entry.id}
                className="flex flex-col rounded-xl border border-slate-700/40 bg-slate-800/25 p-4 transition-colors hover:border-slate-600/50 hover:bg-slate-800/40"
              >
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-slate-100">{entry.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className="rounded-full px-1.5 py-px text-[10px] font-medium"
                        style={{ color: sc.color, backgroundColor: sc.bg }}
                      >
                        {entry.source === "shadcn" ? "shadcn/ui" : entry.source === "magicui" ? "Magic UI" : "21st.dev"}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-px text-[10px] font-medium"
                        style={{ color: cc.color, backgroundColor: cc.bg }}
                      >
                        {catLabel}
                      </span>
                    </div>
                  </div>
                  {isInstalled && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <Check size={10} />
                      {td.libraryInstalledBadge}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mb-3 flex-1 text-[12px] leading-relaxed text-slate-500">
                  {desc}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 border-t border-slate-700/30 pt-3">
                  {/* Install via AI */}
                  <button
                    onClick={() => handleInstallViaAI(entry)}
                    className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-1 text-[11px] font-medium text-purple-300 transition-colors hover:bg-purple-500/20"
                    title={entry.installCmd}
                  >
                    <Sparkles size={11} />
                    {td.libraryInstall}
                  </button>

                  {/* Copy command */}
                  <button
                    onClick={() => handleCopy(entry)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      isCopied
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-700/30 text-slate-400 hover:text-slate-200"
                    }`}
                    title={entry.installCmd}
                  >
                    {isCopied ? <Check size={11} /> : <Copy size={11} />}
                    {isCopied ? td.libraryCopied : td.libraryUse}
                  </button>

                  {/* Preview */}
                  <button
                    onClick={() => setPreviewEntry(entry)}
                    className="flex items-center gap-1 rounded-md bg-slate-700/30 px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-200"
                  >
                    <Eye size={11} />
                    {td.libraryPreview}
                  </button>

                  {/* Docs */}
                  <a
                    href={entry.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-500 transition-colors hover:text-slate-300"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewEntry && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewEntry(null)}
        >
          <div
            className="relative flex h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-700/40 px-5 py-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-slate-100">
                  {previewEntry.name}
                </h3>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: SOURCE_COLORS[previewEntry.source].color,
                    backgroundColor: SOURCE_COLORS[previewEntry.source].bg,
                  }}
                >
                  {previewEntry.source === "shadcn" ? "shadcn/ui" : previewEntry.source === "magicui" ? "Magic UI" : "21st.dev"}
                </span>
                {installedSlugs.has(previewEntry.id) && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    <Check size={10} />
                    {td.libraryInstalledBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleInstallViaAI(previewEntry)}
                  className="flex items-center gap-1.5 rounded-md bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/25"
                >
                  <Sparkles size={12} />
                  {td.libraryInstall}
                </button>
                <a
                  href={previewEntry.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white"
                >
                  <ExternalLink size={12} />
                  {td.libraryDocs}
                </a>
                <button
                  onClick={() => setPreviewEntry(null)}
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Install command bar */}
            <div className="flex items-center gap-2 border-b border-slate-700/30 bg-slate-800/40 px-5 py-2">
              <code className="flex-1 font-mono text-xs text-slate-400">
                {previewEntry.installCmd}
              </code>
              <button
                onClick={() => handleCopy(previewEntry)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  copiedId === previewEntry.id
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-700/50 text-slate-400 hover:text-slate-200"
                }`}
              >
                {copiedId === previewEntry.id ? <Check size={10} /> : <Copy size={10} />}
                {copiedId === previewEntry.id ? td.libraryCopied : td.libraryUse}
              </button>
            </div>

            {/* Docs iframe */}
            <iframe
              src={previewEntry.docsUrl}
              title={`${previewEntry.name} docs`}
              className="flex-1 border-0 bg-white"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
