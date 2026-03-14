"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { widgetRegistry } from "./widgets/WidgetRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

interface OverflowMenuProps {
  widgetIds: string[];
  onWidgetClick: (widgetId: string) => void;
}

export function OverflowMenu({ widgetIds, onWidgetClick }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language } = useSettings();
  const t = getTranslations(language);

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (widgetIds.length === 0) return null;

  return (
    <div ref={menuRef} className="relative flex h-full shrink-0 items-center">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`relative flex h-8 w-10 items-center justify-center rounded transition-colors ${
          open
            ? "bg-[var(--cc-accent-600)] text-white"
            : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
        }`}
        title={t.smartBar?.more || "More"}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--cc-accent-600)] px-0.5 text-[9px] font-bold text-white">
          {widgetIds.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {t.smartBar?.overflow || "More widgets"} ({widgetIds.length})
          </div>
          {widgetIds.map((widgetId) => {
            const widget = widgetRegistry.find((w) => w.id === widgetId);
            if (!widget) return null;
            const Icon = widget.icon;
            return (
              <button
                key={widgetId}
                type="button"
                onClick={() => {
                  onWidgetClick(widgetId);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-white"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{widget.label[language]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
