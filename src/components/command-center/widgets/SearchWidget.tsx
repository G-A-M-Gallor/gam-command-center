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
  Zap,
  LayoutGrid,
  BookOpen,
  FolderKanban,
  Command,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { supabase } from "@/lib/supabaseClient";
import { searchNotes } from "@/lib/supabase/entityQueries";
import { fetchEntityTypes } from "@/lib/supabase/entityQueries";
import { SYSTEM_SHORTCUTS } from "@/lib/shortcuts/shortcutRegistry";
import { SHORTCUT_EVENT_MAP, SHORTCUT_NAV_MAP } from "@/contexts/ShortcutsContext";
import { widgetRegistry } from "./WidgetRegistry";
import type { EntityType, NoteRecord } from "@/lib/entities/types";
import type { WidgetSize } from "./WidgetRegistry";

const RECENT_PAGES_KEY = "cc-recent-pages";
const RECENT_SEARCHES_KEY = "cc-recent-searches";
const MAX_RECENT = 5;

// ─── Types ──────────────────────────────────────────────────

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
  type: "page" | "document" | "action" | "semantic" | "entity" | "command" | "widget" | "project" | "wiki";
  href?: string;
  icon: typeof Search;
  similarity?: number;
  entityIcon?: string;
  entityTypeLabel?: string;
  /** Keyboard shortcut hint displayed on the right (e.g. "Cmd+K") */
  shortcutHint?: string;
  /** Custom event to dispatch on select (for commands/widgets) */
  eventName?: string;
}

// ─── Helpers ────────────────────────────────────────────────

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

// ─── Route & Page Data ──────────────────────────────────────

/** Full routes list for navigation search — replaces the old routeIcons + tabLabels */
const DASHBOARD_PAGES: {
  path: string;
  icon: typeof Search;
  label: { he: string; en: string; ru: string };
}[] = [
  { path: "/dashboard", icon: Layers, label: { he: "דשבורד", en: "Dashboard", ru: "Панель" } },
  { path: "/dashboard/layers", icon: Layers, label: { he: "האב", en: "Command Hub", ru: "Командный центр" } },
  { path: "/dashboard/editor", icon: FileText, label: { he: "עורך", en: "Editor", ru: "Редактор" } },
  { path: "/dashboard/story-map", icon: Layers, label: { he: "מפת סיפור", en: "Story Map", ru: "Карта историй" } },
  { path: "/dashboard/functional-map", icon: Layers, label: { he: "מפה פונקציונלית", en: "Functional Map", ru: "Функциональная карта" } },
  { path: "/dashboard/ai-hub", icon: Bot, label: { he: "מרכז AI", en: "AI Hub", ru: "AI Центр" } },
  { path: "/dashboard/design-system", icon: Layers, label: { he: "מערכת עיצוב", en: "Design System", ru: "Дизайн-система" } },
  { path: "/dashboard/architecture", icon: Layers, label: { he: "ארכיטקטורה", en: "Architecture", ru: "Архитектура" } },
  { path: "/dashboard/plan", icon: Layers, label: { he: "תוכנית", en: "Plan", ru: "План" } },
  { path: "/dashboard/settings", icon: Layers, label: { he: "הגדרות", en: "Settings", ru: "Настройки" } },
  { path: "/dashboard/admin", icon: Layers, label: { he: "לוג פיתוח", en: "Admin", ru: "Админ" } },
  { path: "/dashboard/wiki", icon: BookOpen, label: { he: "ויקי", en: "Wiki", ru: "Вики" } },
  { path: "/dashboard/automations", icon: Zap, label: { he: "אוטומציות", en: "Automations", ru: "Автоматизации" } },
  { path: "/dashboard/entities/fields", icon: Layers, label: { he: "ספריית שדות", en: "Field Library", ru: "Библиотека полей" } },
  { path: "/dashboard/grid", icon: LayoutGrid, label: { he: "גיליון", en: "Grid", ru: "Таблица" } },
  { path: "/dashboard/boardroom", icon: Bot, label: { he: "חדר דיונים", en: "Board Room", ru: "Зал заседаний" } },
  { path: "/dashboard/feeds", icon: Layers, label: { he: "פידים", en: "Feeds", ru: "Ленты" } },
];

/** Legacy routeIcons lookup — used for recent pages icon mapping */
const routeIcons: Record<string, typeof Search> = Object.fromEntries(
  DASHBOARD_PAGES.map((p) => [p.path, p.icon])
);

// ─── SearchPanel ────────────────────────────────────────────

interface SearchPanelProps {
  onClose: () => void;
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const lang = language === "he" ? "he" : language === "ru" ? "ru" : "en";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbDocuments, setDbDocuments] = useState<DbDocument[]>([]);
  const [searchResults, setSearchResults] = useState<DbDocument[]>([]);
  const [semanticResults, setSemanticResults] = useState<DbDocument[]>([]);
  const [entityResults, setEntityResults] = useState<NoteRecord[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [projectResults, setProjectResults] = useState<{ id: string; name: string }[]>([]);
  const [wikiResults, setWikiResults] = useState<{ id: string; question: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Prefix mode detection ─────────────────────────────────
  const isCommandMode = query.startsWith(">");
  const isPageMode = query.startsWith("/");
  const effectiveQuery = (isCommandMode || isPageMode) ? query.slice(1).trim() : query.trim();

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
      } catch { /* silent -- search still works with pages */ }
    }
    loadDocs();
    fetchEntityTypes().then(setEntityTypes);
  }, []);

  // Server-side search via RPC (debounced) + semantic fallback + entity search + projects + wiki
  useEffect(() => {
    if (!effectiveQuery) {
      setSearchResults([]);
      setSemanticResults([]);
      setEntityResults([]);
      setProjectResults([]);
      setWikiResults([]);
      return;
    }

    // Skip DB searches in command-only or page-only mode
    if (isCommandMode || isPageMode) {
      setSearchResults([]);
      setSemanticResults([]);
      setEntityResults([]);
      setProjectResults([]);
      setWikiResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSemanticResults([]);

      // Entity search in parallel with document search
      searchNotes(effectiveQuery).then(notes => {
        setEntityResults(notes.filter(n => n.entity_type && n.record_type !== 'document'));
      });

      // Projects search
      supabase
        .from('projects')
        .select('id, name')
        .ilike('name', `%${effectiveQuery}%`)
        .limit(5)
        .then(({ data }) => {
          if (data) setProjectResults(data);
        });

      // Wiki search
      supabase
        .from('wiki_entries')
        .select('id, question')
        .ilike('question', `%${effectiveQuery}%`)
        .limit(5)
        .then(({ data }) => {
          if (data) setWikiResults(data);
        });

      try {
        const { data } = await supabase.rpc('search_documents', {
          query: effectiveQuery,
          max_results: 20,
        });
        const ftsResults = (data as DbDocument[]) || [];
        setSearchResults(ftsResults);

        // Semantic fallback when FTS returns no results
        if (ftsResults.length === 0 && effectiveQuery.length >= 3) {
          try {
            const res = await fetch('/api/embeddings/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: effectiveQuery, max_results: 10 }),
            });
            if (res.ok) {
              const { results } = await res.json();
              if (results?.length) {
                setSemanticResults(results as DbDocument[]);
              }
            }
          } catch { /* semantic search unavailable -- silent */ }
        }
      } catch {
        // Fallback: client-side filter if RPC not available yet
        const q = effectiveQuery.toLowerCase();
        setSearchResults(
          dbDocuments.filter((d) => (d.title || '').toLowerCase().includes(q))
        );
      }
    }, 200);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [effectiveQuery, isCommandMode, isPageMode, dbDocuments]);

  // ── Build command items from shortcuts ────────────────────
  const commandItems = useMemo((): SearchItem[] => {
    const q = effectiveQuery.toLowerCase();
    return SYSTEM_SHORTCUTS
      .filter((sc) => sc.scope === "global" && sc.isSystem)
      .filter((sc) => {
        if (!q) return true;
        const name = sc.displayName[lang].toLowerCase();
        const slug = sc.actionSlug.replace(/_/g, " ");
        return name.includes(q) || slug.includes(q) || sc.keyCombo.toLowerCase().includes(q);
      })
      .map((sc) => {
        const navPath = SHORTCUT_NAV_MAP[sc.actionSlug];
        const eventName = SHORTCUT_EVENT_MAP[sc.actionSlug];
        return {
          id: `cmd-${sc.id}`,
          label: sc.displayName[lang],
          type: "command" as const,
          href: navPath || undefined,
          icon: Zap,
          shortcutHint: sc.keyCombo,
          eventName: eventName || undefined,
        };
      });
  }, [effectiveQuery, lang]);

  // ── Build page items ──────────────────────────────────────
  const pageItems = useMemo((): SearchItem[] => {
    const q = effectiveQuery.toLowerCase();
    return DASHBOARD_PAGES
      .filter((p) => {
        if (!q) return true;
        return (
          p.label.he.toLowerCase().includes(q) ||
          p.label.en.toLowerCase().includes(q) ||
          p.label.ru.toLowerCase().includes(q) ||
          p.path.toLowerCase().includes(q)
        );
      })
      .map((p) => ({
        id: `page-${p.path}`,
        label: p.label[lang],
        type: "page" as const,
        href: p.path,
        icon: p.icon,
      }));
  }, [effectiveQuery, lang]);

  // ── Build widget items ────────────────────────────────────
  const widgetItems = useMemo((): SearchItem[] => {
    const q = effectiveQuery.toLowerCase();
    return widgetRegistry
      .filter((w) => w.status === "active")
      .filter((w) => {
        if (!q) return true;
        return (
          w.label.he.toLowerCase().includes(q) ||
          w.label.en.toLowerCase().includes(q) ||
          w.label.ru.toLowerCase().includes(q) ||
          w.id.includes(q)
        );
      })
      .map((w) => ({
        id: `widget-${w.id}`,
        label: w.label[lang],
        type: "widget" as const,
        icon: w.icon,
        eventName: `cc-widget-panel-toggle`,
      }));
  }, [effectiveQuery, lang]);

  // Build items list
  const items = useMemo((): SearchItem[] => {
    // ── Empty state: recent pages + recent searches ─────────
    if (!query.trim()) {
      const recentPages = getRecentPages().slice(0, MAX_RECENT);
      const recentSearches = getRecentSearches().slice(0, MAX_RECENT);

      const rpItems: SearchItem[] = recentPages.map((p) => ({
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

      const docItems: SearchItem[] = dbDocuments.slice(0, 5).map((d) => ({
        id: `doc-${d.id}`,
        label: d.title || (language === 'he' ? 'ללא כותרת' : language === 'ru' ? 'Без названия' : 'Untitled'),
        type: "document" as const,
        href: `/dashboard/editor?id=${d.id}`,
        icon: FileText,
      }));

      return [...rpItems, ...docItems, ...searchItems];
    }

    // ── Prefix mode: > for commands only ────────────────────
    if (isCommandMode) {
      return commandItems;
    }

    // ── Prefix mode: / for pages only ───────────────────────
    if (isPageMode) {
      return pageItems;
    }

    // ── Mixed search: all sources ───────────────────────────
    const q = effectiveQuery.toLowerCase();

    // Commands (filtered, max 5 in mixed mode)
    const cmds = commandItems.slice(0, 5);

    // Pages
    const pages = pageItems.slice(0, 8);

    // Widgets
    const widgets = widgetItems.slice(0, 5);

    // Documents from DB
    const documents: SearchItem[] = searchResults.map((d) => ({
      id: `doc-${d.id}`,
      label: d.title || (language === 'he' ? 'ללא כותרת' : language === 'ru' ? 'Без названия' : 'Untitled'),
      type: "document" as const,
      href: `/dashboard/editor?id=${d.id}`,
      icon: FileText,
    }));

    // Entity results -- grouped by entity_type
    const entityTypeMap = new Map(entityTypes.map(et => [et.slug, et]));
    const entities: SearchItem[] = entityResults.slice(0, 15).map((n) => {
      const et = n.entity_type ? entityTypeMap.get(n.entity_type) : undefined;
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

    // Projects
    const projects: SearchItem[] = projectResults.map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      type: "project" as const,
      href: `/dashboard/layers`,
      icon: FolderKanban,
    }));

    // Wiki
    const wiki: SearchItem[] = wikiResults.map((w) => ({
      id: `wiki-${w.id}`,
      label: w.question,
      type: "wiki" as const,
      href: `/dashboard/wiki/${w.id}`,
      icon: BookOpen,
    }));

    // Quick create action
    const actions: SearchItem[] = [
      { id: "action-document", label: t.widgets.newDocument, type: "action" as const, href: "__new-doc__", icon: Plus },
    ];

    return [...cmds, ...pages, ...widgets, ...documents, ...entities, ...semantic, ...projects, ...wiki, ...actions];
  }, [query, language, lang, t, dbDocuments, searchResults, semanticResults, entityResults, entityTypes, commandItems, pageItems, widgetItems, projectResults, wikiResults, isCommandMode, isPageMode, effectiveQuery]);

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
      if (query.trim() && !isCommandMode && !isPageMode) {
        saveRecentSearch(query.trim());
      }

      // Command: dispatch event
      if (item.type === "command" && item.eventName) {
        window.dispatchEvent(new CustomEvent(item.eventName));
        onClose();
        return;
      }

      // Widget: dispatch toggle event with widget id
      if (item.type === "widget") {
        const widgetId = item.id.replace("widget-", "");
        window.dispatchEvent(new CustomEvent("cc-widget-panel-toggle", { detail: { widgetId } }));
        onClose();
        return;
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

      // Navigate to href (commands with nav path, pages, documents, etc.)
      if (item.href) {
        router.push(item.href);
        onClose();
        return;
      }

      // Recent search without href -- fill the input
      if (item.type === "page" && !item.href) {
        setQuery(item.label);
      }
    },
    [router, onClose, query, language, isCommandMode, isPageMode]
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

  // ── Group items by type for display ───────────────────────
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

    // Prefix modes show a single section
    if (isCommandMode) {
      const sections: { title: string; items: SearchItem[] }[] = [];
      if (items.length > 0) {
        sections.push({ title: t.widgets.commandsSection, items });
      }
      return sections;
    }

    if (isPageMode) {
      const sections: { title: string; items: SearchItem[] }[] = [];
      if (items.length > 0) {
        sections.push({ title: t.widgets.pagesSection, items });
      }
      return sections;
    }

    // Mixed mode: group by type in defined order
    const commands = items.filter((i) => i.type === "command");
    const pages = items.filter((i) => i.type === "page");
    const widgets = items.filter((i) => i.type === "widget");
    const documents = items.filter((i) => i.type === "document");
    const entityItems = items.filter((i) => i.type === "entity");
    const semanticItems = items.filter((i) => i.type === "semantic");
    const projectItems = items.filter((i) => i.type === "project");
    const wikiItems = items.filter((i) => i.type === "wiki");
    const actions = items.filter((i) => i.type === "action");

    const sections: { title: string; items: SearchItem[] }[] = [];

    // 1. Actions (commands)
    if (commands.length > 0) sections.push({ title: t.widgets.commandsSection, items: commands });
    // 2. Pages
    if (pages.length > 0) sections.push({ title: t.widgets.pagesSection, items: pages });
    // 3. Widgets
    if (widgets.length > 0) sections.push({ title: t.widgets.widgetsSection, items: widgets });
    // 4. Entities (grouped by type)
    if (entityItems.length > 0) {
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
    // 5. Documents
    if (documents.length > 0) sections.push({ title: t.widgets.documents, items: documents });
    // 6. Projects
    if (projectItems.length > 0) sections.push({ title: t.widgets.projectsSection, items: projectItems });
    // 7. Wiki
    if (wikiItems.length > 0) sections.push({ title: t.widgets.wikiSection, items: wikiItems });
    // Semantic
    if (semanticItems.length > 0) sections.push({ title: language === 'he' ? 'תוצאות סמנטיות' : language === 'ru' ? 'Семантические результаты' : 'Semantic Results', items: semanticItems });
    // Quick actions
    if (actions.length > 0) sections.push({ title: t.widgets.quickActions, items: actions });

    return sections;
  }, [items, query, t, language, isCommandMode, isPageMode]);

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
          {isCommandMode ? (
            <Zap className="h-5 w-5 shrink-0 text-amber-400" />
          ) : isPageMode ? (
            <Command className="h-5 w-5 shrink-0 text-blue-400" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
          )}
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
                        <Icon className={`h-4 w-4 shrink-0 ${
                          item.type === 'semantic' ? 'text-purple-400' :
                          item.type === 'command' ? 'text-amber-400' :
                          item.type === 'widget' ? 'text-blue-400' :
                          'text-slate-400'
                        }`} />
                      )}
                      <span className="flex-1 truncate text-start">{item.label}</span>
                      {item.shortcutHint && (
                        <kbd className="shrink-0 rounded border border-slate-600 bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                          {item.shortcutHint}
                        </kbd>
                      )}
                      {item.similarity != null && (
                        <span className="shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                          {Math.round(item.similarity * 100)}%
                        </span>
                      )}
                      {idx === selectedIndex && !item.shortcutHint && (
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
          <span className="ms-auto text-slate-600">
            {t.widgets.typeCommandHint}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── SearchBarContent (collapsed widget bar) ────────────────

export function SearchBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);

  if (size < 2) return null;

  return (
    <span className="flex items-center gap-2 truncate text-xs text-slate-400">
      <span className="truncate">{t.widgets.searchPlaceholder}</span>
      <kbd className="hidden sm:inline-flex shrink-0 h-4 items-center rounded border border-slate-600 bg-slate-700/60 px-1 text-[9px] font-medium text-slate-500">
        {"\u2318"}K
      </kbd>
    </span>
  );
}
