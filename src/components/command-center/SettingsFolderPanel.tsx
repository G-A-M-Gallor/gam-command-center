"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Languages,
  PanelLeftClose,
  PanelRightClose,
  Keyboard,
  Settings,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";

interface SettingsFolderPanelProps {
  onClose: () => void;
}

export function SettingsFolderPanel({ onClose }: SettingsFolderPanelProps) {
  const {
    language,
    setLanguage,
    sidebarPosition,
    setSidebarPosition,
    sidebarVisibility,
    setSidebarVisibility,
  } = useSettings();
  const router = useRouter();
  const t = getTranslations(language);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Compute left offset based on sidebar
  const sidebarWidth = sidebarVisibility === "visible" ? 240
    : sidebarVisibility === "float" ? 48 : 0;
  const leftOffset = sidebarPosition === "left" ? sidebarWidth + 16 : 16;

  const sectionClass = "space-y-2";
  const labelClass = "flex items-center gap-2 text-xs font-medium text-slate-400";
  const btnBase = "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors";
  const btnActive = "bg-[var(--cc-accent-600)] text-white";
  const btnInactive = "bg-slate-800 text-slate-400 hover:text-slate-200";

  return createPortal(
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50"
        aria-label="Close"
      />

      {/* Panel */}
      <div className="fixed top-14 z-50 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl" style={{ left: leftOffset }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[var(--cc-accent-400)]" />
            <h2 className="text-sm font-semibold text-slate-200">
              {t.smartBar?.pinnedSettings || "Settings"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Language */}
          <div className={sectionClass}>
            <label className={labelClass}>
              <Languages size={14} />
              {t.settings.language}
            </label>
            <div className="flex gap-2">
              {(["he", "en", "ru"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`${btnBase} ${language === lang ? btnActive : btnInactive}`}
                >
                  {lang === "he" ? "עברית" : lang === "en" ? "English" : "Русский"}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Position */}
          <div className={sectionClass}>
            <label className={labelClass}>
              <PanelLeftClose size={14} />
              {t.settings.sidebarPosition}
            </label>
            <div className="flex gap-2">
              {(["left", "right"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setSidebarPosition(pos)}
                  className={`${btnBase} ${sidebarPosition === pos ? btnActive : btnInactive}`}
                >
                  {pos === "left" ? t.settings.left : t.settings.right}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Visibility */}
          <div className={sectionClass}>
            <label className={labelClass}>
              <PanelRightClose size={14} />
              {t.settings.sidebarVisibility}
            </label>
            <div className="flex gap-2">
              {(["visible", "float", "hidden"] as const).map((vis) => {
                const vLabel = vis === "visible"
                  ? t.settings.visible
                  : vis === "float"
                    ? t.settings.float
                    : t.settings.hidden;
                return (
                  <button
                    key={vis}
                    type="button"
                    onClick={() => setSidebarVisibility(vis)}
                    className={`${btnBase} ${sidebarVisibility === vis ? btnActive : btnInactive}`}
                  >
                    {vLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider + links */}
          <div className="border-t border-slate-700 pt-3">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("cc-open-shortcuts"));
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <Keyboard size={14} />
              {(t.widgets as Record<string, string>).keyboardShortcuts}
            </button>
            <button
              type="button"
              onClick={() => {
                router.push("/dashboard/settings");
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <Settings size={14} />
              {(t.widgets as Record<string, string>).allSettings}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
