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

const mockMeetings: EventItem[] = [
  {
    time: "10:00",
    title: { he: "סנכרון צוות פיתוח", en: "Dev Team Sync" },
    project: { he: "vBrain.io", en: "vBrain.io" },
  },
  {
    time: "14:30",
    title: { he: "סקירת ספרינט", en: "Sprint Review" },
    project: { he: "מרכז הפיקוד", en: "Command Center" },
  },
  {
    time: "16:00",
    title: { he: "פגישת לקוח - ABC", en: "Client Meeting - ABC" },
    project: { he: "ABC בניין", en: "ABC Construction" },
  },
];

const mockDeadlines: EventItem[] = [
  {
    time: "EOD",
    title: { he: "הגשת אפיון טכני", en: "Submit Technical Spec" },
    project: { he: "vBrain.io", en: "vBrain.io" },
  },
  {
    time: "מחר",
    title: { he: "עדכון דוח חודשי", en: "Monthly Report Update" },
  },
];

const mockReminders: EventItem[] = [
  {
    time: "12:00",
    title: { he: "בדוק סטטוס סנכרון Origami", en: "Check Origami Sync Status" },
  },
  {
    time: "17:00",
    title: { he: "שלח סיכום יומי", en: "Send Daily Summary" },
  },
];

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

      <Section
        title={t.widgets.meetings}
        icon={CalendarDays}
        items={mockMeetings}
        lang={language}
        iconColor="text-blue-400"
      />

      <Section
        title={t.widgets.deadlines}
        icon={Clock}
        items={mockDeadlines}
        lang={language}
        iconColor="text-amber-400"
      />

      <Section
        title={t.widgets.reminders}
        icon={Bell}
        items={mockReminders}
        lang={language}
        iconColor="text-emerald-400"
      />
    </div>
  );
}

export function TodayBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();

  if (size < 2) return null;

  const nextEvent = mockMeetings[0];

  if (size === 2) {
    return (
      <span className="truncate text-xs text-slate-400">{nextEvent.time}</span>
    );
  }

  if (size === 3) {
    return (
      <span className="truncate text-xs text-slate-400">
        {nextEvent.time} {nextEvent.title[language]}
      </span>
    );
  }

  // Size 4: next 2 events
  const second = mockMeetings[1];
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-[10px] text-slate-400">
        {nextEvent.time} {nextEvent.title[language]}
      </span>
      {second && (
        <span className="truncate text-[10px] text-slate-500">
          {second.time} {second.title[language]}
        </span>
      )}
    </div>
  );
}
