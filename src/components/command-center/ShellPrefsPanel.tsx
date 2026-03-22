"use client";

import { useRef, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { useShellPrefs, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "@/lib/hooks/useShellPrefs";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

interface ShellPrefsPanelProps {
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

const DEFAULTS = {
  sidebarHover: true,
  sidebarPinned: false,
  sidebarWidth: 240,
  topbarVisible: true,
  tabbarVisible: false,
  trayVisible: false,
  speedDialVisible: true,
  bottomDockAutoHide: true,
  dockPinned: false,
};

export function ShellPrefsPanel({ onClose, anchorRef }: ShellPrefsPanelProps) {
  const [prefs, setPrefs, updatePref] = useShellPrefs();
  const { language } = useSettings();
  const t = getTranslations(language);
  const sp = t.shellPrefs as Record<string, string>;
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleItems: { key: keyof typeof DEFAULTS; label: string; hint?: string }[] = [
    { key: "topbarVisible", label: sp.topbarVisible },
    { key: "tabbarVisible", label: sp.tabbarVisible },
    { key: "trayVisible", label: sp.trayVisible },
    { key: "speedDialVisible", label: sp.speedDialVisible },
  ];

  return (
    <div
      ref={panelRef}
      className="fixed z-50 w-72 rounded-xl border border-slate-700 shadow-2xl right-2"
      style={{
        top: 52,
        backgroundColor: "var(--nav-bg)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-200">{sp.title}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1 px-4 py-3">
        {/* 1. Sidebar hover toggle */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-800/50">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-slate-300">{sp.sidebarHover}</span>
            <span className="text-[10px] text-slate-600">{sp.hoverHint}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.sidebarHover}
            onClick={() => updatePref("sidebarHover", !prefs.sidebarHover)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
              prefs.sidebarHover ? "bg-[var(--cc-accent-500)]" : "bg-slate-700"
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              prefs.sidebarHover ? "translate-x-4" : "translate-x-0.5"
            } mt-0.5`} />
          </button>
        </label>

        {/* 2. Sidebar width slider — right after hover */}
        <div className="rounded-lg px-2 py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">{sp.sidebarWidth}</span>
            <span className="text-[10px] tabular-nums text-slate-500">{prefs.sidebarWidth}px</span>
          </div>
          <input
            type="range"
            min={SIDEBAR_MIN_WIDTH}
            max={SIDEBAR_MAX_WIDTH}
            value={prefs.sidebarWidth}
            onChange={(e) => updatePref("sidebarWidth", Number(e.target.value))}
            className="w-full accent-[var(--cc-accent-500)]"
          />
        </div>

        {/* 3+ Rest of toggles */}
        {toggleItems.map(({ key, label, hint }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-800/50"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-slate-300">{label}</span>
              {hint && <span className="text-[10px] text-slate-600">{hint}</span>}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!prefs[key]}
              onClick={() => updatePref(key, !prefs[key])}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                prefs[key]
                  ? "bg-[var(--cc-accent-500)]"
                  : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  prefs[key] ? "translate-x-4" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </label>
        ))}
      </div>

      {/* Reset */}
      <div className="border-t border-slate-700/50 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setPrefs({ ...DEFAULTS })}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          <RotateCcw className="h-3 w-3" />
          {sp.resetDefaults}
        </button>
      </div>
    </div>
  );
}
