"use client";

import { X, Pin, Grid3X3, Power } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWidgets, type HoverDelay } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import {
  getWidgetById,
  getEffectivePlacement,
  type WidgetSize,
  type WidgetPlacement,
} from "./WidgetRegistry";

const SIZE_OPTIONS: WidgetSize[] = [1, 2, 3, 4];
const DELAY_OPTIONS: { value: HoverDelay; label: string }[] = [
  { value: "none", label: "" },
  { value: 0.1, label: "0.1" },
  { value: 0.3, label: "0.3" },
  { value: 0.5, label: "0.5" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];

const PLACEMENT_OPTIONS: {
  value: WidgetPlacement;
  icon: typeof Pin;
}[] = [
  { value: "toolbar", icon: Pin },
  { value: "apps", icon: Grid3X3 },
  { value: "disabled", icon: Power },
];

interface WidgetSettingsProps {
  widgetId: string;
  onClose: () => void;
  onOpenLibrary: () => void;
}

export function WidgetSettings({
  widgetId,
  onClose,
  onOpenLibrary,
}: WidgetSettingsProps) {
  const {
    widgetSizes,
    widgetPlacements,
    hoverDelay,
    setWidgetSize,
    setWidgetPlacement,
    setHoverDelay,
  } = useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);

  const widget = getWidgetById(widgetId);
  if (!widget) return null;

  const currentSize = widgetSizes[widgetId] ?? widget.defaultSize;
  const currentPlacement = getEffectivePlacement(
    widgetId,
    widgetPlacements,
    widget.isRemovable
  );
  const label = widget.label[language];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label={t.widgets.close}
      />
      <div
        className="relative z-10 flex w-80 max-h-[calc(100vh-5rem)] flex-col border border-slate-700 bg-slate-800 shadow-xl"
        style={{ borderRadius: "var(--cc-radius-lg)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <widget.icon className="h-4 w-4 text-[var(--cc-accent-400)]" />
            <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {/* Placement selector */}
          {widget.isRemovable ? (
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {t.widgets.storePlacement}
              </label>
              <div className="flex flex-col gap-1">
                {PLACEMENT_OPTIONS.map(({ value: p, icon: Icon }) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setWidgetPlacement(widgetId, p);
                      if (p === "disabled") onClose();
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      currentPlacement === p
                        ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                        : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.widgets[
                      `placement${p.charAt(0).toUpperCase() + p.slice(1)}` as keyof typeof t.widgets
                    ]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
              {t.widgets.storeSystemWidget}
            </div>
          )}

          {/* Size selector */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              {t.widgets.size}
            </label>
            <div className="flex gap-1">
              {SIZE_OPTIONS.map((s) => (
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

          {/* Hover delay */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              {t.widgets.hoverDelay}
            </label>
            <div className="flex flex-wrap gap-1">
              {DELAY_OPTIONS.map((opt) => {
                const delayLabel =
                  opt.value === "none"
                    ? t.widgets.none
                    : `${opt.label}${t.widgets.seconds[0]}`;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setHoverDelay(opt.value)}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      hoverDelay === opt.value
                        ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
                    }`}
                  >
                    {delayLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open store button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              onClose();
              onOpenLibrary();
            }}
          >
            {t.widgets.store}
          </Button>
        </div>
      </div>
    </div>
  );
}
