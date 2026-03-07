"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import type { Language } from "@/contexts/SettingsContext";

// ─── Category config ────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────

function groupByCategory(widgets: WidgetDefinition[]) {
  return widgets.reduce<Partial<Record<WidgetCategory, WidgetDefinition[]>>>(
    (acc, w) => {
      (acc[w.category] ??= []).push(w);
      return acc;
    },
    {}
  );
}

function filterByQuery(
  widgets: WidgetDefinition[],
  query: string,
  lang: Language
) {
  if (!query.trim()) return widgets;
  const q = query.toLowerCase();
  return widgets.filter(
    (w) =>
      w.label[lang].toLowerCase().includes(q) ||
      w.description[lang].toLowerCase().includes(q) ||
      w.id.includes(q)
  );
}

// ─── Sub-components ─────────────────────────────────

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

// ─── Grid Card ──────────────────────────────────────

function WidgetCard({
  widget,
  placement,
  language,
  onSelect,
}: {
  widget: WidgetDefinition;
  placement: WidgetPlacement;
  language: Language;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(widget.id)}
      className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-left transition-all hover:border-slate-500 hover:bg-slate-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
          <widget.icon className="h-5 w-5 text-[var(--cc-accent-400)]" />
        </div>
        <TierBadge tier={widget.tier} />
      </div>
      <span className="text-sm font-semibold text-slate-100">
        {widget.label[language]}
      </span>
      <p className="line-clamp-2 text-xs text-slate-500">
        {widget.description[language]}
      </p>
      <PlacementPill placement={placement} language={language} />
    </button>
  );
}

// ─── List Row (old library style) ───────────────────

function WidgetRow({
  widget,
  placement,
  language,
  onSelect,
  onCyclePlacement,
}: {
  widget: WidgetDefinition;
  placement: WidgetPlacement;
  language: Language;
  onSelect: (id: string) => void;
  onCyclePlacement: (id: string) => void;
}) {
  const size = useWidgets().widgetSizes[widget.id] ?? widget.defaultSize;
  const isEnabled = placement !== "disabled";

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-700/30">
      <button
        type="button"
        onClick={() => onSelect(widget.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <widget.icon className="h-4 w-4 shrink-0 text-slate-400" />
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
      {/* Toggle — cycles: toolbar → apps → disabled → toolbar */}
      {widget.isRemovable ? (
        <button
          type="button"
          onClick={() => onCyclePlacement(widget.id)}
          className={`relative h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
            isEnabled ? "bg-[var(--cc-accent-600)]" : "bg-slate-600"
          }`}
        >
          <span
            className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      ) : (
        <span className="shrink-0 text-[10px] text-slate-600">
          {language === "he" ? "מערכת" : language === "ru" ? "Системный" : "System"}
        </span>
      )}
    </div>
  );
}

// ─── Coming Soon ────────────────────────────────────

function ComingSoonCard({
  widget,
  language,
}: {
  widget: WidgetDefinition;
  language: Language;
}) {
  const t = getTranslations(language);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 opacity-60">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
        <widget.icon className="h-5 w-5 text-slate-500" />
      </div>
      <span className="text-sm font-semibold text-slate-400">
        {widget.label[language]}
      </span>
      <p className="line-clamp-2 text-xs text-slate-600">
        {widget.description[language]}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-slate-600">
        <Lock className="h-3 w-3" />
        {t.widgets.comingSoon}
      </div>
      <button
        type="button"
        className="mt-1 w-full cursor-not-allowed rounded-md bg-slate-800 py-1.5 text-xs text-slate-600"
        disabled
      >
        {t.widgets.storeNotifyMe}
      </button>
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
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-50">
      <widget.icon className="h-4 w-4 shrink-0 text-slate-500" />
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

// ─── Category Section ───────────────────────────────

function CategorySection({
  category,
  widgets,
  language,
  placements,
  viewMode,
  onSelect,
  onCyclePlacement,
}: {
  category: WidgetCategory;
  widgets: WidgetDefinition[];
  language: Language;
  placements: Record<string, WidgetPlacement>;
  viewMode: ViewMode;
  onSelect: (id: string) => void;
  onCyclePlacement: (id: string) => void;
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
        <div className="grid grid-cols-3 gap-3">
          {widgets.map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              placement={getEffectivePlacement(w.id, placements, w.isRemovable)}
              language={language}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div>
          {widgets.map((w) => (
            <WidgetRow
              key={w.id}
              widget={w}
              placement={getEffectivePlacement(w.id, placements, w.isRemovable)}
              language={language}
              onSelect={onSelect}
              onCyclePlacement={onCyclePlacement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail View ────────────────────────────────────

function WidgetDetailView({
  widgetId,
  language,
  onBack,
}: {
  widgetId: string;
  language: Language;
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
    <div className="p-6">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.widgets.storeBack}
      </button>

      {/* Hero */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-600 bg-slate-700">
          <widget.icon className="h-8 w-8 text-[var(--cc-accent-400)]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">
              {widget.label[language]}
            </h2>
            <TierBadge tier={widget.tier} />
          </div>
          <p className="text-sm text-slate-400">
            {widget.description[language]}
          </p>
        </div>
      </div>

      {/* Placement selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          {t.widgets.storePlacement}
        </label>
        <div className="flex gap-2">
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
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
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

      {/* Size selector — only for non-disabled */}
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
                className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
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

// ─── Tabs ───────────────────────────────────────────

function InstalledTab({
  searchQuery,
  language,
  viewMode,
  onSelect,
  onCyclePlacement,
}: {
  searchQuery: string;
  language: Language;
  viewMode: ViewMode;
  onSelect: (id: string) => void;
  onCyclePlacement: (id: string) => void;
}) {
  const { widgetPlacements, folders, removeFolder, setWidgetPlacement } = useWidgets();
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const ft = (getTranslations(language) as unknown as Record<string, Record<string, string>>).folders;

  const installed = useMemo(
    () =>
      widgetRegistry.filter((w) => {
        if (w.status !== "active") return false;
        const p = getEffectivePlacement(w.id, widgetPlacements, w.isRemovable);
        return p !== "disabled";
      }),
    [widgetPlacements]
  );

  const filtered = filterByQuery(installed, searchQuery, language);
  const byCategory = groupByCategory(filtered);

  return (
    <div className="p-6">
      {CATEGORY_ORDER.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          widgets={byCategory[cat] ?? []}
          language={language}
          placements={widgetPlacements}
          viewMode={viewMode}
          onSelect={onSelect}
          onCyclePlacement={onCyclePlacement}
        />
      ))}

      {/* Folders section */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            📁 {language === "he" ? "תיקיות" : language === "ru" ? "Папки" : "Folders"}
            <span className="text-slate-600">({folders.length})</span>
          </h3>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-3">
              {folders.map((f) => {
                const fPlacement = widgetPlacements[f.id] ?? "toolbar";
                return (
                  <div
                    key={f.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{f.icon}</span>
                      <button
                        type="button"
                        onClick={() => removeFolder(f.id)}
                        className="rounded p-1 text-slate-600 transition-colors hover:bg-slate-700 hover:text-red-400"
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
                      <PlacementPill placement={fPlacement} language={language} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {folders.map((f) => {
                const isEnabled = (widgetPlacements[f.id] ?? "toolbar") !== "disabled";
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-700/30"
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
                        const current = widgetPlacements[f.id] ?? "toolbar";
                        const next = current === "toolbar" ? "disabled" : "toolbar";
                        setWidgetPlacement(f.id, next);
                      }}
                      className={`relative h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                        isEnabled ? "bg-[var(--cc-accent-600)]" : "bg-slate-600"
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

      {/* Create folder button */}
      <button
        type="button"
        onClick={() => setShowFolderCreator(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-600 py-3 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-300"
      >
        <Plus className="h-3.5 w-3.5" />
        {ft?.createFolder || (language === "he" ? "צור תיקיה" : language === "ru" ? "Создать папку" : "Create Folder")}
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

function AvailableTab({
  searchQuery,
  language,
  viewMode,
  onSelect,
  onCyclePlacement,
}: {
  searchQuery: string;
  language: Language;
  viewMode: ViewMode;
  onSelect: (id: string) => void;
  onCyclePlacement: (id: string) => void;
}) {
  const { widgetPlacements } = useWidgets();

  const all = useMemo(
    () => widgetRegistry.filter((w) => w.status === "active"),
    []
  );
  const filtered = filterByQuery(all, searchQuery, language);
  const byCategory = groupByCategory(filtered);

  return (
    <div className="p-6">
      {CATEGORY_ORDER.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          widgets={byCategory[cat] ?? []}
          language={language}
          placements={widgetPlacements}
          viewMode={viewMode}
          onSelect={onSelect}
          onCyclePlacement={onCyclePlacement}
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

function ComingSoonTab({
  searchQuery,
  language,
  viewMode,
}: {
  searchQuery: string;
  language: Language;
  viewMode: ViewMode;
}) {
  const soon = useMemo(
    () => widgetRegistry.filter((w) => w.status === "coming-soon"),
    []
  );
  const filtered = filterByQuery(soon, searchQuery, language);

  return (
    <div className="p-6">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((w) => (
            <ComingSoonCard key={w.id} widget={w} language={language} />
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

// ─── Main Component ─────────────────────────────────

interface WidgetStoreProps {
  onClose: () => void;
}

const TAB_KEYS: StoreTab[] = ["installed", "available", "coming-soon"];

export function WidgetStore({ onClose }: WidgetStoreProps) {
  const { language } = useSettings();
  const { widgetPlacements, setWidgetPlacement } = useWidgets();
  const t = getTranslations(language);
  const trapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const [activeTab, setActiveTab] = useState<StoreTab>("installed");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Cycle placement: toolbar → apps → disabled → toolbar
  const handleCyclePlacement = (id: string) => {
    const widget = getWidgetById(id);
    if (!widget?.isRemovable) return;
    const current = getEffectivePlacement(id, widgetPlacements, widget.isRemovable);
    const cycle: WidgetPlacement[] = ["toolbar", "apps", "disabled"];
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    setWidgetPlacement(id, cycle[nextIdx]);
  };

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

  const tabLabels: Record<StoreTab, string> = {
    installed: `${t.widgets.storeTabInstalled} (${installedCount})`,
    available: `${t.widgets.storeTabAvailable} (${availableCount})`,
    "coming-soon": `${t.widgets.storeTabComingSoon} (${comingSoonCount})`,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-10" role="dialog" aria-modal="true" aria-label={t.widgets.store}>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label={t.widgets.close}
      />
      {/* Modal */}
      <div
        ref={trapRef}
        className="relative z-10 flex w-[min(900px,calc(100vw-2rem))] max-h-[calc(100vh-5rem)] flex-col border border-slate-700 bg-slate-800 shadow-2xl"
        style={{ borderRadius: "var(--cc-radius-lg)" }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-700 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">
              {t.widgets.store}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.widgets.storeSearch}
                dir="ltr"
                iconStart={<Search className="h-4 w-4" />}
              />
            </div>
            {/* View toggle */}
            <div className="flex shrink-0 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title={language === "he" ? "תצוגת רשימה" : language === "ru" ? "Список" : "List view"}
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
                title={language === "he" ? "תצוגת כרטיסים" : language === "ru" ? "Карточки" : "Grid view"}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            {/* Tab pills */}
            <div className="flex shrink-0 rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs font-medium">
              {TAB_KEYS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedWidgetId(null);
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
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {selectedWidgetId ? (
            <WidgetDetailView
              widgetId={selectedWidgetId}
              language={language}
              onBack={() => setSelectedWidgetId(null)}
            />
          ) : (
            <>
              {activeTab === "installed" && (
                <InstalledTab
                  searchQuery={searchQuery}
                  language={language}
                  viewMode={viewMode}
                  onSelect={setSelectedWidgetId}
                  onCyclePlacement={handleCyclePlacement}
                />
              )}
              {activeTab === "available" && (
                <AvailableTab
                  searchQuery={searchQuery}
                  language={language}
                  viewMode={viewMode}
                  onSelect={setSelectedWidgetId}
                  onCyclePlacement={handleCyclePlacement}
                />
              )}
              {activeTab === "coming-soon" && (
                <ComingSoonTab
                  searchQuery={searchQuery}
                  language={language}
                  viewMode={viewMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
