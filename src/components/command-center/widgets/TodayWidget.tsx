"use client";

import { CalendarDays, Clock, Bell } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

interface EventItem {
  time: string;
  title: { he: string; en: string };
  project?: { he: string; en: string };
}

// Events will come from calendar integration (Google Calendar / Supabase)
// For now, show real date + empty state

function getHebrewDate(): string {
  const days = ["יום א׳", "יום ב׳", "יום ג׳", "יום ד׳", "יום ה׳", "יום ו׳", "שבת"];
  const months = [
    "בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני",
    "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר",
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getEnglishDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface SectionProps {
  title: string;
  icon: typeof CalendarDays;
  items: EventItem[];
  lang: "he" | "en";
  iconColor: string;
}

function Section({ title, icon: Icon, items, lang, iconColor }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <span className="text-xs font-medium text-slate-300">{title}</span>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-slate-700/30"
        >
          <span className="w-10 shrink-0 text-[11px] font-medium text-[var(--cc-accent-400)]">
            {item.time === "מחר" && lang === "en" ? "Tmrw" : item.time}
          </span>
          <span className="flex-1 truncate text-sm text-slate-300">
            {item.title[lang]}
          </span>
          {item.project && (
            <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
              {item.project[lang]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function TodayPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);

  const dateStr = language === "he" ? getHebrewDate() : getEnglishDate();

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="text-center">
        <p className="text-sm font-medium text-slate-100">{dateStr}</p>
      </div>

      <div className="py-4 text-center text-sm text-slate-500">
        {language === "he"
          ? "אין אירועים להיום. חבר יומן כדי לראות פגישות ודדליינים."
          : "No events today. Connect a calendar to see meetings and deadlines."}
      </div>
    </div>
  );
}

export function TodayBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();

  if (size < 2) return null;

  // Show today's date in the bar
  const now = new Date();
  const short = now.toLocaleDateString(language === "he" ? "he-IL" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <span className="truncate text-xs text-slate-400">{short}</span>
  );
}
