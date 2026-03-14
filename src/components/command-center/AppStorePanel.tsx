"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Lock,
  Unlock,
  LayoutList,
  Timer,
} from "lucide-react";
import {
  widgetRegistry,
  getEffectivePlacement,
  type WidgetDefinition,
  type WidgetCategory,
  type WidgetPlacement,
  type WidgetSize,
} from "./widgets/WidgetRegistry";
import { useWidgets, type TopBarDisplayMode, type HoverDelay } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { IconPicker, IconDisplay } from "@/components/ui/IconPicker";

// ─── Category labels ───────────────────────────────

const CATEGORY_LABELS: Record<WidgetCategory, { he: string; en: string; ru: string }> = {
  basics: { he: "בסיסי", en: "Basics", ru: "Основные" },
  productivity: { he: "פרודוקטיביות", en: "Productivity", ru: "Продуктивность" },
  ai_comms: { he: "AI ותקשורת", en: "AI & Comms", ru: "AI и связь" },
  team: { he: "צוות", en: "Team", ru: "Команда" },
  analytics: { he: "אנליטיקה", en: "Analytics", ru: "Аналитика" },
  integrations: { he: "אינטגרציות", en: "Integrations", ru: "Интеграции" },
};

const PLACEMENT_LABELS: Record<WidgetPlacement, { he: string; en: string; ru: string }> = {
  toolbar: { he: "בסרגל", en: "Toolbar", ru: "Панель" },
  apps: { he: "אפליקציות", en: "Apps", ru: "Приложения" },
  disabled: { he: "מוסתר", en: "Hidden", ru: "Скрыто" },
};

const LOCKS_KEY = "cc-widget-locks";

function loadLocks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveLocks(locks: Record<string, boolean>) {
  localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
}

// ─── Component ─────────────────────────────────────

interface AppStorePanelProps {
  onClose: () => void;
}

export function AppStorePanel({ onClose }: AppStorePanelProps) {
  const {
    widgetPlacements,
    widgetSizes,
    setWidgetPlacement,
    setWidgetSize,
    widgetLabels,
    setWidgetLabel,
    clearWidgetLabel,
    widgetPanelModes,
    setWidgetPanelMode,
    widgetIcons,
    setWidgetIcon,
    clearWidgetIcon,
    displayMode,
    setDisplayMode,
    hoverDelay,
    setHoverDelay,
  } = useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);
  const sb = t.smartBar;

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<WidgetCategory | "all">("all");
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    setLocks(loadLocks());
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const lowerQuery = query.toLowerCase();

  const filteredWidgets = useMemo(() => {
    return widgetRegistry
      .filter((w) => w.status === "active")
      .filter((w) => categoryFilter === "all" || w.category === categoryFilter)
      .filter((w) => {
        if (!lowerQuery) return true;
        return (
          w.label.he.toLowerCase().includes(lowerQuery) ||
          w.label.en.toLowerCase().includes(lowerQuery) ||
          w.label.ru.toLowerCase().includes(lowerQuery) ||
          w.id.toLowerCase().includes(lowerQuery)
        );
      });
  }, [lowerQuery, categoryFilter]);

  const selectedWidget = selectedId
    ? widgetRegistry.find((w) => w.id === selectedId)
    : null;

  const categories: (WidgetCategory | "all")[] = [
    "all",
    "basics",
    "productivity",
    "ai_comms",
    "team",
    "analytics",
    "integrations",
  ];

  const toggleLock = (widgetId: string) => {
    setLocks((prev) => {
      const next = { ...prev, [widgetId]: !prev[widgetId] };
      saveLocks(next);
      // Sync with TopBar via DOM event
      window.dispatchEvent(new CustomEvent("cc-widget-locks-change", { detail: next }));
      return next;
    });
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50"
        aria-label="Close"
      />

      {/* Split Panel */}
      <div className="fixed inset-x-8 inset-y-12 z-50 mx-auto flex max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl md:inset-x-auto md:w-[56rem]">
        {/* Left: Widget List */}
        <div className="flex w-1/2 flex-col border-r border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-200">
              {sb?.pinnedStore || "Widget Store"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={sb?.searchShortcuts || "Search..."}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 py-1.5 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto px-4 pb-2">
            {categories.map((cat) => {
              const label = cat === "all"
                ? (language === "he" ? "הכל" : language === "ru" ? "Все" : "All")
                : CATEGORY_LABELS[cat][language];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-[var(--cc-accent-600)] text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Widget list */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredWidgets.map((w) => {
              const Icon = w.icon;
              const placement = getEffectivePlacement(w.id, widgetPlacements, w.isRemovable);
              const isSelected = selectedId === w.id;
              const isLocked = locks[w.id];
              const customIcon = widgetIcons[w.id];

              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedId(w.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors ${
                    isSelected
                      ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-[var(--cc-accent-600-30)]" : "bg-slate-800"
                  }`}>
                    {customIcon ? (
                      <IconDisplay value={customIcon} size={16} />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{w.label[language]}</div>
                    <div className="truncate text-[11px] text-slate-500">{w.description[language]}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isLocked && <Lock size={10} className="text-amber-400" />}
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                      placement === "toolbar"
                        ? "bg-emerald-600/20 text-emerald-400"
                        : placement === "apps"
                          ? "bg-blue-600/20 text-blue-400"
                          : "bg-slate-700 text-slate-500"
                    }`}>
                      {PLACEMENT_LABELS[placement][language]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Settings */}
        <div className="flex w-1/2 flex-col overflow-y-auto">
          {/* ── Bar Settings (always visible, not per-widget) ── */}
          <div className="border-b border-slate-700 px-5 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {sb?.barSettings || "Bar Settings"}
            </h3>
            <div className="space-y-3">
              {/* Display Mode */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <LayoutList size={13} />
                  {language === "he" ? "מצב תצוגה" : language === "ru" ? "Режим" : "Display Mode"}
                </label>
                <div className="flex gap-2">
                  {(["normal", "compact", "icons-only"] as TopBarDisplayMode[]).map((mode) => {
                    const mLabel = mode === "normal"
                      ? (language === "he" ? "רגיל" : language === "ru" ? "Обычный" : "Normal")
                      : mode === "compact"
                        ? (language === "he" ? "צפוף" : language === "ru" ? "Компактный" : "Compact")
                        : (language === "he" ? "אייקונים" : language === "ru" ? "Иконки" : "Icons");
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDisplayMode(mode)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          displayMode === mode
                            ? "bg-[var(--cc-accent-600)] text-white"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {mLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hover Delay */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Timer size={13} />
                  {language === "he" ? "השהיית ריחוף" : language === "ru" ? "Задержка" : "Hover Delay"}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["none", 0.1, 0.3, 0.5, 1, 2] as HoverDelay[]).map((d) => (
                    <button
                      key={String(d)}
                      type="button"
                      onClick={() => setHoverDelay(d)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        hoverDelay === d
                          ? "bg-[var(--cc-accent-600)] text-white"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {d === "none" ? "Off" : `${d}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Per-widget settings ── */}
          {selectedWidget ? (
            <WidgetSettingsPane
              widget={selectedWidget}
              language={language}
              placement={getEffectivePlacement(selectedWidget.id, widgetPlacements, selectedWidget.isRemovable)}
              size={widgetSizes[selectedWidget.id] ?? selectedWidget.defaultSize}
              panelMode={widgetPanelModes[selectedWidget.id] || selectedWidget.panelMode || "dropdown"}
              customLabel={widgetLabels[selectedWidget.id]?.[language] || ""}
              customIcon={widgetIcons[selectedWidget.id] || ""}
              isLocked={!!locks[selectedWidget.id]}
              onPlacementChange={(p) => setWidgetPlacement(selectedWidget.id, p)}
              onSizeChange={(s) => setWidgetSize(selectedWidget.id, s)}
              onPanelModeChange={(m) => setWidgetPanelMode(selectedWidget.id, m)}
              onLabelChange={(label) => {
                if (label) {
                  setWidgetLabel(selectedWidget.id, { [language]: label });
                } else {
                  clearWidgetLabel(selectedWidget.id);
                }
              }}
              onIconChange={(icon) => {
                if (icon) {
                  setWidgetIcon(selectedWidget.id, icon);
                } else {
                  clearWidgetIcon(selectedWidget.id);
                }
              }}
              onToggleLock={() => toggleLock(selectedWidget.id)}
              translations={sb}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              {language === "he" ? "בחר ווידג׳ט לצפייה בהגדרות" : language === "ru" ? "Выберите виджет" : "Select a widget to configure"}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Widget Settings Pane (right half, below bar settings) ──

interface WidgetSettingsPaneProps {
  widget: WidgetDefinition;
  language: "he" | "en" | "ru";
  placement: WidgetPlacement;
  size: WidgetSize;
  panelMode: string;
  customLabel: string;
  customIcon: string;
  isLocked: boolean;
  onPlacementChange: (p: WidgetPlacement) => void;
  onSizeChange: (s: WidgetSize) => void;
  onPanelModeChange: (m: "dropdown" | "side-panel" | "popup") => void;
  onLabelChange: (label: string) => void;
  onIconChange: (icon: string) => void;
  onToggleLock: () => void;
  translations: Record<string, string>;
}

function WidgetSettingsPane({
  widget,
  language,
  placement,
  size,
  panelMode,
  customLabel,
  customIcon,
  isLocked,
  onPlacementChange,
  onSizeChange,
  onPanelModeChange,
  onLabelChange,
  onIconChange,
  onToggleLock,
  translations: sb,
}: WidgetSettingsPaneProps) {
  const Icon = widget.icon;

  return (
    <div className="flex flex-1 flex-col">
      {/* Widget header */}
      <div className="flex items-center gap-3 border-b border-slate-700 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
          {customIcon ? (
            <IconDisplay value={customIcon} size={20} className="text-[var(--cc-accent-400)]" />
          ) : (
            <Icon className="h-5 w-5 text-[var(--cc-accent-400)]" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{widget.label[language]}</h3>
          <p className="text-[11px] text-slate-500">{widget.description[language]}</p>
        </div>
      </div>

      {/* Widget Settings section */}
      <div className="border-b border-slate-700 px-5 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {sb?.widgetSettings || "Widget Settings"}
        </h3>
        <div className="space-y-4">
          {/* Placement */}
          {widget.isRemovable && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                {language === "he" ? "מיקום" : language === "ru" ? "Расположение" : "Placement"}
              </label>
              <div className="flex gap-2">
                {(["toolbar", "apps", "disabled"] as WidgetPlacement[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPlacementChange(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      placement === p
                        ? "bg-[var(--cc-accent-600)] text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {PLACEMENT_LABELS[p][language]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {language === "he" ? "גודל" : language === "ru" ? "Размер" : "Size"}
            </label>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as WidgetSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSizeChange(s)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    size === s
                      ? "bg-[var(--cc-accent-600)] text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Mode */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {language === "he" ? "מצב פאנל" : language === "ru" ? "Режим панели" : "Panel Mode"}
            </label>
            <div className="flex gap-2">
              {(["dropdown", "side-panel", "popup"] as const).map((m) => {
                const mLabel = m === "dropdown"
                  ? (language === "he" ? "נפתח" : language === "ru" ? "Меню" : "Dropdown")
                  : m === "side-panel"
                    ? (language === "he" ? "צד" : language === "ru" ? "Боковая" : "Side")
                    : (language === "he" ? "חלון" : language === "ru" ? "Окно" : "Popup");
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onPanelModeChange(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      panelMode === m
                        ? "bg-[var(--cc-accent-600)] text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Label */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {language === "he" ? "שם מותאם" : language === "ru" ? "Название" : "Custom Label"}
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder={widget.label[language]}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
            />
          </div>

          {/* Custom Icon */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {sb?.customIcon || "Custom Icon"}
            </label>
            <IconPicker
              value={customIcon || null}
              onChange={(val) => onIconChange(val)}
              size={24}
            />
          </div>

          {/* Lock toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">
              {isLocked ? (sb?.unlockWidget || "Unlock Widget") : (sb?.lockWidget || "Lock Widget")}
            </label>
            <button
              type="button"
              onClick={onToggleLock}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isLocked
                  ? "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
              {isLocked
                ? (language === "he" ? "נעול" : language === "ru" ? "Закреплён" : "Locked")
                : (language === "he" ? "פתוח" : language === "ru" ? "Открыт" : "Unlocked")}
            </button>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="px-5 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {sb?.info || "Info"}
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">{sb?.category || "Category"}</span>
            <span className="text-slate-300">{CATEGORY_LABELS[widget.category][language]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{sb?.status || "Status"}</span>
            <span className={widget.status === "active" ? "text-emerald-400" : "text-slate-500"}>
              {widget.status === "active"
                ? (language === "he" ? "פעיל" : language === "ru" ? "Активен" : "Active")
                : (language === "he" ? "בקרוב" : language === "ru" ? "Скоро" : "Coming Soon")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{sb?.defaultSize || "Default Size"}</span>
            <span className="text-slate-300">{widget.defaultSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tier</span>
            <span className="text-slate-300">{widget.tier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
