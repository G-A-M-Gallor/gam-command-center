"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Store, Search, ExternalLink, CheckCircle2, Zap,
} from "lucide-react";

// ─── App Catalog ────────────────────────────────────────

interface AppDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: { he: string; en: string; ru: string };
  status: "available" | "connected" | "coming-soon";
  url?: string;
}

const APP_CATALOG: AppDef[] = [
  { id: "supabase", name: "Supabase", icon: "⚡", category: "database", description: { he: "מסד נתונים + Auth + Realtime", en: "Database + Auth + Realtime", ru: "БД + Авторизация + Realtime" }, status: "connected" },
  { id: "vercel", name: "Vercel", icon: "▲", category: "hosting", description: { he: "אירוח ו-Deploy", en: "Hosting & Deploy", ru: "Хостинг и деплой" }, status: "connected" },
  { id: "github", name: "GitHub", icon: "🐙", category: "dev", description: { he: "קוד מקור ו-CI/CD", en: "Source code & CI/CD", ru: "Код и CI/CD" }, status: "connected" },
  { id: "notion", name: "Notion", icon: "📝", category: "productivity", description: { he: "ניהול ידע ומשימות", en: "Knowledge & task management", ru: "Управление знаниями и задачами" }, status: "connected" },
  { id: "sentry", name: "Sentry", icon: "🐛", category: "monitoring", description: { he: "מעקב שגיאות", en: "Error tracking", ru: "Отслеживание ошибок" }, status: "connected" },
  { id: "resend", name: "Resend", icon: "📧", category: "email", description: { he: "שליחת מיילים", en: "Email sending", ru: "Отправка email" }, status: "connected" },
  { id: "origami", name: "Origami CRM", icon: "🎨", category: "crm", description: { he: "CRM תפעולי", en: "Operational CRM", ru: "Операционная CRM" }, status: "connected" },
  { id: "n8n", name: "n8n", icon: "🔄", category: "automation", description: { he: "אוטומציות וזרימות", en: "Automations & workflows", ru: "Автоматизация" }, status: "available" },
  { id: "wati", name: "WATI", icon: "💬", category: "messaging", description: { he: "WhatsApp Business API", en: "WhatsApp Business API", ru: "WhatsApp Business API" }, status: "available" },
  { id: "google-calendar", name: "Google Calendar", icon: "📅", category: "productivity", description: { he: "יומן גוגל", en: "Google Calendar", ru: "Google Календарь" }, status: "available" },
  { id: "slack", name: "Slack", icon: "💬", category: "messaging", description: { he: "צ'אט צוותי", en: "Team chat", ru: "Командный чат" }, status: "coming-soon" },
  { id: "zapier", name: "Zapier", icon: "⚡", category: "automation", description: { he: "אוטומציות ענן", en: "Cloud automations", ru: "Облачная автоматизация" }, status: "coming-soon" },
  { id: "stripe", name: "Stripe", icon: "💳", category: "payments", description: { he: "תשלומים", en: "Payments", ru: "Платежи" }, status: "coming-soon" },
  { id: "twilio", name: "Twilio", icon: "📱", category: "messaging", description: { he: "SMS ושיחות", en: "SMS & calls", ru: "SMS и звонки" }, status: "coming-soon" },
  { id: "openai", name: "OpenAI", icon: "🤖", category: "ai", description: { he: "GPT ו-DALL-E", en: "GPT & DALL-E", ru: "GPT и DALL-E" }, status: "coming-soon" },
  { id: "google-drive", name: "Google Drive", icon: "📁", category: "storage", description: { he: "אחסון קבצים", en: "File storage", ru: "Хранение файлов" }, status: "coming-soon" },
  { id: "jira", name: "Jira", icon: "📋", category: "dev", description: { he: "ניהול פרויקטים", en: "Project management", ru: "Управление проектами" }, status: "coming-soon" },
  { id: "figma", name: "Figma", icon: "🎨", category: "design", description: { he: "עיצוב ופרוטוטייפ", en: "Design & prototyping", ru: "Дизайн и прототипирование" }, status: "coming-soon" },
];

const CATEGORIES = [
  { id: "all", label: { he: "הכל", en: "All", ru: "Все" } },
  { id: "database", label: { he: "מסדי נתונים", en: "Database", ru: "БД" } },
  { id: "hosting", label: { he: "אירוח", en: "Hosting", ru: "Хостинг" } },
  { id: "dev", label: { he: "פיתוח", en: "Dev", ru: "Разработка" } },
  { id: "productivity", label: { he: "פרודקטיביות", en: "Productivity", ru: "Продуктивность" } },
  { id: "email", label: { he: "מייל", en: "Email", ru: "Почта" } },
  { id: "messaging", label: { he: "הודעות", en: "Messaging", ru: "Сообщения" } },
  { id: "automation", label: { he: "אוטומציות", en: "Automation", ru: "Автоматизация" } },
  { id: "crm", label: { he: "CRM", en: "CRM", ru: "CRM" } },
  { id: "ai", label: { he: "AI", en: "AI", ru: "AI" } },
  { id: "payments", label: { he: "תשלומים", en: "Payments", ru: "Платежи" } },
  { id: "monitoring", label: { he: "מעקב", en: "Monitoring", ru: "Мониторинг" } },
  { id: "storage", label: { he: "אחסון", en: "Storage", ru: "Хранилище" } },
  { id: "design", label: { he: "עיצוב", en: "Design", ru: "Дизайн" } },
];

// ─── Component ──────────────────────────────────────────

export default function IntegrationStorePage() {
  const { language } = useSettings();
  const isRtl = language === "he";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = APP_CATALOG.filter((app) => {
    if (category !== "all" && app.category !== category) return false;
    if (query) {
      const q = query.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.description[language].toLowerCase().includes(q);
    }
    return true;
  });

  const connected = filtered.filter((a) => a.status === "connected");
  const available = filtered.filter((a) => a.status === "available");
  const comingSoon = filtered.filter((a) => a.status === "coming-soon");

  const labels = {
    he: { title: "חנות אפליקציות", subtitle: "חיבורים רשמיים לשירותים חיצוניים", search: "חיפוש אפליקציות...", connectedSection: "מחוברים", availableSection: "זמינים לחיבור", comingSoonSection: "בקרוב", connect: "חבר", comingSoonBadge: "בקרוב" },
    en: { title: "App Store", subtitle: "Official connections to third-party services", search: "Search apps...", connectedSection: "Connected", availableSection: "Available", comingSoonSection: "Coming Soon", connect: "Connect", comingSoonBadge: "Soon" },
    ru: { title: "Магазин приложений", subtitle: "Подключения к сторонним сервисам", search: "Поиск...", connectedSection: "Подключены", availableSection: "Доступны", comingSoonSection: "Скоро", connect: "Подключить", comingSoonBadge: "Скоро" },
  };
  const l = labels[language];

  const renderSection = (title: string, apps: AppDef[]) => {
    if (apps.length === 0) return null;
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`group relative rounded-xl border p-4 transition-all hover:shadow-lg ${
                app.status === "connected"
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                  : app.status === "coming-soon"
                    ? "border-slate-700/30 bg-slate-800/20 opacity-60"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-[var(--cc-accent-500)]/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{app.name}</span>
                    {app.status === "connected" && <CheckCircle2 size={14} className="text-emerald-400" />}
                    {app.status === "coming-soon" && (
                      <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">{l.comingSoonBadge}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{app.description[language]}</p>
                </div>
              </div>
              {app.status === "available" && (
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)] py-1.5 text-xs font-medium text-white hover:bg-[var(--cc-accent-500)] transition-colors">
                  <Zap size={12} />
                  {l.connect}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Store size={28} className="text-[var(--cc-accent-400)]" />
          {l.title}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{l.subtitle}</p>
      </div>

      {/* Search + Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={l.search}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 ps-10 pe-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter((c) => c.id === "all" || APP_CATALOG.some((a) => a.category === c.id)).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === cat.id
                  ? "bg-[var(--cc-accent-600)] text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              {cat.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {renderSection(l.connectedSection, connected)}
        {renderSection(l.availableSection, available)}
        {renderSection(l.comingSoonSection, comingSoon)}
      </div>
    </div>
  );
}
