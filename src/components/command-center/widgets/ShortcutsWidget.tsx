"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, Search, ChevronDown, ChevronUp, Trash2, Bot, Loader2 } from "lucide-react";
import { useShortcuts, type ResolvedShortcut } from "@/contexts/ShortcutsContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { formatComboForDisplay, isMac } from "@/lib/shortcuts/shortcutEngine";
import { SHORTCUT_CATEGORIES, type ShortcutCategory } from "@/lib/shortcuts/shortcutRegistry";
import type { WidgetSize } from "./WidgetRegistry";

// ─── Panel (modal overlay) ──────────────────────────────────

export function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const wt = t.widgets;
  const { shortcuts, toggleShortcut, deleteCustomShortcut, resetToDefaults } = useShortcuts();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"active" | "all">("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Filter shortcuts
  const filtered = useMemo(() => {
    let list = shortcuts;

    if (tab === "active") {
      list = list.filter((sc) => sc.isActive);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (sc) =>
          sc.displayName.he.toLowerCase().includes(q) ||
          sc.displayName.en.toLowerCase().includes(q) ||
          sc.keyCombo.toLowerCase().includes(q)
      );
    }

    return list;
  }, [shortcuts, tab, query]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<ShortcutCategory, ResolvedShortcut[]>();
    for (const sc of filtered) {
      const existing = map.get(sc.category) || [];
      existing.push(sc);
      map.set(sc.category, existing);
    }
    return map;
  }, [filtered]);

  // Flat list of visible shortcut IDs (for keyboard nav)
  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    for (const cat of SHORTCUT_CATEGORIES) {
      const items = grouped.get(cat.id);
      if (!items || items.length === 0) continue;
      if (collapsedCategories.has(cat.id)) continue;
      for (const sc of [...items].sort((a, b) => a.sortOrder - b.sortOrder)) {
        ids.push(sc.id);
      }
    }
    return ids;
  }, [grouped, collapsedCategories]);

  // Keyboard navigation: Escape, ↑↓, Space
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      // Only handle nav keys when not typing in search
      const inSearch = (e.target as HTMLElement).tagName === "INPUT";

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedId((prev) => {
          const idx = prev ? visibleIds.indexOf(prev) : -1;
          const next = idx < visibleIds.length - 1 ? visibleIds[idx + 1] : visibleIds[0];
          return next ?? null;
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedId((prev) => {
          const idx = prev ? visibleIds.indexOf(prev) : 0;
          const next = idx > 0 ? visibleIds[idx - 1] : visibleIds[visibleIds.length - 1];
          return next ?? null;
        });
        return;
      }

      if (e.key === " " && !inSearch && focusedId) {
        e.preventDefault();
        const sc = filtered.find((s) => s.id === focusedId);
        if (sc && !sc.isReserved) toggleShortcut(focusedId);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose, visibleIds, focusedId, filtered, toggleShortcut]);

  // Scroll focused row into view
  useEffect(() => {
    if (!focusedId || !bodyRef.current) return;
    const el = bodyRef.current.querySelector(`[data-shortcut-id="${focusedId}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [focusedId]);

  const activeCount = shortcuts.filter((sc) => sc.isActive).length;
  const totalCount = shortcuts.length;

  const toggleCategory = useCallback((catId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-16" role="dialog" aria-modal="true" aria-label={wt.keyboardShortcuts || "Keyboard Shortcuts"}>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
      />

      {/* Panel */}
      <div className="relative z-10 flex w-[400px] flex-col border border-slate-700 bg-slate-800 shadow-2xl" style={{ borderRadius: "var(--cc-radius-lg)", maxHeight: "80vh" }}>
        {/* Header */}
        <div className="border-b border-slate-700 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <span>⌨️</span>
              {(wt as Record<string, string>).keyboardShortcuts || "Keyboard Shortcuts"}
            </h3>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-slate-600 bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                Esc
              </kbd>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={(wt as Record<string, string>).shortcutsSearch || "Search shortcuts..."}
              className="w-full rounded-lg bg-slate-700/50 py-2 pe-3 ps-8 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
              autoFocus
            />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-700">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === "active"
                ? "border-b-2 border-[var(--cc-accent-500)] text-[var(--cc-accent-300)]"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {(wt as Record<string, string>).shortcutsActive || "Active"} ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === "all"
                ? "border-b-2 border-[var(--cc-accent-500)] text-[var(--cc-accent-300)]"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {(wt as Record<string, string>).shortcutsAll || "All"} ({totalCount})
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto">
          {grouped.size === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              {(wt as Record<string, string>).shortcutsNoResults || "No shortcuts found"}
            </div>
          ) : (
            SHORTCUT_CATEGORIES.map((cat) => {
              const items = grouped.get(cat.id);
              if (!items || items.length === 0) return null;
              const isCollapsed = collapsedCategories.has(cat.id);
              const catActiveCount = items.filter((sc) => sc.isActive).length;

              return (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  shortcuts={items}
                  isCollapsed={isCollapsed}
                  activeCount={catActiveCount}
                  onToggleCollapse={() => toggleCategory(cat.id)}
                  onToggleShortcut={toggleShortcut}
                  onDelete={deleteCustomShortcut}
                  language={language}
                  focusedId={focusedId}
                />
              );
            })
          )}
        </div>

        {/* AI Suggestion */}
        <AiSuggestionBar language={language} />

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-700 px-4 py-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded px-2 py-1 text-[10px] text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          >
            {(wt as Record<string, string>).shortcutsReset || "Reset to Defaults"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Section ───────────────────────────────────────

function CategorySection({
  category,
  shortcuts,
  isCollapsed,
  activeCount,
  onToggleCollapse,
  onToggleShortcut,
  onDelete,
  language,
  focusedId,
}: {
  category: (typeof SHORTCUT_CATEGORIES)[number];
  shortcuts: ResolvedShortcut[];
  isCollapsed: boolean;
  activeCount: number;
  onToggleCollapse: () => void;
  onToggleShortcut: (id: string) => void;
  onDelete: (id: string) => void;
  language: "he" | "en" | "ru";
  focusedId?: string | null;
}) {
  const Icon = category.icon;

  return (
    <div className="border-b border-slate-700/50">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-slate-700/30"
      >
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-300">
          {category.label[language]}
        </span>
        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
          {activeCount}
        </span>
        <span className="ms-auto">
          {isCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
          )}
        </span>
      </button>

      {!isCollapsed && (
        <div className="pb-1">
          {shortcuts
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((sc) => (
              <ShortcutRow
                key={sc.id}
                shortcut={sc}
                onToggle={() => onToggleShortcut(sc.id)}
                onDelete={sc.isCustom ? () => onDelete(sc.id) : undefined}
                language={language}
                isFocused={focusedId === sc.id}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Shortcut Row ───────────────────────────────────────────

function ShortcutRow({
  shortcut,
  onToggle,
  onDelete,
  language,
  isFocused,
}: {
  shortcut: ResolvedShortcut;
  onToggle: () => void;
  onDelete?: () => void;
  language: "he" | "en" | "ru";
  isFocused?: boolean;
}) {
  return (
    <div
      data-shortcut-id={shortcut.id}
      className={`flex items-center gap-3 px-4 py-1.5 transition-colors ${
        isFocused ? "bg-slate-700/50" : "hover:bg-slate-700/30"
      } ${shortcut.isActive && !shortcut.isReserved ? "" : "opacity-40"}`}
    >
      {/* Key combo badge */}
      <KeyBadge combo={shortcut.keyCombo} />

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-xs text-slate-300">
        {shortcut.displayName[language]}
      </span>

      {/* Reserved badge */}
      {shortcut.isReserved && (
        <span className="shrink-0 rounded bg-amber-900/40 px-1.5 py-0.5 text-[9px] text-amber-400/80">
          {getTranslations(language).widgets.shortcutsReserved}
        </span>
      )}

      {/* Scope tag (if not global and not reserved) */}
      {!shortcut.isReserved && shortcut.scope !== "global" && (
        <span className="shrink-0 rounded bg-slate-700/70 px-1.5 py-0.5 text-[9px] text-slate-500">
          {shortcut.scope}
        </span>
      )}

      {/* Delete (custom only) */}
      {onDelete && !shortcut.isReserved && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded p-0.5 text-slate-600 transition-colors hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      {/* Toggle (disabled for reserved) */}
      {shortcut.isReserved ? (
        <span className="relative h-4 w-8 shrink-0 rounded-full bg-slate-700 opacity-30" />
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className={`relative h-4 w-8 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
            shortcut.isActive ? "bg-[var(--cc-accent-600)]" : "bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-200 ${
              shortcut.isActive ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      )}
    </div>
  );
}

// ─── AI Suggestion Bar ──────────────────────────────────────

const AI_STUB_RESPONSES: Record<string, { combo: string; label: { he: string; en: string; ru: string } }[]> = {
  save: [{ combo: "Cmd+S", label: { he: "שמור מסמך", en: "Save Document", ru: "Сохранить документ" } }],
  search: [{ combo: "Ctrl+K", label: { he: "חיפוש", en: "Search", ru: "Поиск" } }],
  undo: [{ combo: "Cmd+Z", label: { he: "בטל", en: "Undo", ru: "Отменить" } }],
  create: [{ combo: "Ctrl+Shift+N", label: { he: "יצירה מהירה", en: "Quick Create", ru: "Быстрое создание" } }],
};

function AiSuggestionBar({ language }: { language: "he" | "en" | "ru" }) {
  const t = getTranslations(language);
  const wt = t.widgets;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      setLoading(true);
      setSuggestion(null);

      // Simulate AI response with typing delay
      const q = input.toLowerCase();
      const match = Object.keys(AI_STUB_RESPONSES).find((k) => q.includes(k));
      const result = match
        ? AI_STUB_RESPONSES[match]
        : [{ combo: "Cmd+Shift+?", label: { he: "פעולה מותאמת", en: "Custom Action", ru: "Пользовательское действие" } }];

      const tryWord = { he: "נסה", en: "Try", ru: "Попробуйте" }[language] || "Try";
      const text = `💡 ${tryWord} ${result[0].combo} — ${result[0].label[language]}`;

      // Typing animation
      let i = 0;
      const timer = setInterval(() => {
        i++;
        setSuggestion(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timer);
          setLoading(false);
        }
      }, 25);
    },
    [input, loading, language]
  );

  return (
    <div className="border-t border-slate-700 px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-2">
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--cc-accent-400)]" />
        ) : (
          <Bot className="h-4 w-4 shrink-0 text-slate-500" />
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={(wt as Record<string, string>).shortcutsAiSuggest || "Describe an action you want to shortcut..."}
          className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
        />
      </form>
      {suggestion ? (
        <p className="mt-1.5 text-center text-[11px] text-[var(--cc-accent-300)]">
          {suggestion}
        </p>
      ) : (
        <p className="mt-1 text-center text-[10px] text-slate-600">
          {(wt as Record<string, string>).shortcutsAiPlaceholder || "AI will suggest keyboard shortcuts"}
        </p>
      )}
    </div>
  );
}

// ─── Key Badge ──────────────────────────────────────────────

function KeyBadge({ combo }: { combo: string }) {
  const keys = formatComboForDisplay(combo);
  return (
    <span className="flex shrink-0 items-center gap-0.5" dir="ltr">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-slate-600 bg-slate-700 px-1.5 text-[10px] font-medium text-slate-300"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

// ─── Bar Content ────────────────────────────────────────────

export function ShortcutsBarContent({ size }: { size: WidgetSize }) {
  const [mac, setMac] = useState(true);

  useEffect(() => {
    setMac(isMac());
  }, []);

  if (size < 2) return null;

  return (
    <span className="truncate text-xs text-slate-400" dir="ltr">
      {mac ? "⌘/" : "Ctrl+/"}
    </span>
  );
}
