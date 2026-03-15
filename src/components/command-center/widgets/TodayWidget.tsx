"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Clock, Bell, RefreshCw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

interface EventItem {
  time: string;
  title: { he: string; en: string };
  project?: { he: string; en: string };
  type: "meeting" | "deadline" | "reminder";
}

const LOCALE_MAP: Record<string, string> = { he: "he-IL", en: "en-US", ru: "ru-RU" };

function getHebrewDate(): string {
  const days = ["יום א׳", "יום ב׳", "יום ג׳", "יום ד׳", "יום ה׳", "יום ו׳", "שבת"];
  const months = [
    "בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני",
    "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר",
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getFormattedDate(language: string): string {
  if (language === "he") return getHebrewDate();
  const locale = LOCALE_MAP[language] || "en-US";
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const typeIcons = {
  meeting: CalendarDays,
  deadline: Clock,
  reminder: Bell,
};

const typeColors = {
  meeting: "text-blue-400",
  deadline: "text-red-400",
  reminder: "text-amber-400",
};

export function TodayPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events/today")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dateStr = getFormattedDate(language);

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="text-center">
        <p className="text-sm font-medium text-slate-100">{dateStr}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <RefreshCw size={14} className="animate-spin" />
          {t.widgets.todayLoading}
        </div>
      ) : events.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-500">
          {t.widgets.todayNoEvents}
        </div>
      ) : (
        <div className="space-y-1.5">
          {events.map((item, i) => {
            const Icon = typeIcons[item.type];
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-slate-700/30"
              >
                <Icon size={13} className={`shrink-0 ${typeColors[item.type]}`} />
                <span className="w-10 shrink-0 text-[11px] font-medium text-[var(--cc-accent-400)]">
                  {item.time}
                </span>
                <span className="flex-1 truncate text-sm text-slate-300">
                  {item.title[language === "he" ? "he" : "en"]}
                </span>
                {item.project && (
                  <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {item.project[language === "he" ? "he" : "en"]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TodayBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();

  if (size < 2) return null;

  const now = new Date();
  const short = now.toLocaleDateString(LOCALE_MAP[language] || "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <span className="truncate text-xs text-slate-400">{short}</span>
  );
}
