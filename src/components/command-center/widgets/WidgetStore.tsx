"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  ChevronLeft,
  Lock,
  Pin,
  Grid3X3,
  Power,
  List,
  LayoutGrid,
  Plus,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  widgetRegistry,
  getWidgetById,
  getEffectivePlacement,
  type WidgetDefinition,
  type WidgetCategory,
  type WidgetTier,
  type WidgetPlacement,
  type WidgetSize,
} from "./WidgetRegistry";
import { FolderCreator } from "./FolderCreator";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import type { Language } from "@/contexts/SettingsContext";

// ─── State Persistence ──────────────────────────────────

const STORE_STATE_KEY = "cc-widget-store-state";

interface PersistedStoreState {
  activeTab: StoreTab;
  viewMode: ViewMode;
  categoryFilter: CategoryFilter;
  scrollTop: number;
}

function loadStoreState(): Partial<PersistedStoreState> {
  try {
    const raw = localStorage.getItem(STORE_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoreState(patch: Partial<PersistedStoreState>) {
  try {
    const prev = loadStoreState();
    localStorage.setItem(STORE_STATE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {}
}

// ─── Category Config ────────────────────────────────────

const CATEGORY_ORDER: WidgetCategory[] = [
  "basics",
  "productivity",
  "ai_comms",
  "team",
  "analytics",
  "integrations",
];

const CATEGORY_EMOJI: Record<WidgetCategory, string> = {
  basics: "📂",
  productivity: "⚡",
  ai_comms: "🤖",
  team: "👥",
  analytics: "📊",
  integrations: "🔗",
};

const CATEGORY_LABELS: Record<WidgetCategory, { he: string; en: string; ru: string }> = {
  basics: { he: "בסיסיים", en: "Basics", ru: "Основные" },
  productivity: { he: "פרודוקטיביות", en: "Productivity", ru: "Продуктивность" },
  ai_comms: { he: "AI ותקשורת", en: "AI & Communications", ru: "AI и коммуникации" },
  team: { he: "צוות", en: "Team", ru: "Команда" },
  analytics: { he: "אנליטיקס", en: "Analytics", ru: "Аналитика" },
  integrations: { he: "אינטגרציות", en: "Integrations", ru: "Интеграции" },
};

const PLACEMENT_LABELS: Record<WidgetPlacement, { he: string; en: string; ru: string }> = {
  toolbar: { he: "סרגל עליון", en: "Toolbar", ru: "Панель" },
  apps: { he: "אפליקציות", en: "Apps", ru: "Приложения" },
  disabled: { he: "מושבת", en: "Disabled", ru: "Отключено" },
};

const PLACEMENT_DESC: Record<WidgetPlacement, { he: string; en: string; ru: string }> = {
  toolbar: {
    he: "הווידג'ט מוצג בסרגל העליון ותמיד נגיש.",
    en: "Widget appears in the top bar and is always accessible.",
    ru: "Виджет отображается в верхней панели и всегда доступен.",
  },
  apps: {
    he: "הווידג'ט פעיל אבל נגיש רק דרך מגירת האפליקציות.",
    en: "Widget is active but only accessible through the Apps drawer.",
    ru: "Виджет активен, но доступен только через панель приложений.",
  },
  disabled: {
    he: "הווידג'ט כבוי לחלוטין. ללא שימוש במשאבים.",
    en: "Widget is completely off. No resources used.",
    ru: "Виджет полностью отключён. Ресурсы не используются.",
  },
};

const PLACEMENT_ICONS: Record<WidgetPlacement, typeof Pin> = {
  toolbar: Pin,
  apps: Grid3X3,
  disabled: Power,
};

type StoreTab = "installed" | "available" | "coming-soon";
type ViewMode = "list" | "grid";
type CategoryFilter = WidgetCategory | "all";

// ─── Helpers ────────────────────────────────────────────

function groupByCategory(widgets: WidgetDefinition[]) {
  return widgets.reduce<Partial<Record<WidgetCategory, WidgetDefinition[]>>>(
    (acc, w) => {
      (acc[w.category] ??= []).push(w);
      return acc;
    },
    {}
  );
}

function filterWidgets(
  widgets: WidgetDefinition[],
  query: string,
  category: CategoryFilter,
  lang: Language
) {
  let result = widgets;
  if (category !== "all") {
    result = result.filter((w) => w.category === category);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (w) =>
        w.label[lang].toLowerCase().includes(q) ||
        w.description[lang].toLowerCase().includes(q) ||
        w.id.includes(q)
    );
  }
  return result;
}

// ─── Sub-components ─────────────────────────────────────

function TierBadge({ tier }: { tier: WidgetTier }) {
  if (tier === "free") return null;
  const colors: Record<string, string> = {
    pro: "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]",
    business: "bg-amber-900/40 text-amber-300",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${colors[tier]}`}
    >
      {tier}
    </span>
  );
}

function PlacementPill({
  placement,
  language,
}: {
  placement: WidgetPlacement;
  language: Language;
}) {
  const colorMap: Record<WidgetPlacement, string> = {
    toolbar: "text-emerald-400",
    apps: "text-[var(--cc-accent-400)]",
    disabled: "text-slate-600",
  };
  return (
    <span className={`text-[10px] font-medium ${colorMap[placement]}`}>
      {PLACEMENT_LABELS[placement][language]}
    </span>
  );
}

function StatusDot({ placement }: { placement: WidgetPlacement }) {
  const color =
    placement === "toolbar"
      ? "bg-emerald-400"
      : placement === "apps"
        ? "bg-[var(--cc-accent-400)]"
        : "bg-slate-600";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

function QuickToggle({
  enabled,
  removable,
  onToggle,
}: {
  enabled: boolean;
  removable: boolean;
  onToggle: () => void;
}) {
  if (!removable) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-emerald-600" : "bg-slate-600"
      }`}
      aria-label={enabled ? "Disable" : "Enable"}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "left-4" : "left-0.5"
        }`}
      />
    </button>
  );
}

// ─── Category Chips ─────────────────────────────────────

function CategoryChips({
  active,
  onChange,
  language,
  counts,
}: {
  active: CategoryFilter;
  onChange: (cat: CategoryFilter) => void;
  language: Language;
  counts: Partial<Record<WidgetCategory, number>>;
}) {
  const allLabel = (getTranslations(language).widgets as Record<string, string>).categoryAll;
  const totalCount = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          active === "all"
            ? "bg-[var(--cc-accent-600)] text-white"
            : "bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        }`}
      >
        {allLabel} ({totalCount})
      </button>
      {CATEGORY_ORDER.map((cat) => {
        const count = counts[cat] ?? 0;
        if (count === 0) return null;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active === cat
                ? "bg-[var(--cc-accent-600)] text-white"
                : "bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            <span>{CATEGORY_EMOJI[cat]}</span>
            {CATEGORY_LABELS[cat][language]}
            <span className="text-[10px] opacity-60">({count})</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Grid Card ──────────────────────────────────────────

function WidgetCard({
  widget,
  placement,
  language,
  isMobile,
  onSelect,
  onToggle,
}: {
  widget: WidgetDefinition;
  placement: WidgetPlacement;
  language: Language;
  isMobile: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const isEnabled = placement !== "disabled";

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-xl border bg-slate-900 transition-all ${
        isMobile ? "p-3" : "p-4"
      } ${
        isEnabled
          ? "border-slate-700 hover:border-slate-500 hover:bg-slate-800"
          : "border-slate-800 opacity-50"
      }`}
    >
      {/* Toggle top-right */}
      <div className="absolute end-3 top-3">
        <QuickToggle
          enabled={isEnabled}
          removable={widget.isRemovable}
          onToggle={() => onToggle(widget.id)}
        />
        {!widget.isRemovable && (
          <span className="text-[9px] text-slate-600">
            {(getTranslations(language).widgets as Record<string, string>).storeSystem}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(widget.id)}
        className="flex flex-col items-start gap-2 text-start"
      >
        <div
          className={`flex items-center justify-center rounded-xl ${
            isMobile ? "h-9 w-9" : "h-10 w-10"
          } ${isEnabled ? "bg-slate-800" : "bg-slate-800/50"}`}
        >
          <widget.icon
            className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ${
              isEnabled ? "text-[var(--cc-accent-400)]" : "text-slate-600"
            }`}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`${isMobile ? "text-xs" : "text-sm"} font-semibold ${
              isEnabled ? "text-slate-100" : "text-slate-500"
            }`}
          >
            {widget.label[language]}
          </span>
          <TierBadge tier={widget.tier} />
        </div>
        <p
          className={`line-clamp-2 text-xs ${
            isEnabled ? "text-slate-500" : "text-slate-600"
          }`}
        >
          {widget.description[language]}
        </p>
        <div className="flex items-center gap-1.5">
          <StatusDot placement={placement} />
          <PlacementPill placement={placement} language={language} />
        </div>
      </button>
    </div>
  );
}

// ─── List Row ───────────────────────────────────────────

function WidgetRow({
  widget,
  placement,
  language,
  onSelect,
  onToggle,
}: {
  widget: WidgetDefinition;
  placement: WidgetPlacement;
  language: Language;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const size = useWidgets().widgetSizes[widget.id] ?? widget.defaultSize;
  const isEnabled = placement !== "disabled";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-700/30 ${
        !isEnabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(widget.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800">
          <widget.icon
            className={`h-4 w-4 ${
              isEnabled ? "text-[var(--cc-accent-400)]" : "text-slate-600"
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-200">
              {widget.label[language]}
            </span>
            <span className="shrink-0 text-[10px] text-slate-500">
              {size}x
            </span>
            <TierBadge tier={widget.tier} />
          </div>
          <p className="truncate text-xs text-slate-500">
            {widget.description[language]}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-2">
        <StatusDot placement={placement} />
        <QuickToggle
          enabled={isEnabled}
          removable={widget.isRemovable}
          onToggle={() => onToggle(widget.id)}
        />
        {!widget.isRemovable && (
          <span className="shrink-0 text-[10px] text-slate-600">
            {(getTranslations(language).widgets as Record<string, string>).storeSystem}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Coming Soon ────────────────────────────────────────

function ComingSoonCard({
  widget,
  language,
  isMobile,
}: {
  widget: WidgetDefinition;
  language: Language;
  isMobile: boolean;
}) {
  const t = getTranslations(language);
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 opacity-60 ${
        isMobile ? "p-3" : "p-4"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-800 ${
          isMobile ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <widget.icon
          className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-slate-500`}
        />
      </div>
      <span
        className={`${isMobile ? "text-xs" : "text-sm"} font-semibold text-slate-400`}
      >
        {widget.label[language]}
      </span>
      <p className="line-clamp-2 text-xs text-slate-600">
        {widget.description[language]}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-slate-600">
        <Lock className="h-3 w-3" />
        {t.widgets.comingSoon}
      </div>
    </div>
  );
}

function ComingSoonRow({
  widget,
  language,
}: {
  widget: WidgetDefinition;
  language: Language;
}) {
  const t = getTranslations(language);
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-3 opacity-50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800">
        <widget.icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-400">
            {widget.label[language]}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
            <Lock className="h-2.5 w-2.5" />
            {t.widgets.comingSoon}
          </span>
        </div>
        <p className="truncate text-xs text-slate-600">
          {widget.description[language]}
        </p>
      </div>
    </div>
  );
}

// ─── Category Section ───────────────────────────────────

function CategorySection({
  category,
  widgets,
  language,
  placements,
  viewMode,
  isMobile,
  onSelect,
  onToggle,
}: {
  category: WidgetCategory;
  widgets: WidgetDefinition[];
  language: Language;
  placements: Record<string, WidgetPlacement>;
  viewMode: ViewMode;
  isMobile: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  if (widgets.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        <span>{CATEGORY_EMOJI[category]}</span>
        {CATEGORY_LABELS[category][language]}
        <span className="text-slate-600">({widgets.length})</span>
      </h3>
      {viewMode === "grid" ? (
        <div
          className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}
        >
          {widgets.map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              placement={getEffectivePlacement(
                w.id,
                placements,
                w.isRemovable
              )}
              language={language}
              isMobile={isMobile}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : (
        <div>
          {widgets.map((w) => (
            <WidgetRow
              key={w.id}
              widget={w}
              placement={getEffectivePlacement(
                w.id,
                placements,
                w.isRemovable
              )}
              language={language}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail View ────────────────────────────────────────

function WidgetDetailView({
  widgetId,
  language,
  isMobile,
  onBack,
}: {
  widgetId: string;
  language: Language;
  isMobile: boolean;
  onBack: () => void;
}) {
  const t = getTranslations(language);
  const { widgetPlacements, widgetSizes, setWidgetPlacement, setWidgetSize } =
    useWidgets();

  const widget = getWidgetById(widgetId);
  if (!widget) return null;

  const placement = getEffectivePlacement(
    widgetId,
    widgetPlacements,
    widget.isRemovable
  );
  const currentSize = widgetSizes[widgetId] ?? widget.defaultSize;

  return (
    <div className={isMobile ? "p-4" : "p-6"}>
      {/* Back — desktop only (mobile uses header back button) */}
      {!isMobile && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.widgets.storeBack}
        </button>
      )}

      {/* Hero */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl border border-slate-600 bg-slate-700 ${
            isMobile ? "h-14 w-14" : "h-16 w-16"
          }`}
        >
          <widget.icon
            className={`${isMobile ? "h-7 w-7" : "h-8 w-8"} text-[var(--cc-accent-400)]`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className={`${isMobile ? "text-base" : "text-lg"} font-bold text-slate-100`}
            >
              {widget.label[language]}
            </h2>
            <TierBadge tier={widget.tier} />
          </div>
          <p className="text-sm text-slate-400">
            {widget.description[language]}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <StatusDot placement={placement} />
            <PlacementPill placement={placement} language={language} />
          </div>
        </div>
      </div>

      {/* Placement selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          {t.widgets.storePlacement}
        </label>
        <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
          {(["toolbar", "apps", "disabled"] as const).map((p) => {
            const isDisabledOption = p === "disabled" && !widget.isRemovable;
            const Icon = PLACEMENT_ICONS[p];
            return (
              <button
                key={p}
                type="button"
                disabled={isDisabledOption}
                onClick={() =>
                  !isDisabledOption && setWidgetPlacement(widgetId, p)
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                  placement === p
                    ? "border-[var(--cc-accent-500)] bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                } ${isDisabledOption ? "cursor-not-allowed opacity-30" : ""}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {PLACEMENT_LABELS[p][language]}
              </button>
            );
          })}
        </div>
        {!widget.isRemovable && (
          <p className="mt-2 text-xs text-slate-600">
            {t.widgets.storeSystemWidget}
          </p>
        )}
      </div>

      {/* Size selector */}
      {placement !== "disabled" && (
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {t.widgets.size}
          </label>
          <div className="flex gap-1">
            {([1, 2, 3, 4] as WidgetSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setWidgetSize(widgetId, s)}
                className={`flex-1 rounded px-2 py-2 text-xs font-medium transition-colors ${
                  currentSize === s
                    ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Placement description */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
        {PLACEMENT_DESC[placement][language]}
      </div>
    </div>
  );
}

// ─── Tab Content: Installed ─────────────────────────────

function InstalledContent({
  searchQuery,
  categoryFilter,
  language,
  viewMode,
  isMobile,
  onSelect,
  onToggle,
}: {
  searchQuery: string;
  categoryFilter: CategoryFilter;
  language: Language;
  viewMode: ViewMode;
  isMobile: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const { widgetPlacements, folders, removeFolder, setWidgetPlacement } =
    useWidgets();
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const ft = (
    getTranslations(language) as unknown as Record<
      string,
      Record<string, string>
    >
  ).folders;

  const installed = useMemo(
    () =>
      widgetRegistry.filter((w) => {
        if (w.status !== "active") return false;
        const p = getEffectivePlacement(
          w.id,
          widgetPlacements,
          w.isRemovable
        );
        return p !== "disabled";
      }),
    [widgetPlacements]
  );

  const filtered = filterWidgets(
    installed,
    searchQuery,
    categoryFilter,
    language
  );
  const byCategory = groupByCategory(filtered);

  return (
    <div className={isMobile ? "p-3" : "p-6"}>
      {CATEGORY_ORDER.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          widgets={byCategory[cat] ?? []}
          language={language}
          placements={widgetPlacements}
          viewMode={viewMode}
          isMobile={isMobile}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            📁{" "}
            {(getTranslations(language).widgets as Record<string, string>).storeFolders}
            <span className="text-slate-600">({folders.length})</span>
          </h3>
          {viewMode === "grid" ? (
            <div
              className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}
            >
              {folders.map((f) => {
                const fPlacement = widgetPlacements[f.id] ?? "toolbar";
                return (
                  <div
                    key={f.id}
                    className={`flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 ${
                      isMobile ? "p-3" : "p-4"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{f.icon}</span>
                      <button
                        type="button"
                        onClick={() => removeFolder(f.id)}
                        className="rounded p-1 text-slate-600 transition-colors hover:bg-slate-700 hover:text-red-400"
                        aria-label={`Remove ${f.label[language]}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">
                      {f.label[language]}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        {f.items.length} {ft?.items}
                      </span>
                      <PlacementPill
                        placement={fPlacement}
                        language={language}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {folders.map((f) => {
                const isEnabled =
                  (widgetPlacements[f.id] ?? "toolbar") !== "disabled";
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-700/30"
                  >
                    <span className="text-base">{f.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-200">
                          {f.label[language]}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-500">
                          {f.items.length} {ft?.items}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current =
                          widgetPlacements[f.id] ?? "toolbar";
                        const next =
                          current === "toolbar" ? "disabled" : "toolbar";
                        setWidgetPlacement(f.id, next);
                      }}
                      className={`relative h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                        isEnabled
                          ? "bg-[var(--cc-accent-600)]"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          isEnabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFolder(f.id)}
                      className="text-slate-600 transition-colors hover:text-red-400"
                      aria-label={`Remove ${f.label[language]}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create folder */}
      <button
        type="button"
        onClick={() => setShowFolderCreator(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-600 py-3 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-300"
      >
        <Plus className="h-3.5 w-3.5" />
        {ft?.createFolder || (getTranslations(language).widgets as Record<string, string>).storeCreateFolder}
      </button>

      {showFolderCreator && (
        <FolderCreator onClose={() => setShowFolderCreator(false)} />
      )}

      {filtered.length === 0 && folders.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          {getTranslations(language).widgets.storeNoResults}
        </p>
      )}
    </div>
  );
}

// ─── Tab Content: Available ─────────────────────────────

function AvailableContent({
  searchQuery,
  categoryFilter,
  language,
  viewMode,
  isMobile,
  onSelect,
  onToggle,
}: {
  searchQuery: string;
  categoryFilter: CategoryFilter;
  language: Language;
  viewMode: ViewMode;
  isMobile: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const { widgetPlacements } = useWidgets();

  const all = useMemo(
    () => widgetRegistry.filter((w) => w.status === "active"),
    []
  );
  const filtered = filterWidgets(all, searchQuery, categoryFilter, language);
  const byCategory = groupByCategory(filtered);

  return (
    <div className={isMobile ? "p-3" : "p-6"}>
      {CATEGORY_ORDER.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          widgets={byCategory[cat] ?? []}
          language={language}
          placements={widgetPlacements}
          viewMode={viewMode}
          isMobile={isMobile}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          {getTranslations(language).widgets.storeNoResults}
        </p>
      )}
    </div>
  );
}

// ─── Tab Content: Coming Soon ───────────────────────────

function ComingSoonContent({
  searchQuery,
  categoryFilter,
  language,
  viewMode,
  isMobile,
}: {
  searchQuery: string;
  categoryFilter: CategoryFilter;
  language: Language;
  viewMode: ViewMode;
  isMobile: boolean;
}) {
  const soon = useMemo(
    () => widgetRegistry.filter((w) => w.status === "coming-soon"),
    []
  );
  const filtered = filterWidgets(soon, searchQuery, categoryFilter, language);

  return (
    <div className={isMobile ? "p-3" : "p-6"}>
      {viewMode === "grid" ? (
        <div
          className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}
        >
          {filtered.map((w) => (
            <ComingSoonCard
              key={w.id}
              widget={w}
              language={language}
              isMobile={isMobile}
            />
          ))}
        </div>
      ) : (
        <div>
          {filtered.map((w) => (
            <ComingSoonRow key={w.id} widget={w} language={language} />
          ))}
        </div>
      )}
      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          {getTranslations(language).widgets.storeNoResults}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

interface WidgetStoreProps {
  onClose: () => void;
}

const TAB_KEYS: StoreTab[] = ["installed", "available", "coming-soon"];

export function WidgetStore({ onClose }: WidgetStoreProps) {
  const { language } = useSettings();
  const { widgetPlacements, setWidgetPlacement } = useWidgets();
  const t = getTranslations(language);
  const trapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore persisted state
  const savedState = useMemo(() => loadStoreState(), []);
  const [activeTab, setActiveTab] = useState<StoreTab>(
    savedState.activeTab || "installed"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    savedState.viewMode || (isMobile ? "grid" : "list")
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    savedState.categoryFilter || "all"
  );

  // Save state changes
  useEffect(() => {
    saveStoreState({ activeTab, viewMode, categoryFilter });
  }, [activeTab, viewMode, categoryFilter]);

  // Restore scroll position on mount
  useEffect(() => {
    const saved = loadStoreState();
    if (saved.scrollTop && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = saved.scrollTop!;
      });
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    const ref = scrollRef.current;
    return () => {
      if (ref) saveStoreState({ scrollTop: ref.scrollTop });
    };
  }, []);

  // Quick toggle: enabled → disabled, disabled → toolbar
  const handleQuickToggle = useCallback(
    (id: string) => {
      const widget = getWidgetById(id);
      if (!widget?.isRemovable) return;
      const current = getEffectivePlacement(
        id,
        widgetPlacements,
        widget.isRemovable
      );
      setWidgetPlacement(id, current === "disabled" ? "toolbar" : "disabled");
    },
    [widgetPlacements, setWidgetPlacement]
  );

  // Tab counts
  const installedCount = useMemo(
    () =>
      widgetRegistry.filter((w) => {
        if (w.status !== "active") return false;
        return (
          getEffectivePlacement(w.id, widgetPlacements, w.isRemovable) !==
          "disabled"
        );
      }).length,
    [widgetPlacements]
  );
  const availableCount = widgetRegistry.filter(
    (w) => w.status === "active"
  ).length;
  const comingSoonCount = widgetRegistry.filter(
    (w) => w.status === "coming-soon"
  ).length;

  // Category counts for the active tab
  const categoryCounts = useMemo(() => {
    const widgets =
      activeTab === "installed"
        ? widgetRegistry.filter(
            (w) =>
              w.status === "active" &&
              getEffectivePlacement(w.id, widgetPlacements, w.isRemovable) !==
                "disabled"
          )
        : activeTab === "available"
          ? widgetRegistry.filter((w) => w.status === "active")
          : widgetRegistry.filter((w) => w.status === "coming-soon");
    const counts: Partial<Record<WidgetCategory, number>> = {};
    for (const w of widgets) {
      counts[w.category] = (counts[w.category] ?? 0) + 1;
    }
    return counts;
  }, [activeTab, widgetPlacements]);

  const tabLabels: Record<StoreTab, string> = {
    installed: `${t.widgets.storeTabInstalled} (${installedCount})`,
    available: `${t.widgets.storeTabAvailable} (${availableCount})`,
    "coming-soon": `${t.widgets.storeTabComingSoon} (${comingSoonCount})`,
  };

  // ─── Shared Header ──────────────────────────────────
  const headerContent = (
    <>
      {/* Title bar */}
      <div
        className={`flex items-center justify-between ${
          isMobile ? "h-12 px-4" : "mb-3"
        }`}
      >
        {isMobile && selectedWidgetId ? (
          <button
            type="button"
            onClick={() => setSelectedWidgetId(null)}
            className="flex items-center gap-1.5 text-sm text-slate-400 active:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t.widgets.storeBack}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <h2
              className={`font-semibold text-slate-100 ${
                isMobile ? "text-sm" : "text-base"
              }`}
            >
              {t.widgets.store}
            </h2>
            <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              {installedCount}{" "}
              {t.widgets.storeActiveCount}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!selectedWidgetId && (
        <>
          {/* Search + controls */}
          <div
            className={
              isMobile ? "space-y-2 px-4 pb-2" : "flex items-center gap-3"
            }
          >
            <div className={isMobile ? "" : "flex-1"}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.widgets.storeSearch}
                dir="ltr"
                iconStart={<Search className="h-4 w-4" />}
              />
            </div>
            <div
              className={`flex items-center gap-2 ${isMobile ? "" : "shrink-0"}`}
            >
              {/* View toggle */}
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              {/* Tab pills — desktop only */}
              {!isMobile && (
                <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs font-medium">
                  {TAB_KEYS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedWidgetId(null);
                        setCategoryFilter("all");
                      }}
                      className={`rounded-md px-3 py-1.5 transition-colors ${
                        activeTab === tab
                          ? "bg-slate-700 text-slate-100"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tabLabels[tab]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div className={isMobile ? "px-4 pb-2" : "mt-3"}>
            <CategoryChips
              active={categoryFilter}
              onChange={setCategoryFilter}
              language={language}
              counts={categoryCounts}
            />
          </div>

          {/* Tab bar — mobile only */}
          {isMobile && (
            <div className="flex border-t border-slate-700/50">
              {TAB_KEYS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedWidgetId(null);
                    setCategoryFilter("all");
                  }}
                  className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-[var(--cc-accent-500)] text-slate-100"
                      : "text-slate-500"
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );

  // ─── Shared Body ────────────────────────────────────
  const bodyContent = (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      {selectedWidgetId ? (
        <WidgetDetailView
          widgetId={selectedWidgetId}
          language={language}
          isMobile={isMobile}
          onBack={() => setSelectedWidgetId(null)}
        />
      ) : (
        <>
          {activeTab === "installed" && (
            <InstalledContent
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              language={language}
              viewMode={viewMode}
              isMobile={isMobile}
              onSelect={setSelectedWidgetId}
              onToggle={handleQuickToggle}
            />
          )}
          {activeTab === "available" && (
            <AvailableContent
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              language={language}
              viewMode={viewMode}
              isMobile={isMobile}
              onSelect={setSelectedWidgetId}
              onToggle={handleQuickToggle}
            />
          )}
          {activeTab === "coming-soon" && (
            <ComingSoonContent
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              language={language}
              viewMode={viewMode}
              isMobile={isMobile}
            />
          )}
        </>
      )}
    </div>
  );

  // ─── Mobile: Full-screen (portaled to escape stacking context) ──
  if (isMobile) {
    return createPortal(
      <div
        ref={trapRef}
        className="fixed inset-0 z-[9999] flex flex-col bg-slate-900"
        style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label={t.widgets.store}
      >
        <div className="shrink-0 border-b border-slate-700 bg-slate-800">
          {headerContent}
        </div>
        {bodyContent}
      </div>,
      document.body
    );
  }

  // ─── Desktop: Centered modal ────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-10"
      role="dialog"
      aria-modal="true"
      aria-label={t.widgets.store}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label={t.widgets.close}
      />
      <div
        ref={trapRef}
        className="relative z-10 flex max-h-[calc(100vh-5rem)] w-[min(900px,calc(100vw-2rem))] flex-col border border-slate-700 bg-slate-800 shadow-2xl"
        style={{ borderRadius: "var(--cc-radius-lg)" }}
      >
        <div className="shrink-0 border-b border-slate-700 px-6 py-4">
          {headerContent}
        </div>
        {bodyContent}
      </div>
    </div>
  );
}
