import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { Settings, Search, Bot, Plus, Pin, Calendar, CalendarDays, Bell, Clock, ClipboardList, MessageCircle, Users, BarChart3, ExternalLink, Keyboard } from "lucide-react";
import { SettingsPanel, SettingsBarContent } from "./SettingsWidget";
import { SearchPanel, SearchBarContent } from "./SearchWidget";
import { AIPanel, AIBarContent } from "./AIWidget";
import { QuickCreatePanel, QuickCreateBarContent } from "./QuickCreateWidget";
import { FavoritesPanel, FavoritesBarContent } from "./FavoritesWidget";
import { TodayPanel, TodayBarContent } from "./TodayWidget";
import { NotificationsPanel, NotificationsBarContent } from "./NotificationsWidget";
import { TimerPanel, TimerBarContent } from "./TimerWidget";
import { ClipboardPanel, ClipboardBarContent } from "./ClipboardWidget";
import { ShortcutsPanel, ShortcutsBarContent } from "./ShortcutsWidget";
import { WeeklyPlannerPanel, WeeklyPlannerBarContent } from "./WeeklyPlannerWidget";

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
  label: { he: string; en: string };
  description: { he: string; en: string };
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
    label: { he: "חיפוש", en: "Search" },
    description: {
      he: "חיפוש פרויקטים, מסמכים ושיחות",
      en: "Search projects, documents & conversations",
    },
    defaultSize: 2,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: false,
    component: SearchPanel as ComponentType,
    renderBar: SearchBarContent,
    panelMode: "modal",
  },
  {
    id: "ai-assistant",
    icon: Bot,
    label: { he: "עוזר AI", en: "AI Assistant" },
    description: {
      he: "עוזר AI מהיר עם הקשר לעמוד",
      en: "Quick AI assistant with page context",
    },
    defaultSize: 1,
    status: "active",
    category: "ai_comms",
    tier: "free",
    isRemovable: true,
    component: AIPanel as ComponentType,
    renderBar: AIBarContent,
    panelMode: "side-panel",
  },
  {
    id: "quick-create",
    icon: Plus,
    label: { he: "יצירה מהירה", en: "Quick Create" },
    description: {
      he: "צור מסמך, פרויקט או משימה",
      en: "Create a document, project or task",
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
    label: { he: "מועדפים", en: "Favorites" },
    description: {
      he: "דפים וקישורים שנשמרו",
      en: "Saved pages and links",
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
    label: { he: "היום", en: "Today" },
    description: {
      he: "פגישות, דדליינים ותזכורות",
      en: "Meetings, deadlines & reminders",
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
    label: { he: "התראות", en: "Notifications" },
    description: {
      he: "התראות מפרויקטים, מסמכים ו-AI",
      en: "Notifications from projects, documents & AI",
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
    label: { he: "טיימר", en: "Timer" },
    description: {
      he: "טיימר פומודורו לניהול זמן",
      en: "Pomodoro timer for time management",
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
    label: { he: "לוח הדבקות", en: "Clipboard" },
    description: {
      he: "פריטים שהועתקו לאחרונה",
      en: "Recently copied items",
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
    label: { he: "הגדרות", en: "Settings" },
    description: {
      he: "השהיית ריחוף + גישה מהירה להגדרות",
      en: "Hover delay + quick access to settings",
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
    label: { he: "קיצורי מקלדת", en: "Keyboard Shortcuts" },
    description: {
      he: "קיצורי מקלדת וניהול פעולות",
      en: "Keyboard shortcuts & action management",
    },
    defaultSize: 1,
    status: "active",
    category: "basics",
    tier: "free",
    isRemovable: true,
    component: ShortcutsPanel as ComponentType,
    renderBar: ShortcutsBarContent,
    panelMode: "modal",
  },
  {
    id: "weekly-planner",
    icon: CalendarDays,
    label: { he: "סדר שבועי", en: "Weekly Planner" },
    description: {
      he: "תכנון שבועי, משימות יומיות ותבניות חוזרות",
      en: "Weekly planning, daily tasks & recurring templates",
    },
    defaultSize: 2,
    status: "active",
    category: "productivity",
    tier: "pro",
    isRemovable: true,
    component: WeeklyPlannerPanel as ComponentType,
    renderBar: WeeklyPlannerBarContent,
    panelMode: "modal",
  },
  // ─── Coming Soon ─────────────────────────────────────────────────
  {
    id: "wati",
    icon: MessageCircle,
    label: { he: "הודעות WATI", en: "WATI Messages" },
    description: {
      he: "הודעות WhatsApp אחרונות שצריכות תשומת לב",
      en: "Recent WhatsApp messages needing attention",
    },
    defaultSize: 2,
    status: "coming-soon",
    category: "ai_comms",
    tier: "pro",
    isRemovable: true,
  },
  {
    id: "team",
    icon: Users,
    label: { he: "צוות", en: "Team" },
    description: {
      he: "מי online, מי עובד על מה",
      en: "Who's online, who's working on what",
    },
    defaultSize: 2,
    status: "coming-soon",
    category: "team",
    tier: "business",
    isRemovable: true,
  },
  {
    id: "kpi",
    icon: BarChart3,
    label: { he: "מדדים", en: "KPIs" },
    description: {
      he: "מדדים מהירים — פרויקטים פתוחים, לידים, הכנסה חודשית",
      en: "Quick metrics — open projects, leads, monthly revenue",
    },
    defaultSize: 2,
    status: "coming-soon",
    category: "analytics",
    tier: "pro",
    isRemovable: true,
  },
  {
    id: "shortcuts",
    icon: ExternalLink,
    label: { he: "קיצורים", en: "Shortcuts" },
    description: {
      he: "לינקים מהירים לאוריגמי, Notion, WATI, n8n",
      en: "Quick links to Origami, Notion, WATI, n8n",
    },
    defaultSize: 2,
    status: "coming-soon",
    category: "integrations",
    tier: "free",
    isRemovable: true,
  },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return widgetRegistry.find((w) => w.id === id);
}
