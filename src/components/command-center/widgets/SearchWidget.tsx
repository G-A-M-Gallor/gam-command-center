"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  FileText,
  Bot,
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import type { WidgetSize } from "./WidgetRegistry";

const RECENT_PAGES_KEY = "cc-recent-pages";
const RECENT_SEARCHES_KEY = "cc-recent-searches";
const MAX_RECENT = 5;

interface RecentPage {
  href: string;
  label: string;
  timestamp: number;
}

// Mock data for search results
const mockProjects = [
  { id: "1", name: { he: "פלטפורמת vBrain.io", en: "vBrain.io Platform" }, type: "project" },
  { id: "2", name: { he: "מרכז הפיקוד GAM", en: "GAM Command Center" }, type: "project" },
  { id: "3", name: { he: "פורטל לקוח - ABC בניין", en: "Client Portal - ABC Construction" }, type: "project" },
  { id: "4", name: { he: "צינור סנכרון Origami", en: "Origami Sync Pipeline" }, type: "project" },
  { id: "5", name: { he: "אינטגרציית WATI", en: "WATI Integration" }, type: "project" },
];

const mockDocuments = [
  { id: "d1", name: { he: "מסמך אפיון - vBrain", en: "Spec Document - vBrain" }, type: "document" },
  { id: "d2", name: { he: "פרוטוקול ישיבה 12/02", en: "Meeting Notes 12/02" }, type: "document" },
  { id: "d3", name: { he: "תהליך עבודה - סנכרון", en: "Workflow - Sync" }, type: "document" },
];

const mockConversations = [
  { id: "c1", name: { he: "ניתוח ארכיטקטורה", en: "Architecture Analysis" }, type: "conversation" },
  { id: "c2", name: { he: "כתיבת אפיון טכני", en: "Technical Spec Writing" }, type: "conversation" },
];

interface SearchItem {
  id: string;
  label: string;
  type: "page" | "project" | "document" | "conversation" | "action";
  href?: string;
  icon: typeof Search;
}

function getRecentPages(): RecentPage[] {
  try {
    const raw = localStorage.getItem(RECENT_PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const searches = getRecentSearches();
  const filtered = searches.filter((s) => s !== term);
  const updated = [term, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

// Tab route icons for recent pages
const routeIcons: Record<string, typeof Search> = {
  "/dashboard/layers": Layers,
  "/dashboard/editor": FileText,
  "/dashboard/story-map": Layers,
  "/dashboard/functional-map": Layers,
  "/dashboard/ai-hub": Bot,
  "/dashboard/design-system": Layers,
  "/dashboard/formily": Layers,
  "/dashboard/architecture": Layers,
  "/dashboard/plan": Layers,
};

interface SearchPanelProps {
  onClose: () => void;
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build items list
  const items = useMemo((): SearchItem[] => {
    if (!query.trim()) {
      // Empty state: recent pages + recent searches
      const recentPages = getRecentPages().slice(0, MAX_RECENT);
      const recentSearches = getRecentSearches().slice(0, MAX_RECENT);

      const pageItems: SearchItem[] = recentPages.map((p) => ({
        id: `page-${p.href}`,
        label: p.label,
        type: "page" as const,
        href: p.href,
        icon: routeIcons[p.href] || Layers,
      }));

      const searchItems: SearchItem[] = recentSearches.map((s, i) => ({
        id: `search-${i}`,
        label: s,
        type: "page" as const,
        icon: Clock,
      }));

      return [...pageItems, ...searchItems];
    }

    // Search state: filter mock data + quick actions
    const q = query.toLowerCase();
    const lang = language;

    const projects: SearchItem[] = mockProjects
      .filter(
        (p) =>
          p.name[lang].toLowerCase().includes(q) ||
          p.name.he.toLowerCase().includes(q) ||
          p.name.en.toLowerCase().includes(q)
      )
      .map((p) => ({
        id: p.id,
        label: p.name[lang],
        type: "project" as const,
        icon: Layers,
      }));

    const documents: SearchItem[] = mockDocuments
      .filter(
        (d) =>
          d.name[lang].toLowerCase().includes(q) ||
          d.name.he.toLowerCase().includes(q) ||
          d.name.en.toLowerCase().includes(q)
      )
      .map((d) => ({
        id: d.id,
        label: d.name[lang],
        type: "document" as const,
        icon: FileText,
      }));

    const conversations: SearchItem[] = mockConversations
      .filter(
        (c) =>
          c.name[lang].toLowerCase().includes(q) ||
          c.name.he.toLowerCase().includes(q) ||
          c.name.en.toLowerCase().includes(q)
      )
      .map((c) => ({
        id: c.id,
        label: c.name[lang],
        type: "conversation" as const,
        icon: Bot,
      }));

    const actions: SearchItem[] = [
      { id: "action-project", label: t.widgets.newProject, type: "action" as const, icon: Plus },
      { id: "action-document", label: t.widgets.newDocument, type: "action" as const, icon: Plus },
      { id: "action-task", label: t.widgets.newTask, type: "action" as const, icon: Plus },
    ];

    return [...projects, ...documents, ...conversations, ...actions];
  }, [query, language, t]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      if (item.href) {
        router.push(item.href);
        onClose();
      } else if (item.type === "page" && !item.href) {
        // Recent search — fill the input
        setQuery(item.label);
      }
      // For mock items, just close for now
      if (item.type === "project" || item.type === "document" || item.type === "conversation" || item.type === "action") {
        if (query.trim()) {
          saveRecentSearch(query.trim());
        }
        onClose();
      }
    },
    [router, onClose, query]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        } else if (query.trim()) {
          saveRecentSearch(query.trim());
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [items, selectedIndex, handleSelect, query, onClose]
  );

  // Group items by type for display
  const groupedSections = useMemo(() => {
    if (!query.trim()) {
      const recentPages = items.filter(
        (i) => i.type === "page" && i.icon !== Clock
      );
      const recentSearches = items.filter(
        (i) => i.type === "page" && i.icon === Clock
      );
      const sections: { title: string; items: SearchItem[] }[] = [];
      if (recentPages.length > 0) {
        sections.push({ title: t.widgets.recent, items: recentPages });
      }
      if (recentSearches.length > 0) {
        sections.push({
          title: t.widgets.recentSearches,
          items: recentSearches,
        });
      }
      return sections;
    }

    const projects = items.filter((i) => i.type === "project");
    const documents = items.filter((i) => i.type === "document");
    const conversations = items.filter((i) => i.type === "conversation");
    const actions = items.filter((i) => i.type === "action");

    const sections: { title: string; items: SearchItem[] }[] = [];
    if (projects.length > 0) sections.push({ title: t.widgets.projects, items: projects });
    if (documents.length > 0) sections.push({ title: t.widgets.documents, items: documents });
    if (conversations.length > 0) sections.push({ title: t.widgets.conversations, items: conversations });
    if (actions.length > 0) sections.push({ title: t.widgets.quickActions, items: actions });
    return sections;
  }, [items, query, t]);

  // Compute global index for each item across sections
  let globalIndex = 0;

  return (
    <div
      className={`fixed inset-0 z-[60] flex ${
        isMobile ? "items-stretch" : "items-start justify-center pt-[15vh]"
      }`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      {/* Backdrop */}
      {!isMobile && <div className="absolute inset-0 bg-black/40" />}

      {/* Modal */}
      <div
        className={`relative flex flex-col overflow-hidden border-slate-700 bg-slate-800 shadow-2xl ${
          isMobile
            ? "h-full w-full"
            : "w-[600px] max-h-[70vh] rounded-xl border"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.widgets.searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-600 bg-slate-700 px-1.5 text-[10px] font-medium text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto px-2 py-2">
          {groupedSections.length === 0 && query.trim() ? (
            <div className="px-3 py-8 text-center text-sm text-slate-500">
              {t.widgets.noResults}
            </div>
          ) : (
            groupedSections.map((section) => (
              <div key={section.title} className="mb-2">
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const idx = globalIndex++;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        idx === selectedIndex
                          ? "bg-[var(--cc-accent-600-20)] text-slate-100"
                          : "text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {idx === selectedIndex && (
                        <CornerDownLeft className="h-3 w-3 shrink-0 text-slate-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center gap-4 border-t border-slate-700 px-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            {language === "he" ? "ניווט" : "Navigate"}
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            {language === "he" ? "בחירה" : "Select"}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-600 px-1 text-[10px]">ESC</kbd>
            {language === "he" ? "סגירה" : "Close"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SearchBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);

  if (size < 2) return null;

  return (
    <span className="truncate text-xs text-slate-400">
      {t.widgets.searchPlaceholder}
    </span>
  );
}
