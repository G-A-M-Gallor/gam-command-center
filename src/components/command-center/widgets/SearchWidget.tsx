"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  _Clock,
  FileText,
  Bot,
  _Layers,
  _Plus,
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
  Grid3X3,
  _Monitor,
  AppWindow,
  Power,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { supabase } from "@/lib/supabaseClient";
import { searchNotes } from "@/lib/supabase/entityQueries";
import { fetchEntityTypes } from "@/lib/supabase/entityQueries";
import { SYSTEM_SHORTCUTS } from "@/lib/shortcuts/shortcutRegistry";
import { formatComboForDisplay } from "@/lib/shortcuts/shortcutEngine";
import { SHORTCUT_EVENT_MAP, SHORTCUT_NAV_MAP } from "@/contexts/ShortcutsContext";
import { widgetRegistry, getEffectivePlacement } from "./WidgetRegistry";
import type { EntityType, NoteRecord } from "@/lib/entities/types";
import type { WidgetSize, WidgetCategory, WidgetPlacement } from "./WidgetRegistry";
import { useWidgets } from "@/contexts/WidgetContext";

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
  { path: "/dashboard", icon: _Layers, label: { he: "דשבורד", en: "Dashboard", ru: "Панель" } },
  { path: "/dashboard/layers", icon: _Layers, label: { he: "האב", en: "Command Hub", ru: "Командный центр" } },
  { path: "/dashboard/editor", icon: FileText, label: { he: "עורך", en: "Editor", ru: "Редактор" } },
  { path: "/dashboard/story-map", icon: _Layers, label: { he: "מפת סיפור", en: "Story Map", ru: "Карта историй" } },
  { path: "/dashboard/functional-map", icon: _Layers, label: { he: "מפה פונקציונלית", en: "Functional Map", ru: "Функциональная карта" } },
  { path: "/dashboard/ai-hub", icon: Bot, label: { he: "מרכז AI", en: "AI Hub", ru: "AI Центр" } },
  { path: "/dashboard/design-system", icon: _Layers, label: { he: "מערכת עיצוב", en: "Design System", ru: "Дизайн-система" } },
  { path: "/dashboard/architecture", icon: _Layers, label: { he: "ארכיטקטורה", en: "Architecture", ru: "Архитектура" } },
  { path: "/dashboard/plan", icon: _Layers, label: { he: "תוכנית", en: "Plan", ru: "План" } },
  { path: "/dashboard/settings", icon: _Layers, label: { he: "הגדרות", en: "Settings", ru: "Настройки" } },
  { path: "/dashboard/admin", icon: _Layers, label: { he: "לוג פיתוח", en: "Admin", ru: "Админ" } },
  { path: "/dashboard/wiki", icon: BookOpen, label: { he: "ויקי", en: "Wiki", ru: "Вики" } },
  { path: "/dashboard/automations", icon: Zap, label: { he: "אוטומציות", en: "Automations", ru: "Автоматизации" } },
  { path: "/dashboard/entities/fields", icon: _Layers, label: { he: "ספריית שדות", en: "Field Library", ru: "Библиотека полей" } },
  { path: "/dashboard/grid", icon: LayoutGrid, label: { he: "גיליון", en: "Grid", ru: "Таблица" } },
  { path: "/dashboard/boardroom", icon: Bot, label: { he: "חדר דיונים", en: "Board Room", ru: "Зал заседаний" } },
  { path: "/dashboard/feeds", icon: _Layers, label: { he: "פידים", en: "Feeds", ru: "Ленты" } },
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
  const _t = getTranslations(language);
  const _router = useRouter();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const lang = language;
  const wt = t.widgets as Record<string, string>;

  const [activeTab, setActiveTab] = useState<"search" | "apps">("search");
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
              _headers: { 'Content-Type': 'application/json' },
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
        icon: routeIcons[p.href] || _Layers,
      }));

      const searchItems: SearchItem[] = recentSearches.map((s, i) => ({
        id: `search-${i}`,
        label: s,
        type: "page" as const,
        icon: _Clock,
      }));

      const docItems: SearchItem[] = dbDocuments.slice(0, 5).map((d) => ({
        id: `doc-${d.id}`,
        label: d.title || (wt.untitled || 'Untitled'),
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

    // Commands (filtered, max 5 in mixed mode)
    const cmds = commandItems.slice(0, 5);

    // Pages
    const pages = pageItems.slice(0, 8);

    // Widgets
    const widgets = widgetItems.slice(0, 5);

    // Documents from DB
    const documents: SearchItem[] = searchResults.map((d) => ({
      id: `doc-${d.id}`,
      label: d.title || (wt.untitled || 'Untitled'),
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
        label: n.title || (wt.untitled || 'Untitled'),
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
      label: d.title || (wt.untitled || 'Untitled'),
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
      { id: "action-document", label: t.widgets.newDocument, type: "action" as const, href: "__new-doc__", icon: _Plus },
    ];

    return [...cmds, ...pages, ...widgets, ...documents, ...entities, ...semantic, ...projects, ...wiki, ...actions];
  }, [query, lang, _t, wt.untitled, dbDocuments, searchResults, semanticResults, entityResults, entityTypes, commandItems, pageItems, widgetItems, projectResults, wikiResults, isCommandMode, isPageMode]);

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
                title: wt.newDocument || 'New Document',
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
    [_router, onClose, query, isCommandMode, isPageMode, wt.newDocument]
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
        sections.push({ title: _t.widgets.recent, items: recentPages });
      }
      if (docItems.length > 0) {
        sections.push({ title: _t.widgets.documents, items: docItems });
      }
      if (recentSearches.length > 0) {
        sections.push({
          title: _t.widgets.recentSearches,
          items: recentSearches,
        });
      }
      return sections;
    }

    // Prefix modes show a single section
    if (isCommandMode) {
      const sections: { title: string; items: SearchItem[] }[] = [];
      if (items.length > 0) {
        sections.push({ title: _t.widgets.commandsSection, items });
      }
      return sections;
    }

    if (isPageMode) {
      const sections: { title: string; items: SearchItem[] }[] = [];
      if (items.length > 0) {
        sections.push({ title: _t.widgets.pagesSection, items });
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
    if (commands.length > 0) sections.push({ title: _t.widgets.commandsSection, items: commands });
    // 2. Pages
    if (pages.length > 0) sections.push({ title: _t.widgets.pagesSection, items: pages });
    // 3. Widgets
    if (widgets.length > 0) sections.push({ title: _t.widgets.widgetsSection, items: widgets });
    // 4. Entities (_grouped by type)
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
    if (documents.length > 0) sections.push({ title: _t.widgets.documents, items: documents });
    // 6. Projects
    if (projectItems.length > 0) sections.push({ title: _t.widgets.projectsSection, items: projectItems });
    // 7. Wiki
    if (wikiItems.length > 0) sections.push({ title: _t.widgets.wikiSection, items: wikiItems });
    // Semantic
    if (semanticItems.length > 0) sections.push({ title: wt.semanticResults, items: semanticItems });
    // Quick actions
    if (actions.length > 0) sections.push({ title: _t.widgets.quickActions, items: actions });

    return sections;
  }, [items, query, _t, wt.semanticResults, isCommandMode, isPageMode]);

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
            : "w-[640px] max-h-[75vh] rounded-xl border"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-700">
          <button
            type="button"
            onClick={() => { setActiveTab("search"); inputRef.current?.focus(); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "search"
                ? "border-[var(--cc-accent-400)] text-[var(--cc-accent-300)]"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            {wt.searchTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("apps")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "apps"
                ? "border-[var(--cc-accent-400)] text-[var(--cc-accent-300)]"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            {wt.appsTab}
          </button>
          <div className="flex-1" />
          <kbd className="hidden sm:inline-flex me-3 h-5 items-center rounded border border-slate-600 bg-slate-700 px-1.5 text-[10px] font-medium text-slate-400">
            ESC
          </kbd>
        </div>

        {activeTab === "search" ? (
          <>
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
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto px-2 py-2">
              {groupedSections.length === 0 && query.trim() ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  {_t.widgets.noResults}
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
                            <kbd className="shrink-0 flex items-center gap-0.5 rounded border border-slate-600 bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              {formatComboForDisplay(item.shortcutHint).join("")}
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
                {wt.searchNavigate}
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" />
                {wt.searchSelect}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-600 px-1 text-[10px]">ESC</kbd>
                {wt.searchClose}
              </span>
              <span className="ms-auto text-slate-600">
                {t.widgets.typeCommandHint}
              </span>
            </div>
          </>
        ) : (
          <AppsManagerPanel lang={lang} wt={wt} />
        )}
      </div>
    </div>
  );
}

// ─── Apps Manager Panel ──────────────────────────────────────

const CATEGORY_ORDER: WidgetCategory[] = ["basics", "productivity", "ai_comms", "team", "analytics", "integrations"];
const CATEGORY_LABEL_MAP: Record<WidgetCategory, string> = {
  basics: "categoryBasics",
  productivity: "categoryProductivity",
  ai_comms: "categoryAiComms",
  team: "categoryTeam",
  analytics: "categoryAnalytics",
  integrations: "categoryIntegrations",
};

function AppsManagerPanel({ lang, wt }: { lang: "he" | "en" | "ru"; wt: Record<string, string> }) {
  const { widgetPlacements, setWidgetPlacement } = useWidgets();
  const [filterCategory, setFilterCategory] = useState<WidgetCategory | "all">("all");
  const [filterPlacement, setFilterPlacement] = useState<WidgetPlacement | "all">("all");

  const _grouped = useMemo(() => {
    const map = new Map<WidgetCategory, typeof widgetRegistry>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const w of widgetRegistry) {
      const list = map.get(w.category);
      if (list) list.push(w);
    }
    return map;
  }, []);

  const filteredWidgets = useMemo(() => {
    let widgets = [...widgetRegistry];
    if (filterCategory !== "all") {
      widgets = widgets.filter(w => w.category === filterCategory);
    }
    if (filterPlacement !== "all") {
      widgets = widgets.filter(w => {
        const eff = getEffectivePlacement(w.id, widgetPlacements, w.isRemovable);
        return eff === filterPlacement;
      });
    }
    return widgets;
  }, [filterCategory, filterPlacement, widgetPlacements]);

  const stats = useMemo(() => {
    let toolbar = 0, apps = 0, disabled = 0;
    for (const w of widgetRegistry) {
      const p = getEffectivePlacement(w.id, widgetPlacements, w.isRemovable);
      if (p === "toolbar") toolbar++;
      else if (p === "apps") apps++;
      else disabled++;
    }
    return { toolbar, apps, disabled, total: widgetRegistry.length };
  }, [widgetPlacements]);

  const cyclePlacement = useCallback((id: string, isRemovable: boolean) => {
    if (!isRemovable) return;
    const current = getEffectivePlacement(id, widgetPlacements, isRemovable);
    const next: WidgetPlacement = current === "toolbar" ? "apps" : current === "apps" ? "disabled" : "toolbar";
    setWidgetPlacement(id, next);
  }, [widgetPlacements, setWidgetPlacement]);

  const placementBadge = (placement: WidgetPlacement) => {
    if (placement === "toolbar") return { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: wt.appsOnToolbar, icon: _Monitor };
    if (placement === "apps") return { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", label: wt.appsInDrawer, icon: AppWindow };
    return { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", label: wt.appsDisabled, icon: Power };
  };

  // Group filtered widgets by category for display
  const displayGroups = useMemo(() => {
    const groups: { category: WidgetCategory; label: string; widgets: typeof widgetRegistry }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const catWidgets = filteredWidgets.filter(w => w.category === cat);
      if (catWidgets.length > 0) {
        groups.push({
          category: cat,
          label: wt[CATEGORY_LABEL_MAP[cat]] || cat,
          widgets: catWidgets,
        });
      }
    }
    return groups;
  }, [filteredWidgets, wt]);

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <_Monitor className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">{stats.toolbar}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AppWindow className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">{stats.apps}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Power className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">{stats.disabled}</span>
        </div>
        <span className="text-[10px] text-slate-600 ms-auto">{stats.total} {wt.appsAllWidgets?.toLowerCase()}</span>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-700/50 overflow-x-auto">
        {/* Placement filter */}
        {(["all", "toolbar", "apps", "disabled"] as const).map((p) => {
          const label = p === "all" ? (wt.appsAllWidgets || "All") : p === "toolbar" ? (wt.appsOnToolbar) : p === "apps" ? (wt.appsInDrawer) : (wt.appsDisabled);
          return (
            <button
              key={`p-${p}`}
              type="button"
              onClick={() => setFilterPlacement(p)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                filterPlacement === p
                  ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)] border border-[var(--cc-accent-500-30)]"
                  : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700"
              }`}
            >
              {label}
            </button>
          );
        })}
        <div className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
        {/* Category filter */}
        {(["all", ...CATEGORY_ORDER] as const).map((c) => {
          const label = c === "all" ? (wt.appsAllWidgets || "All") : (wt[CATEGORY_LABEL_MAP[c]] || c);
          return (
            <button
              key={`c-${c}`}
              type="button"
              onClick={() => setFilterCategory(c)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                filterCategory === c
                  ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)] border border-[var(--cc-accent-500-30)]"
                  : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Widget grid */}
      <div className="overflow-y-auto flex-1 px-3 py-2">
        {displayGroups.map((group) => (
          <div key={group.category} className="mb-3">
            <div className="px-1 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {group.label}
              <span className="ms-1.5 text-slate-600">({group.widgets.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {group.widgets.map((w) => {
                const eff = getEffectivePlacement(w.id, widgetPlacements, w.isRemovable);
                const badge = placementBadge(eff);
                const BadgeIcon = badge.icon;
                const Icon = w.icon;
                const isComingSoon = w.status === "coming-soon";

                return (
                  <div
                    key={w.id}
                    className={`group relative flex flex-col gap-1.5 rounded-lg border p-2.5 transition-all cursor-pointer ${
                      eff === "toolbar"
                        ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                        : eff === "apps"
                        ? "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40"
                        : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                    } ${isComingSoon ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => cyclePlacement(w.id, w.isRemovable)}
                  >
                    {/* Header row */}
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center rounded-md p-1.5 ${
                        eff === "toolbar" ? "bg-emerald-500/15" : eff === "apps" ? "bg-blue-500/15" : "bg-slate-700/50"
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${
                          eff === "toolbar" ? "text-emerald-400" : eff === "apps" ? "text-blue-400" : "text-slate-500"
                        }`} />
                      </div>
                      <span className="flex-1 text-xs font-medium text-slate-200 truncate">
                        {w.label[lang]}
                      </span>
                      {!w.isRemovable && (
                        <span className="text-[9px] text-slate-600 shrink-0">SYSTEM</span>
                      )}
                    </div>
                    {/* Description */}
                    <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                      {w.description[lang]}
                    </p>
                    {/* Placement badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium ${badge.color}`}>
                        <BadgeIcon className="h-2.5 w-2.5" />
                        {badge.label}
                      </span>
                      {w.isRemovable && (
                        <ChevronRight className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    {isComingSoon && (
                      <span className="absolute top-1 end-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-medium text-amber-300">
                        {wt.appsComingSoon}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {displayGroups.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-slate-500">
            {wt.noResults}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SearchBarContent (collapsed widget bar) ────────────────

export function SearchBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const _t = getTranslations(language);

  if (size < 2) return null;

  return (
    <span className="flex items-center gap-2 truncate text-xs text-slate-400">
      <span className="truncate">{_t.widgets.searchPlaceholder}</span>
      <kbd className="hidden sm:inline-flex shrink-0 h-4 items-center rounded border border-slate-600 bg-slate-700/60 px-1 text-[9px] font-medium text-slate-500">
        {"\u2318"}K
      </kbd>
    </span>
  );
}
