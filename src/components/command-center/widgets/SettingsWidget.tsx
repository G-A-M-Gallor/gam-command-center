"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useWidgets, type HoverDelay } from "@/contexts/WidgetContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

// --- Panel content (dropdown) ---

export function SettingsPanel() {
  const { language } = useSettings();
  const { hoverDelay, setHoverDelay } = useWidgets();
  const t = getTranslations(language);

  const DELAY_OPTIONS: { value: HoverDelay; display: string }[] = [
    { value: "none", display: t.widgets.none },
    { value: 0.1, display: "0.1s" },
    { value: 0.3, display: "0.3s" },
    { value: 0.5, display: "0.5s" },
    { value: 1, display: "1s" },
    { value: 2, display: "2s" },
    { value: 3, display: "3s" },
  ];

  return (
    <div className="space-y-4">
      {/* Hover Delay */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {t.widgets.hoverDelay}
        </label>
        <div className="flex flex-wrap gap-1">
          {DELAY_OPTIONS.map((opt) => (
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
              {opt.display}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/50" />

      {/* Open Settings link */}
      <Link
        href="/dashboard/settings"
        className="flex items-center justify-center gap-2 rounded-lg bg-[var(--cc-accent-600-20)] px-3 py-2.5 text-sm font-medium text-[var(--cc-accent-300)] transition-colors hover:bg-[var(--cc-accent-600-30)]"
      >
        <Settings className="h-4 w-4" />
        {t.settings.openSettings}
      </Link>
    </div>
  );
}

// --- Bar content (inline in top bar at size >= 2) ---

export function SettingsBarContent({ size }: { size: WidgetSize }) {
  const { language, sidebarPosition, sidebarVisibility } = useSettings();

  const langFlag = getTranslations(language).widgets.langFlag;
  const posLabel = sidebarPosition === "right" ? "R" : "L";
  const visLabel =
    sidebarVisibility === "visible"
      ? "V"
      : sidebarVisibility === "float"
        ? "F"
        : "H";

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-300">
      <span className="font-medium">{langFlag}</span>
      {size >= 3 && (
        <span className="text-slate-500">|</span>
      )}
      {size >= 3 && (
        <span>{posLabel}</span>
      )}
      {size >= 4 && (
        <span className="text-slate-500">|</span>
      )}
      {size >= 4 && (
        <span>{visLabel}</span>
      )}
    </div>
  );
}
