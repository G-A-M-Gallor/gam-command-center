"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Languages,
  PanelLeftClose,
  PanelRightClose,
  LayoutList,
  Keyboard,
  Timer,
  Settings,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useWidgets, type TopBarDisplayMode, type HoverDelay } from "@/contexts/WidgetContext";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
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
  const { displayMode, setDisplayMode, hoverDelay, setHoverDelay } = useWidgets();
  const { editMode, setEditMode } = useDashboardMode();
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
              {language === "he" ? "שפה" : language === "ru" ? "Язык" : "Language"}
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
              {language === "he" ? "מיקום סיידבר" : language === "ru" ? "Позиция бокового меню" : "Sidebar Position"}
            </label>
            <div className="flex gap-2">
              {(["left", "right"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setSidebarPosition(pos)}
                  className={`${btnBase} ${sidebarPosition === pos ? btnActive : btnInactive}`}
                >
                  {pos === "left"
                    ? (language === "he" ? "שמאל" : language === "ru" ? "Слева" : "Left")
                    : (language === "he" ? "ימין" : language === "ru" ? "Справа" : "Right")}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Visibility */}
          <div className={sectionClass}>
            <label className={labelClass}>
              <PanelRightClose size={14} />
              {language === "he" ? "נראות סיידבר" : language === "ru" ? "Видимость меню" : "Sidebar Visibility"}
            </label>
            <div className="flex gap-2">
              {(["visible", "float", "hidden"] as const).map((vis) => {
                const vLabel = vis === "visible"
                  ? (language === "he" ? "גלוי" : language === "ru" ? "Видимый" : "Visible")
                  : vis === "float"
                    ? (language === "he" ? "צף" : language === "ru" ? "Плавающий" : "Float")
                    : (language === "he" ? "מוסתר" : language === "ru" ? "Скрытый" : "Hidden");
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

          {/* Display Mode */}
          <div className={sectionClass}>
            <label className={labelClass}>
              <LayoutList size={14} />
              {language === "he" ? "מצב תצוגה" : language === "ru" ? "Режим отображения" : "Display Mode"}
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
                    className={`${btnBase} ${displayMode === mode ? btnActive : btnInactive}`}
                  >
                    {mLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hover Delay */}
          <div className={sectionClass}>
            <label className={labelClass}>
              <Timer size={14} />
              {language === "he" ? "השהיית ריחוף" : language === "ru" ? "Задержка наведения" : "Hover Delay"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["none", 0.1, 0.3, 0.5, 1, 2] as HoverDelay[]).map((d) => (
                <button
                  key={String(d)}
                  type="button"
                  onClick={() => setHoverDelay(d)}
                  className={`${btnBase} ${hoverDelay === d ? btnActive : btnInactive}`}
                >
                  {d === "none" ? "Off" : `${d}s`}
                </button>
              ))}
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
              {language === "he" ? "קיצורי מקלדת" : language === "ru" ? "Горячие клавиши" : "Keyboard Shortcuts"}
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
              {language === "he" ? "כל ההגדרות" : language === "ru" ? "Все настройки" : "All Settings"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
