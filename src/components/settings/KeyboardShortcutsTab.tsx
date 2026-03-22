"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { Keyboard } from "lucide-react";

const labels = {
  he: {
    title: "קיצורי מקלדת",
    description: "קיצורי דרך זמינים במערכת",
    action: "פעולה",
    mac: "Mac",
    windows: "Windows",
  },
  en: {
    title: "Keyboard Shortcuts",
    description: "Available keyboard shortcuts",
    action: "Action",
    mac: "Mac",
    windows: "Windows",
  },
  ru: {
    title: "Горячие клавиши",
    description: "Доступные сочетания клавиш",
    action: "Действие",
    mac: "Mac",
    windows: "Windows",
  },
};

interface Shortcut {
  action: Record<string, string>;
  mac: string;
  windows: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    action: { he: "חיפוש", en: "Search", ru: "Поиск" },
    mac: "⌘K",
    windows: "Ctrl+K",
  },
  {
    action: { he: "Sidebar", en: "Sidebar", ru: "Sidebar" },
    mac: "⌘\\",
    windows: "Ctrl+\\",
  },
  {
    action: { he: "vNote חדש", en: "New vNote", ru: "Новая vNote" },
    mac: "⌘N",
    windows: "Ctrl+N",
  },
  {
    action: { he: "הגדרות", en: "Settings", ru: "Настройки" },
    mac: "⌘,",
    windows: "Ctrl+,",
  },
  {
    action: { he: "סגור / חזור", en: "Close / Back", ru: "Закрыть / Назад" },
    mac: "Esc",
    windows: "Esc",
  },
  {
    action: { he: "App Launcher", en: "App Launcher", ru: "App Launcher" },
    mac: "⌘/",
    windows: "Ctrl+/",
  },
  {
    action: { he: "AI Hub", en: "AI Hub", ru: "AI Hub" },
    mac: "⌘J",
    windows: "Ctrl+J",
  },
  {
    action: { he: "עריכת מסמך", en: "Editor", ru: "Редактор" },
    mac: "⌘E",
    windows: "Ctrl+E",
  },
];

export function KeyboardShortcutsTab() {
  const { language } = useSettings();
  const l = labels[language];
  const isRtl = language === "he";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Keyboard className="h-4 w-4 text-slate-500" />
        <p className="text-xs text-slate-500">{l.description}</p>
      </div>

      <div className="rounded-xl border border-slate-700/30 bg-slate-800/30 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 px-4 py-2.5 border-b border-slate-700/30 bg-slate-800/50">
          <span className="text-xs font-medium text-slate-400">{l.action}</span>
          <span className="text-xs font-medium text-slate-400 text-center">{l.mac}</span>
          <span className="text-xs font-medium text-slate-400 text-center">{l.windows}</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-700/20">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-4 px-4 py-2.5 hover:bg-slate-700/10 transition-colors"
            >
              <span className="text-sm text-slate-300">
                {shortcut.action[language] || shortcut.action.en}
              </span>
              <span className="text-center">
                <kbd className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 font-mono border border-slate-600/40">
                  {shortcut.mac}
                </kbd>
              </span>
              <span className="text-center">
                <kbd className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 font-mono border border-slate-600/40">
                  {shortcut.windows}
                </kbd>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
