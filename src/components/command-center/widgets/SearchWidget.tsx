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
  Sparkles,
  StickyNote,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { supabase } from "@/lib/supabaseClient";
import { searchNotes } from "@/lib/supabase/entityQueries";
import { fetchEntityTypes } from "@/lib/supabase/entityQueries";
import type { EntityType, NoteRecord } from "@/lib/entities/types";
import type { WidgetSize } from "./WidgetRegistry";

const RECENT_PAGES_KEY = "cc-recent-pages";
const RECENT_SEARCHES_KEY = "cc-recent-searches";
const MAX_RECENT = 5;

interface RecentPage {
  href: string;
  label: string;
  timestamp: number;
}

interface DbDocument {
  id: string;
  title: string;
  similarity?: number;
}

interface SearchItem {
  id: string;
  label: string;
  type: "page" | "document" | "action" | "semantic" | "entity";
  href?: string;
  icon: typeof Search;
  similarity?: number;
  entityIcon?: string;
  entityTypeLabel?: string;
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
  const [dbDocuments, setDbDocuments] = useState<DbDocument[]>([]);
  const [searchResults, setSearchResults] = useState<DbDocument[]>([]);
  const [semanticResults, setSemanticResults] = useState<DbDocument[]>([]);
  const [entityResults, setEntityResults] = useState<NoteRecord[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Focus input on mount + load recent documents + entity types
  useEffect(() => {
    inputRef.current?.focus();
    async function loadDocs() {
      try {
        const { data } = await supabase
          .from('vb_records')
          .select('id, title')
          .eq('record_type', 'document')
          .eq('is_deleted', false)
          .order('last_edited_at', { ascending: false })
          .limit(20);
        if (data) setDbDocuments(data);
      } catch { /* silent — search still works with pages */ }
    }
    loadDocs();
    fetchEntityTypes().then(setEntityTypes);
  }, []);

  // Server-side search via RPC (debounced) + semantic fallback + entity search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSemanticResults([]);
      setEntityResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSemanticResults([]);
      // Entity search in parallel with document search
      searchNotes(query.trim()).then(notes => {
        // Filter out documents (already covered by doc search)
        setEntityResults(notes.filter(n => n.entity_type && n.record_type !== 'document'));
      });
      try {
        const { data } = await supabase.rpc('search_documents', {
          query: query.trim(),
          max_results: 20,
        });
        const ftsResults = (data as DbDocument[]) || [];
        setSearchResults(ftsResults);

        // Semantic fallback when FTS returns no results
        if (ftsResults.length === 0 && query.trim().length >= 3) {
          try {
            const res = await fetch('/api/embeddings/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: query.trim(), max_results: 10 }),
            });
            if (res.ok) {
              const { results } = await res.json();
              if (results?.length) {
                setSemanticResults(results as DbDocument[]);
              }
            }
          } catch { /* semantic search unavailable — silent */ }
        }
      } catch {
        // Fallback: client-side filter if RPC not available yet
        const q = query.toLowerCase();
        setSearchResults(
          dbDocuments.filter((d) => (d.title || '').toLowerCase().includes(q))
        );
      }
    }, 200);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, dbDocuments]);

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

      // Show recent documents too
      const docItems: SearchItem[] = dbDocuments.slice(0, 5).map((d) => ({
        id: `doc-${d.id}`,
        label: d.title || (language === 'he' ? 'ללא כותרת' : language === 'ru' ? 'Без названия' : 'Untitled'),
        type: "document" as const,
        href: `/dashboard/editor?id=${d.id}`,
        icon: FileText,
      }));

      return [...pageItems, ...docItems, ...searchItems];
    }

    // Search state: use server-side results + pages + entities + actions
    const q = query.toLowerCase();
    const documents: SearchItem[] = searchResults
      .map((d) => ({
        id: `doc-${d.id}`,
        label: d.title || (language === 'he' ? 'ללא כותרת' : language === 'ru' ? 'Без названия' : 'Untitled'),
        type: "document" as const,
        href: `/dashboard/editor?id=${d.id}`,
        icon: FileText,
      }));

    // Dashboard pages as searchable items
    const pageEntries = Object.entries(routeIcons);
    const pages: SearchItem[] = pageEntries
      .filter(([href]) => {
        const labels = tabLabels[href];
        if (!labels) return false;
        return labels.he.toLowerCase().includes(q) || labels.en.toLowerCase().includes(q);
      })
      .map(([href, icon]) => ({
        id: `page-${href}`,
        label: tabLabels[href]?.[language] || href,
        type: "page" as const,
        href,
        icon,
      }));

    // Entity results — grouped by entity_type
    const entityTypeMap = new Map(entityTypes.map(et => [et.slug, et]));
    const entities: SearchItem[] = entityResults.slice(0, 15).map((n) => {
      const et = n.entity_type ? entityTypeMap.get(n.entity_type) : undefined;
      const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
      return {
        id: `entity-${n.id}`,
        label: n.title || (language === 'he' ? 'ללא כותרת' : language === 'ru' ? 'Без названия' : 'Untitled'),
        type: "entity" as const,
        href: `/dashboard/entities/${n.entity_type}/${n.id}`,
        icon: StickyNote,
        entityIcon: et?.icon,
        entityTypeLabel: et?.label[lang] || n.entity_type || '',
      };
    });

    // Semantic results (shown when FTS has no matches)
    const semantic: SearchItem[] = semanticResults.map((d) => ({
      id: `sem-${d.id}`,
      label: d.title || (language === 'he' ? 'ללא כותרת' : language === 'ru' ? 'Без названия' : 'Untitled'),
      type: "semantic" as const,
      href: `/dashboard/editor?id=${d.id}`,
      icon: Sparkles,
      similarity: d.similarity,
    }));

    const actions: SearchItem[] = [
      { id: "action-document", label: t.widgets.newDocument, type: "action" as const, href: "__new-doc__", icon: Plus },
    ];

    return [...pages, ...documents, ...entities, ...semantic, ...actions];
  }, [query, language, t, dbDocuments, searchResults, semanticResults, entityResults, entityTypes]);

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
    async (item: SearchItem) => {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }

      // Create new document
      if (item.href === "__new-doc__") {
        try {
          const { data: existing } = await supabase
            .from('vb_records')
            .select('workspace_id, entity_id, created_by')
            .eq('record_type', 'document')
            .limit(1)
            .single();
          if (existing) {
            const { data } = await supabase
              .from('vb_records')
              .insert({
                workspace_id: existing.workspace_id,
                entity_id: existing.entity_id,
                created_by: existing.created_by,
                title: language === 'he' ? 'מסמך חדש' : language === 'ru' ? 'Новый документ' : 'New Document',
                content: { type: 'doc', content: [{ type: 'paragraph' }] },
                record_type: 'document',
                source: 'manual',
                status: 'active',
              })
              .select('id')
              .single();
            if (data) {
              router.push(`/dashboard/editor?id=${data.id}`);
              onClose();
              return;
            }
          }
        } catch { /* fall through */ }
        onClose();
        return;
      }

      // Navigate to href
      if (item.href) {
        router.push(item.href);
        onClose();
        return;
      }

      // Recent search without href — fill the input
      if (item.type === "page" && !item.href) {
        setQuery(item.label);
      }
    },
    [router, onClose, query, language]
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

  // Tab labels for page search
  const tabLabels: Record<string, { he: string; en: string; ru: string }> = {
    "/dashboard/layers": { he: "שכבות", en: "Layers", ru: "Слои" },
    "/dashboard/editor": { he: "עורך", en: "Editor", ru: "Редактор" },
    "/dashboard/story-map": { he: "מפת סיפור", en: "Story Map", ru: "Карта историй" },
    "/dashboard/functional-map": { he: "מפה פונקציונלית", en: "Functional Map", ru: "Функциональная карта" },
    "/dashboard/ai-hub": { he: "מרכז AI", en: "AI Hub", ru: "AI Центр" },
    "/dashboard/design-system": { he: "מערכת עיצוב", en: "Design System", ru: "Дизайн-система" },
    "/dashboard/formily": { he: "טפסים", en: "Formily", ru: "Формы" },
    "/dashboard/architecture": { he: "ארכיטקטורה", en: "Architecture", ru: "Архитектура" },
    "/dashboard/plan": { he: "תוכנית", en: "Plan", ru: "План" },
    "/dashboard/settings": { he: "הגדרות", en: "Settings", ru: "Настройки" },
  };

  // Group items by type for display
  const groupedSections = useMemo(() => {
    if (!query.trim()) {
      const recentPages = items.filter(
        (i) => i.type === "page" && i.icon !== Clock
      );
      const docItems = items.filter((i) => i.type === "document");
      const recentSearches = items.filter(
        (i) => i.type === "page" && i.icon === Clock
      );
      const sections: { title: string; items: SearchItem[] }[] = [];
      if (recentPages.length > 0) {
        sections.push({ title: t.widgets.recent, items: recentPages });
      }
      if (docItems.length > 0) {
        sections.push({ title: t.widgets.documents, items: docItems });
      }
      if (recentSearches.length > 0) {
        sections.push({
          title: t.widgets.recentSearches,
          items: recentSearches,
        });
      }
      return sections;
    }

    const pages = items.filter((i) => i.type === "page");
    const documents = items.filter((i) => i.type === "document");
    const entityItems = items.filter((i) => i.type === "entity");
    const semanticItems = items.filter((i) => i.type === "semantic");
    const actions = items.filter((i) => i.type === "action");

    const sections: { title: string; items: SearchItem[] }[] = [];
    if (pages.length > 0) sections.push({ title: t.widgets.recent, items: pages });
    if (documents.length > 0) sections.push({ title: t.widgets.documents, items: documents });
    if (entityItems.length > 0) {
      // Group entities by type for cleaner display
      const byType = new Map<string, SearchItem[]>();
      for (const item of entityItems) {
        const typeLabel = item.entityTypeLabel || 'entities';
        if (!byType.has(typeLabel)) byType.set(typeLabel, []);
        byType.get(typeLabel)!.push(item);
      }
      for (const [typeLabel, typeItems] of byType) {
        sections.push({ title: typeLabel, items: typeItems });
      }
    }
    if (semanticItems.length > 0) sections.push({ title: language === 'he' ? 'תוצאות סמנטיות' : language === 'ru' ? 'Семантические результаты' : 'Semantic Results', items: semanticItems });
    if (actions.length > 0) sections.push({ title: t.widgets.quickActions, items: actions });
    return sections;
  }, [items, query, t, language]);

  // Compute global index for each item across sections
  let globalIndex = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className={`fixed inset-0 z-[60] flex ${
        isMobile ? "items-stretch" : "items-start justify-center pt-[15vh]"
      }`}
      onClick={onClose}
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
                      {item.entityIcon ? (
                        <span className="shrink-0 text-sm">{item.entityIcon}</span>
                      ) : (
                        <Icon className={`h-4 w-4 shrink-0 ${item.type === 'semantic' ? 'text-purple-400' : 'text-slate-400'}`} />
                      )}
                      <span className="flex-1 truncate text-start">{item.label}</span>
                      {item.similarity != null && (
                        <span className="shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                          {Math.round(item.similarity * 100)}%
                        </span>
                      )}
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
            {language === "he" ? "ניווט" : language === "ru" ? "Навигация" : "Navigate"}
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            {language === "he" ? "בחירה" : language === "ru" ? "Выбрать" : "Select"}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-600 px-1 text-[10px]">ESC</kbd>
            {language === "he" ? "סגירה" : language === "ru" ? "Закрыть" : "Close"}
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
