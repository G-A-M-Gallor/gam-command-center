import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { Settings, Search, Bot, Plus, Pin, Calendar, CalendarDays, Bell, Clock, ClipboardList, MessageCircle, Users, BarChart3, ExternalLink, Keyboard, Rss, TrendingUp, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

// ─── Lazy-loaded widget panels (code-split per widget) ──────
const SearchPanel = dynamic(() => import("./SearchWidget").then((m) => ({ default: m.SearchPanel })), { ssr: false }) as ComponentType<any>;
const SearchBarContent = dynamic(() => import("./SearchWidget").then((m) => ({ default: m.SearchBarContent })), { ssr: false }) as ComponentType<any>;

const AIPanel = dynamic(() => import("./AIWidget").then((m) => ({ default: m.AIPanel })), { ssr: false }) as ComponentType<any>;
const AIBarContent = dynamic(() => import("./AIWidget").then((m) => ({ default: m.AIBarContent })), { ssr: false }) as ComponentType<any>;

const QuickCreatePanel = dynamic(() => import("./QuickCreateWidget").then((m) => ({ default: m.QuickCreatePanel })), { ssr: false }) as ComponentType<any>;
const QuickCreateBarContent = dynamic(() => import("./QuickCreateWidget").then((m) => ({ default: m.QuickCreateBarContent })), { ssr: false }) as ComponentType<any>;

const FavoritesPanel = dynamic(() => import("./FavoritesWidget").then((m) => ({ default: m.FavoritesPanel })), { ssr: false }) as ComponentType<any>;
const FavoritesBarContent = dynamic(() => import("./FavoritesWidget").then((m) => ({ default: m.FavoritesBarContent })), { ssr: false }) as ComponentType<any>;

const TodayPanel = dynamic(() => import("./TodayWidget").then((m) => ({ default: m.TodayPanel })), { ssr: false }) as ComponentType<any>;
const TodayBarContent = dynamic(() => import("./TodayWidget").then((m) => ({ default: m.TodayBarContent })), { ssr: false }) as ComponentType<any>;

const NotificationsPanel = dynamic(() => import("./NotificationsWidget").then((m) => ({ default: m.NotificationsPanel })), { ssr: false }) as ComponentType<any>;
const NotificationsBarContent = dynamic(() => import("./NotificationsWidget").then((m) => ({ default: m.NotificationsBarContent })), { ssr: false }) as ComponentType<any>;

const TimerPanel = dynamic(() => import("./TimerWidget").then((m) => ({ default: m.TimerPanel })), { ssr: false }) as ComponentType<any>;
const TimerBarContent = dynamic(() => import("./TimerWidget").then((m) => ({ default: m.TimerBarContent })), { ssr: false }) as ComponentType<any>;

const ClipboardPanel = dynamic(() => import("./ClipboardWidget").then((m) => ({ default: m.ClipboardPanel })), { ssr: false }) as ComponentType<any>;
const ClipboardBarContent = dynamic(() => import("./ClipboardWidget").then((m) => ({ default: m.ClipboardBarContent })), { ssr: false }) as ComponentType<any>;

const SettingsPanel = dynamic(() => import("./SettingsWidget").then((m) => ({ default: m.SettingsPanel })), { ssr: false }) as ComponentType<any>;
const SettingsBarContent = dynamic(() => import("./SettingsWidget").then((m) => ({ default: m.SettingsBarContent })), { ssr: false }) as ComponentType<any>;

const ShortcutsPanel = dynamic(() => import("./ShortcutsWidget").then((m) => ({ default: m.ShortcutsPanel })), { ssr: false }) as ComponentType<any>;
const ShortcutsBarContent = dynamic(() => import("./ShortcutsWidget").then((m) => ({ default: m.ShortcutsBarContent })), { ssr: false }) as ComponentType<any>;

const WeeklyPlannerPanel = dynamic(() => import("./WeeklyPlannerWidget").then((m) => ({ default: m.WeeklyPlannerPanel })), { ssr: false }) as ComponentType<any>;
const WeeklyPlannerBarContent = dynamic(() => import("./WeeklyPlannerWidget").then((m) => ({ default: m.WeeklyPlannerBarContent })), { ssr: false }) as ComponentType<any>;

const KPIPanel = dynamic(() => import("./KPIWidget").then((m) => ({ default: m.KPIPanel })), { ssr: false }) as ComponentType<any>;
const KPIBarContent = dynamic(() => import("./KPIWidget").then((m) => ({ default: m.KPIBarContent })), { ssr: false }) as ComponentType<any>;

const ExternalLinksPanel = dynamic(() => import("./ExternalLinksWidget").then((m) => ({ default: m.ExternalLinksPanel })), { ssr: false }) as ComponentType<any>;
const ExternalLinksBarContent = dynamic(() => import("./ExternalLinksWidget").then((m) => ({ default: m.ExternalLinksBarContent })), { ssr: false }) as ComponentType<any>;

const WATIPanel = dynamic(() => import("./WATIWidget").then((m) => ({ default: m.WATIPanel })), { ssr: false }) as ComponentType<any>;
const WATIBarContent = dynamic(() => import("./WATIWidget").then((m) => ({ default: m.WATIBarContent })), { ssr: false }) as ComponentType<any>;

const TeamPanel = dynamic(() => import("./TeamWidget").then((m) => ({ default: m.TeamPanel })), { ssr: false }) as ComponentType<any>;
const TeamBarContent = dynamic(() => import("./TeamWidget").then((m) => ({ default: m.TeamBarContent })), { ssr: false }) as ComponentType<any>;

const RssPanel = dynamic(() => import("./RssWidget").then((m) => ({ default: m.RssPanel })), { ssr: false }) as ComponentType<any>;
const RssBarContent = dynamic(() => import("./RssWidget").then((m) => ({ default: m.RssBarContent })), { ssr: false }) as ComponentType<any>;

const LeadsPipelinePanel = dynamic(() => import("./LeadsPipelineWidget").then((m) => ({ default: m.LeadsPipelinePanel })), { ssr: false }) as ComponentType<any>;
const LeadsPipelineBarContent = dynamic(() => import("./LeadsPipelineWidget").then((m) => ({ default: m.LeadsPipelineBarContent })), { ssr: false }) as ComponentType<any>;

const MatchingPanel = dynamic(() => import("./MatchingWidget").then((m) => ({ default: m.MatchingPanel })), { ssr: false }) as ComponentType<any>;
const MatchingBarContent = dynamic(() => import("./MatchingWidget").then((m) => ({ default: m.MatchingBarContent })), { ssr: false }) as ComponentType<any>;


export type WidgetSize = 1 | 2 | 3 | 4;

export type WidgetCategory =
  | "basics"
  | "productivity"
  | "ai_comms"
  | "team"
  | "analytics"
  | "integrations";

export type WidgetTier = "free" | "pro" | "business";

export type WidgetPlacement = "toolbar" | "apps" | "disabled";

export interface WidgetDefinition {
  id: string;
  icon: LucideIcon;
  label: { he: string; en: string; ru: string };
  description: { he: string; en: string; ru: string };
  defaultSize: WidgetSize;
  status: "active" | "coming-soon";
  category: WidgetCategory;
  tier: WidgetTier;
  /** false = system widget (Settings, Search) — always toolbar, cannot disable */
  isRemovable: boolean;
  /** Content rendered inside the dropdown panel (not required for coming-soon) */
  component?: ComponentType;
  /** Inline content rendered in the top bar when size >= 2 */
  renderBar?: ComponentType<{ size: WidgetSize }>;
  /** "modal" = centered overlay, "side-panel" = sliding side panel */
  panelMode?: "dropdown" | "modal" | "side-panel";
}

/** Resolve effective placement for a widget, enforcing system widget invariant */
export function getEffectivePlacement(
  id: string,
  placements: Record<string, WidgetPlacement>,
  isRemovable: boolean
): WidgetPlacement {
  if (!isRemovable) return "toolbar";
  return placements[id] ?? "toolbar";
}

/** All registered widgets. Add new widgets here. */
export const widgetRegistry: WidgetDefinition[] = [
  {
    id: "search",
    icon: Search,
    label: { he: "חיפוש", en: "Search", ru: "Поиск" },
    description: {
      he: "חיפוש פרויקטים, מסמכים ושיחות",
      en: "Search projects, documents & conversations",
      ru: "Поиск проектов, документов и разговоров",
    },
    defaultSize: 2,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: false,
    component: SearchPanel,
    renderBar: SearchBarContent,
    panelMode: "modal",
  },
  {
    id: "ai-assistant",
    icon: Bot,
    label: { he: "עוזר AI", en: "AI Assistant", ru: "AI Ассистент" },
    description: {
      he: "עוזר AI מהיר עם הקשר לעמוד",
      en: "Quick AI assistant with page context",
      ru: "Быстрый AI-ассистент с контекстом страницы",
    },
    defaultSize: 1,
    status: "active",
    category: "ai_comms",
    tier: "free",
    isRemovable: true,
    component: AIPanel,
    renderBar: AIBarContent,
    panelMode: "side-panel",
  },
  {
    id: "quick-create",
    icon: Plus,
    label: { he: "יצירה מהירה", en: "Quick Create", ru: "Быстрое создание" },
    description: {
      he: "צור מסמך או ישות חדשה",
      en: "Create a document or new entity",
      ru: "Создать документ или новую сущность",
    },
    defaultSize: 2,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: true,
    component: QuickCreatePanel,
    renderBar: QuickCreateBarContent,
  },
  {
    id: "favorites",
    icon: Pin,
    label: { he: "מועדפים", en: "Favorites", ru: "Избранное" },
    description: {
      he: "דפים וקישורים שנשמרו",
      en: "Saved pages and links",
      ru: "Сохранённые страницы и ссылки",
    },
    defaultSize: 1,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: true,
    component: FavoritesPanel,
    renderBar: FavoritesBarContent,
  },
  {
    id: "today",
    icon: Calendar,
    label: { he: "היום", en: "Today", ru: "Сегодня" },
    description: {
      he: "פגישות, דדליינים ותזכורות",
      en: "Meetings, deadlines & reminders",
      ru: "Встречи, дедлайны и напоминания",
    },
    defaultSize: 2,
    status: "active",
    category: "productivity",
    tier: "free",
    isRemovable: true,
    component: TodayPanel,
    renderBar: TodayBarContent,
  },
  {
    id: "notifications",
    icon: Bell,
    label: { he: "התראות", en: "Notifications", ru: "Уведомления" },
    description: {
      he: "התראות מפרויקטים, מסמכים ו-AI",
      en: "Notifications from projects, documents & AI",
      ru: "Уведомления от проектов, документов и AI",
    },
    defaultSize: 1,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: true,
    component: NotificationsPanel,
    renderBar: NotificationsBarContent,
  },
  {
    id: "timer",
    icon: Clock,
    label: { he: "טיימר", en: "Timer", ru: "Таймер" },
    description: {
      he: "טיימר פומודורו לניהול זמן",
      en: "Pomodoro timer for time management",
      ru: "Таймер Помодоро для управления временем",
    },
    defaultSize: 2,
    status: "active",
    category: "productivity",
    tier: "free",
    isRemovable: true,
    component: TimerPanel,
    renderBar: TimerBarContent,
  },
  {
    id: "clipboard",
    icon: ClipboardList,
    label: { he: "לוח הדבקות", en: "Clipboard", ru: "Буфер обмена" },
    description: {
      he: "פריטים שהועתקו לאחרונה",
      en: "Recently copied items",
      ru: "Недавно скопированные элементы",
    },
    defaultSize: 1,
    status: "active",
    category: "productivity",
    tier: "free",
    isRemovable: true,
    component: ClipboardPanel,
    renderBar: ClipboardBarContent,
  },
  {
    id: "settings",
    icon: Settings,
    label: { he: "הגדרות", en: "Settings", ru: "Настройки" },
    description: {
      he: "השהיית ריחוף + גישה מהירה להגדרות",
      en: "Hover delay + quick access to settings",
      ru: "Задержка наведения + быстрый доступ к настройкам",
    },
    defaultSize: 1,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: false,
    component: SettingsPanel,
    renderBar: SettingsBarContent,
  },
  {
    id: "keyboard-shortcuts",
    icon: Keyboard,
    label: { he: "קיצורי מקלדת", en: "Keyboard Shortcuts", ru: "Горячие клавиши" },
    description: {
      he: "קיצורי מקלדת וניהול פעולות",
      en: "Keyboard shortcuts & action management",
      ru: "Горячие клавиши и управление действиями",
    },
    defaultSize: 1,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: true,
    component: ShortcutsPanel,
    renderBar: ShortcutsBarContent,
    panelMode: "modal",
  },
  {
    id: "weekly-planner",
    icon: CalendarDays,
    label: { he: "סדר שבועי", en: "Weekly Planner", ru: "Еженедельный план" },
    description: {
      he: "תכנון שבועי, משימות יומיות ותבניות חוזרות",
      en: "Weekly planning, daily tasks & recurring templates",
      ru: "Еженедельное планирование, ежедневные задачи и повторяющиеся шаблоны",
    },
    defaultSize: 2,
    status: "active",
    category: "productivity",
    tier: "pro",
    isRemovable: true,
    component: WeeklyPlannerPanel,
    renderBar: WeeklyPlannerBarContent,
    panelMode: "modal",
  },
  // ─── Communications & Team ────────────────────────────────────
  {
    id: "wati",
    icon: MessageCircle,
    label: { he: "הודעות WATI", en: "WATI Messages", ru: "Сообщения WATI" },
    description: {
      he: "הודעות WhatsApp אחרונות שצריכות תשומת לב",
      en: "Recent WhatsApp messages needing attention",
      ru: "Последние сообщения WhatsApp, требующие внимания",
    },
    defaultSize: 2,
    status: "active",
    category: "ai_comms",
    tier: "pro",
    isRemovable: true,
    component: WATIPanel,
    renderBar: WATIBarContent,
  },
  {
    id: "team",
    icon: Users,
    label: { he: "צוות", en: "Team", ru: "Команда" },
    description: {
      he: "מי online, מי עובד על מה",
      en: "Who's online, who's working on what",
      ru: "Кто онлайн, кто над чем работает",
    },
    defaultSize: 2,
    status: "active",
    category: "team",
    tier: "business",
    isRemovable: true,
    component: TeamPanel,
    renderBar: TeamBarContent,
  },
  {
    id: "kpi",
    icon: BarChart3,
    label: { he: "מדדים", en: "KPIs", ru: "Показатели" },
    description: {
      he: "מדדים מהירים — פרויקטים פתוחים, מסמכים, בריאות",
      en: "Quick metrics — open projects, documents, health",
      ru: "Быстрые метрики — открытые проекты, документы, здоровье",
    },
    defaultSize: 2,
    status: "active",
    category: "analytics",
    tier: "free",
    isRemovable: true,
    component: KPIPanel,
    renderBar: KPIBarContent,
  },
  {
    id: "leads-pipeline",
    icon: TrendingUp,
    label: { he: "צנרת לידים", en: "Leads Pipeline", ru: "Воронка лидов" },
    description: {
      he: "שלבי צנרת מכירות — תצוגת פאנל אופקית",
      en: "Sales pipeline stages — horizontal funnel view",
      ru: "Этапы воронки продаж — горизонтальный вид воронки",
    },
    defaultSize: 2,
    status: "active",
    category: "analytics",
    tier: "free",
    isRemovable: true,
    component: LeadsPipelinePanel,
    renderBar: LeadsPipelineBarContent,
  },
  {
    id: "matching",
    icon: Sparkles,
    label: { he: "התאמות", en: "Matching", ru: "Совпадения" },
    description: {
      he: "התאמות AI בין ישויות — עובדים, פרויקטים, קבלנים",
      en: "AI matching between entities — workers, projects, contractors",
      ru: "AI-сопоставление сущностей — работники, проекты, подрядчики",
    },
    defaultSize: 2,
    status: "active",
    category: "analytics",
    tier: "pro",
    isRemovable: true,
    component: MatchingPanel,
    renderBar: MatchingBarContent,
    panelMode: "side-panel",
  },
  {
    id: "rss",
    icon: Rss,
    label: { he: "עדכוני RSS", en: "RSS Feeds", ru: "RSS-ленты" },
    description: {
      he: "חדשות נדל\"ן ובנייה — כותרות אחרונות",
      en: "Construction & real estate news — latest headlines",
      ru: "Новости строительства и недвижимости — последние заголовки",
    },
    defaultSize: 1,
    status: "active",
    category: "integrations",
    tier: "free",
    isRemovable: true,
    component: RssPanel,
    renderBar: RssBarContent,
  },
  {
    id: "shortcuts",
    icon: ExternalLink,
    label: { he: "קיצורים", en: "Quick Links", ru: "Ссылки" },
    description: {
      he: "לינקים מהירים לאוריגמי, Notion, WATI, n8n",
      en: "Quick links to Origami, Notion, WATI, n8n",
      ru: "Быстрые ссылки на Origami, Notion, WATI, n8n",
    },
    defaultSize: 1,
    status: "active",
    category: "integrations",
    tier: "free",
    isRemovable: true,
    component: ExternalLinksPanel,
    renderBar: ExternalLinksBarContent,
  },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return widgetRegistry.find((w) => w.id === id);
}
