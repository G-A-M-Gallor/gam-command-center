"use client";

import { X } from "lucide-react";
import { useWidgets, type HoverDelay } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { getWidgetById, type WidgetSize } from "./WidgetRegistry";

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
  const { widgetSizes, hiddenWidgets, hoverDelay, setWidgetSize, toggleWidget, setHoverDelay } =
    useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);

  const widget = getWidgetById(widgetId);
  if (!widget) return null;

  const currentSize = widgetSizes[widgetId] ?? widget.defaultSize;
  const isHidden = hiddenWidgets.includes(widgetId);
  const label = widget.label[language];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label={t.widgets.close}
      />
      <div className="relative z-10 flex w-80 max-h-[calc(100vh-5rem)] flex-col border border-slate-700 bg-slate-800 shadow-xl" style={{ borderRadius: "var(--cc-radius-lg)" }}>
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
          {/* Visibility toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">
              {isHidden ? t.widgets.showWidget : t.widgets.hideWidget}
            </span>
            <button
              type="button"
              onClick={() => {
                toggleWidget(widgetId);
                if (!isHidden) onClose();
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                !isHidden ? "bg-[var(--cc-accent-600)]" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  !isHidden ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

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

          {/* Open library button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLibrary();
            }}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600"
          >
            {t.widgets.library}
          </button>
        </div>
      </div>
    </div>
  );
}
