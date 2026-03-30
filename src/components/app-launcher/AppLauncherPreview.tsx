"use client";

import { _X, _ExternalLink, Maximize2, PanelLeft, _Layers, CreditCard } from "lucide-react";
import type { LauncherItem, LaunchMode } from "@/lib/app-launcher/types";
import { LAUNCH_MODE_LABELS } from "@/lib/app-launcher/constants";
import type { LucideIcon } from "lucide-react";

const LAUNCH_MODE_ICONS: Record<LaunchMode, LucideIcon> = {
  "full-page": Maximize2,
  popup: _Layers,
  "side-panel": PanelLeft,
  "blur-card": CreditCard,
};

interface Props {
  item: LauncherItem;
  currentMode: LaunchMode;
  onLaunchModeChange: (mode: LaunchMode) => void;
  onLaunch: () => void;
  onClose: () => void;
  language: "he" | "en" | "ru";
  labelOverride?: string;
  descriptionOverride?: string;
  compact?: boolean;
}

export function AppLauncherPreview({
  item,
  currentMode,
  onLaunchModeChange,
  onLaunch,
  onClose,
  language,
  labelOverride,
  descriptionOverride,
  _compact = false,
}: Props) {
  const Icon = item.icon;
  const label = labelOverride || item.label[language] || item.label.en;
  const description = descriptionOverride || item.description?.[language] || item.description?.en;
  const isComingSoon = item.status === "coming-soon";

  return (
    <div className={`flex h-full shrink-0 flex-col border-s border-white/[0.06] bg-slate-900/80 backdrop-blur-lg transition-all duration-200 ${compact ? "w-64" : "w-80"}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">
          {language === "he" ? "תצוגה מקדימה" : "Preview"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
        >
          <_X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`${compact ? "mb-3 h-14 w-14 rounded-2xl" : "mb-4 h-20 w-20 rounded-3xl"} flex items-center justify-center border transition-all
              ${item.type === "widget"
                ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/20"
                : "bg-white/[0.06] border-white/[0.08]"
              }`}
          >
            <Icon className={`${_compact ? "h-6 w-6" : "h-9 w-9"} text-slate-200`} />
          </div>

          <h2 className="text-base font-bold text-slate-100">{label}</h2>
          {description && (
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[240px]">{description}</p>
          )}

          {/* Type badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              item.type === "widget"
                ? "bg-purple-500/15 text-purple-400"
                : "bg-blue-500/15 text-blue-400"
            }`}>
              {item.type === "widget"
                ? (language === "he" ? "ווידג׳ט" : "Widget")
                : (language === "he" ? "דף" : "Page")
              }
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              isComingSoon
                ? "bg-amber-500/15 text-amber-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}>
              {isComingSoon
                ? (language === "he" ? "בקרוב" : "Coming Soon")
                : (language === "he" ? "פעיל" : "Active")
              }
            </span>
          </div>
        </div>

        {/* Launch Mode Selector — hidden in compact mode */}
        <div className={`mt-6 ${compact ? "hidden" : ""}`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            {language === "he" ? "מצב פתיחה" : "Launch Mode"}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(LAUNCH_MODE_LABELS) as LaunchMode[]).map((mode) => {
              const ModeIcon = LAUNCH_MODE_ICONS[mode];
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onLaunchModeChange(mode)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30"
                      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                  }`}
                >
                  <ModeIcon className="h-3.5 w-3.5" />
                  {LAUNCH_MODE_LABELS[mode][language]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Path — hidden in compact mode */}
        {item.href && !compact && (
          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              {language === "he" ? "נתיב" : "Path"}
            </p>
            <code className="block rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-slate-500 font-mono">
              {item.href}
            </code>
          </div>
        )}
      </div>

      {/* Footer — Launch button */}
      <div className="border-t border-white/[0.06] p-4">
        <button
          type="button"
          onClick={onLaunch}
          disabled={isComingSoon}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {language === "he" ? "פתח" : "Open"}
        </button>
      </div>
    </div>
  );
}
