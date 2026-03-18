// ===================================================
// App Catalog — Single Source of Truth
// Every app, page, widget, and tool in vBrain.io
// ===================================================

export type AppStatus = "active" | "beta" | "coming-soon" | "deprecated";
export type AppCategory = "core" | "content" | "tools" | "data" | "communication" | "system" | "widgets";
export type AppTier = "free" | "pro" | "business";

export interface AppDefinition {
  /** Unique ID — used everywhere */
  id: string;
  /** URL-friendly key (matches Sidebar key) */
  key: string;
  /** Display name */
  name: { he: string; en: string };
  /** One-line purpose */
  purpose: { he: string; en: string };
  /** What this app contains / can do */
  contains: string[];
  /** Category for grouping */
  category: AppCategory;
  /** Current status */
  status: AppStatus;
  /** Pricing tier */
  tier: AppTier;
  /** Route path */
  href: string;
  /** Lucide icon name */
  iconName: string;
  /** Brand gradient colors [from, to] */
  gradient: [string, string];
  /** Sub-pages (nested routes) */
  subPages?: { key: string; href: string; name: { he: string; en: string } }[];
  /** Connected contexts */
  contexts?: string[];
  /** Connected API routes */
  apiRoutes?: string[];
  /** Dependencies (other app IDs) */
  dependsOn?: string[];
  /** Build phase */
  phase: number;
}

export interface WidgetDefinition {
  id: string;
  name: { he: string; en: string };
  purpose: { he: string; en: string };
  status: AppStatus;
  tier: AppTier;
  panelMode: "dropdown" | "modal" | "side-panel";
  iconName: string;
  gradient: [string, string];
  category: "utility" | "data" | "communication" | "productivity";
}

// ─── App Catalog ────────────────────────────────────────

export const APP_CATALOG: AppDefinition[] = [
  // ═══ CORE ═══
  {
    id: "dashboard",
    key: "dashboard",
    name: { he: "דשבורד", en: "Dashboard" },
    purpose: { he: "מסך הבית — סקירה כללית, KPI, פעילות אחרונה", en: "Home screen — overview, KPIs, recent activity" },
    contains: ["KPI cards", "Recent activity feed", "Quick actions", "System health"],
    category: "core",
    status: "active",
    tier: "free",
    href: "/dashboard",
    iconName: "LayoutDashboard",
    gradient: ["#6366f1", "#818cf8"],
    contexts: ["settings", "widget", "auth"],
    phase: 1,
  },
  {
    id: "app-launcher",
    key: "appLauncher",
    name: { he: "כל האפליקציות", en: "App Launcher" },
    purpose: { he: "מסך כל האפליקציות — גישה מהירה לכל מה שבמערכת", en: "All apps screen — quick access to everything in the system" },
    contains: ["Grid layout", "Drag & drop", "Folders", "Multi-page", "Search", "Preview panel"],
    category: "core",
    status: "active",
    tier: "free",
    href: "/dashboard/app-launcher",
    iconName: "Grid3x3",
    gradient: ["#8b5cf6", "#a78bfa"],
    phase: 1,
  },
  {
    id: "layers",
    key: "layers",
    name: { he: "שכבות", en: "Layers" },
    purpose: { he: "ניהול שכבות פרויקט — מבנה היררכי של כל הישויות", en: "Project layers — hierarchical structure of all entities" },
    contains: ["Layer list", "Layer detail", "Entity grouping", "Status tracking"],
    category: "core",
    status: "active",
    tier: "free",
    href: "/dashboard/layers",
    iconName: "Layers3",
    gradient: ["#f43f5e", "#fb7185"],
    subPages: [{ key: "layer-detail", href: "/dashboard/layers/[id]", name: { he: "פרטי שכבה", en: "Layer Detail" } }],
    contexts: ["settings"],
    phase: 1,
  },
  {
    id: "editor",
    key: "editor",
    name: { he: "עורך", en: "Editor" },
    purpose: { he: "עורך מסמכים מבוסס Tiptap — שמירה אוטומטית, עבודה אופליין", en: "Tiptap document editor — auto-save, offline support" },
    contains: ["Rich text editor", "Auto-save", "Offline queue", "Field library", "Canvas toolbar"],
    category: "core",
    status: "active",
    tier: "free",
    href: "/dashboard/editor",
    iconName: "FileText",
    gradient: ["#f59e0b", "#fbbf24"],
    contexts: ["canvas"],
    phase: 1,
  },

  // ═══ CONTENT ═══
  {
    id: "entities",
    key: "entities",
    name: { he: "ישויות", en: "Entities" },
    purpose: { he: "פלטפורמת ניהול ישויות — 6 תצוגות, תבניות, פעולות מרובות", en: "Entity management platform — 6 views, templates, bulk operations" },
    contains: ["List view", "Card view", "Table view", "Detail page", "Template system", "Bulk operations"],
    category: "content",
    status: "active",
    tier: "free",
    href: "/dashboard/entities",
    iconName: "Database",
    gradient: ["#3b82f6", "#60a5fa"],
    subPages: [
      { key: "entity-type", href: "/dashboard/entities/[type]", name: { he: "סוג ישות", en: "Entity Type" } },
      { key: "entity-detail", href: "/dashboard/entities/[type]/[id]", name: { he: "פרטי ישות", en: "Entity Detail" } },
    ],
    apiRoutes: ["/api/entities"],
    phase: 1,
  },
  {
    id: "documents",
    key: "documents",
    name: { he: "מסמכים", en: "Documents" },
    purpose: { he: "מנוע מסמכים — תבניות, חתימות דיגיטליות, PDF, מעקב", en: "Document engine — templates, digital signatures, PDF, tracking" },
    contains: ["Template editor", "Field definitions", "Signing flow", "PDF generation", "Audit log", "Email reminders"],
    category: "content",
    status: "active",
    tier: "pro",
    href: "/dashboard/documents",
    iconName: "FileCheck",
    gradient: ["#0ea5e9", "#38bdf8"],
    subPages: [
      { key: "doc-detail", href: "/dashboard/documents/[id]", name: { he: "פרטי מסמך", en: "Document Detail" } },
      { key: "templates", href: "/dashboard/documents/templates", name: { he: "תבניות", en: "Templates" } },
      { key: "template-edit", href: "/dashboard/documents/templates/[id]", name: { he: "עריכת תבנית", en: "Edit Template" } },
    ],
    apiRoutes: ["/api/documents/send", "/api/documents/pdf", "/api/documents/templates"],
    phase: 2,
  },
  {
    id: "wiki",
    key: "wiki",
    name: { he: "ויקי", en: "Wiki" },
    purpose: { he: "מאגר ידע פנימי — דפים, חיפוש, קטגוריות", en: "Internal knowledge base — pages, search, categories" },
    contains: ["Page list", "Page editor", "Search", "Categories"],
    category: "content",
    status: "active",
    tier: "free",
    href: "/dashboard/wiki",
    iconName: "BookOpen",
    gradient: ["#f97316", "#fb923c"],
    subPages: [
      { key: "wiki-page", href: "/dashboard/wiki/[id]", name: { he: "דף ויקי", en: "Wiki Page" } },
      { key: "wiki-new", href: "/dashboard/wiki/new", name: { he: "דף חדש", en: "New Page" } },
    ],
    phase: 2,
  },

  // ═══ TOOLS ═══
  {
    id: "ai-hub",
    key: "ai-hub",
    name: { he: "מרכז AI", en: "AI Hub" },
    purpose: { he: "מרכז בינה מלאכותית — 5 מצבים + 6 סוכנים + בסיס ידע", en: "AI center — 5 modes + 6 agents + knowledge base" },
    contains: ["Chat mode", "Analyze mode", "Write mode", "Decompose mode", "Work Manager (6 agents)", "Knowledge base injection"],
    category: "tools",
    status: "active",
    tier: "free",
    href: "/dashboard/ai-hub",
    iconName: "Sparkles",
    gradient: ["#8b5cf6", "#a78bfa"],
    apiRoutes: ["/api/ai/chat", "/api/ai/work-manager"],
    contexts: ["settings"],
    phase: 1,
  },
  {
    id: "story-map",
    key: "story-map",
    name: { he: "מפת סיפור", en: "Story Map" },
    purpose: { he: "מיפוי סיפורי משתמש — 3 שכבות, גרירה, Realtime, סינון", en: "User story mapping — 3 tiers, DnD, Realtime, filters" },
    contains: ["3-tier DnD board", "Realtime sync", "Filters", "Export", "Kanban view"],
    category: "tools",
    status: "active",
    tier: "free",
    href: "/dashboard/story-map",
    iconName: "Map",
    gradient: ["#10b981", "#34d399"],
    phase: 2,
  },
  {
    id: "functional-map",
    key: "functional-map",
    name: { he: "מפה פונקציונלית", en: "Functional Map" },
    purpose: { he: "מפת GAM — 3 רמות × 5 פונקציות, מבנה נעול", en: "GAM functional map — 3 levels × 5 functions, locked structure" },
    contains: ["3-level hierarchy", "5 business functions", "Read-only structure"],
    category: "tools",
    status: "active",
    tier: "free",
    href: "/dashboard/functional-map",
    iconName: "Network",
    gradient: ["#06b6d4", "#22d3ee"],
    phase: 2,
  },
  {
    id: "vclip",
    key: "vclip",
    name: { he: "vClip", en: "vClip" },
    purpose: { he: "מקליט מסך — הקלטה, ספרייה, הורדה, ZIP", en: "Screen recorder — record, library, download, ZIP" },
    contains: ["In-app recorder", "Video library", "Download page", "Chrome extension", "Vercel Blob storage"],
    category: "tools",
    status: "active",
    tier: "pro",
    href: "/dashboard/vclip",
    iconName: "Video",
    gradient: ["#ef4444", "#f87171"],
    subPages: [
      { key: "vclip-download", href: "/dashboard/vclip/download", name: { he: "הורדה", en: "Download" } },
      { key: "vclip-library", href: "/dashboard/vclip/library", name: { he: "ספרייה", en: "Library" } },
    ],
    phase: 2,
  },
  {
    id: "weekly-planner",
    key: "weeklyPlanner",
    name: { he: "תכנית שבועית", en: "Weekly Planner" },
    purpose: { he: "תכנון שבועי — משימות, לוח זמנים, תצוגת שבוע", en: "Weekly planning — tasks, schedule, week view" },
    contains: ["Week view", "Task management", "Drag & drop scheduling"],
    category: "tools",
    status: "active",
    tier: "pro",
    href: "/dashboard/weekly-planner",
    iconName: "CalendarDays",
    gradient: ["#f59e0b", "#fbbf24"],
    contexts: ["weekly-planner"],
    phase: 2,
  },
  {
    id: "matching",
    key: "matching",
    name: { he: "מנוע התאמה", en: "Matching Engine" },
    purpose: { he: "התאמת מועמדים למשרות — סינון, דירוג, ניקוד", en: "Candidate-job matching — filtering, ranking, scoring" },
    contains: ["Job details panel", "Candidate cards", "Match percentage", "Filters", "Actions"],
    category: "tools",
    status: "active",
    tier: "business",
    href: "/dashboard/matching",
    iconName: "Lightbulb",
    gradient: ["#a855f7", "#c084fc"],
    phase: 3,
  },

  // ═══ COMMUNICATION ═══
  {
    id: "comms",
    key: "comms",
    name: { he: "תקשורת", en: "Communications" },
    purpose: { he: "מרכז תקשורת — הודעות, שיחות, היסטוריה", en: "Communication center — messages, calls, history" },
    contains: ["Message timeline", "Communication panel", "Contact history"],
    category: "communication",
    status: "active",
    tier: "free",
    href: "/dashboard/comms",
    iconName: "MessageSquare",
    gradient: ["#06b6d4", "#22d3ee"],
    phase: 2,
  },
  {
    id: "email-templates",
    key: "emailTemplates",
    name: { he: "תבניות דוא״ל", en: "Email Templates" },
    purpose: { he: "ניהול תבניות אימייל — עיצוב, תצוגה מקדימה, שליחה", en: "Email template management — design, preview, send" },
    contains: ["Template list", "Template editor", "Preview", "Send"],
    category: "communication",
    status: "active",
    tier: "free",
    href: "/dashboard/email-templates",
    iconName: "Mail",
    gradient: ["#ec4899", "#f472b6"],
    phase: 2,
  },

  // ═══ DATA & ANALYTICS ═══
  {
    id: "feeds",
    key: "feeds",
    name: { he: "פידים", en: "Feeds" },
    purpose: { he: "קורא RSS — 5 פידים ישראליים, עדכון אוטומטי", en: "RSS reader — 5 Israeli feeds, auto-refresh via Vercel Cron" },
    contains: ["Feed list", "Article reader", "Cron auto-refresh", "Category filters"],
    category: "data",
    status: "active",
    tier: "free",
    href: "/dashboard/feeds",
    iconName: "Rss",
    gradient: ["#f97316", "#fb923c"],
    apiRoutes: ["/api/rss"],
    phase: 1,
  },
  {
    id: "audit",
    key: "audit",
    name: { he: "לוג ביקורת", en: "Audit Log" },
    purpose: { he: "לוג פעולות — מעקב אחרי כל שינוי במערכת", en: "Audit log — track all system changes" },
    contains: ["Action log", "User tracking", "Filters", "Timeline"],
    category: "data",
    status: "active",
    tier: "free",
    href: "/dashboard/audit",
    iconName: "Shield",
    gradient: ["#64748b", "#94a3b8"],
    phase: 1,
  },
  {
    id: "roadmap",
    key: "roadmap",
    name: { he: "מפת דרכים", en: "Roadmap" },
    purpose: { he: "ויזואליזציה של תכנון — 6 שכבות Notion, מטרות עד משימות", en: "Planning visualization — 6 Notion layers, goals to tasks" },
    contains: ["Goal → Portfolio → Project → Sprint → Task → Sub-task", "Notion DB drill-down", "Status tracking"],
    category: "data",
    status: "active",
    tier: "free",
    href: "/dashboard/roadmap",
    iconName: "Compass",
    gradient: ["#8b5cf6", "#a78bfa"],
    phase: 1,
  },

  // ═══ SYSTEM ═══
  {
    id: "architecture",
    key: "architecture",
    name: { he: "ארכיטקטורה", en: "Architecture" },
    purpose: { he: "מפת המערכת — כל האפליקציות, הקשרים, ותרשימי מבנה", en: "System map — all apps, connections, and structure diagrams" },
    contains: ["Site map", "App cards", "Mermaid diagrams", "Tool stack", "Connection graph"],
    category: "system",
    status: "active",
    tier: "free",
    href: "/dashboard/architecture",
    iconName: "GitBranch",
    gradient: ["#0ea5e9", "#38bdf8"],
    phase: 1,
  },
  {
    id: "design-system",
    key: "design-system",
    name: { he: "מערכת עיצוב", en: "Design System" },
    purpose: { he: "גלריית קומפוננטות — 127 רכיבים, צבעים, טיפוגרפיה", en: "Component gallery — 127 components, colors, typography" },
    contains: ["Component gallery", "Color palette", "Typography samples", "Icon library"],
    category: "system",
    status: "active",
    tier: "free",
    href: "/dashboard/design-system",
    iconName: "Palette",
    gradient: ["#ec4899", "#f472b6"],
    phase: 1,
  },
  {
    id: "plan",
    key: "plan",
    name: { he: "תוכנית", en: "Plan" },
    purpose: { he: "תוכנית פרויקט — יעדים, לו״ז, תלויות", en: "Project plan — goals, timeline, dependencies" },
    contains: ["Project goals", "Timeline", "Dependencies", "Milestones"],
    category: "system",
    status: "active",
    tier: "free",
    href: "/dashboard/plan",
    iconName: "Zap",
    gradient: ["#14b8a6", "#2dd4bf"],
    phase: 1,
  },
  {
    id: "settings",
    key: "settings",
    name: { he: "הגדרות", en: "Settings" },
    purpose: { he: "הגדרות מערכת — צבע, גופן, צפיפות, שפה, סקין", en: "System settings — accent, font, density, language, skin" },
    contains: ["Accent color", "Font picker", "Density", "Language", "Skin system", "Shell preferences"],
    category: "system",
    status: "active",
    tier: "free",
    href: "/dashboard/settings",
    iconName: "Settings",
    gradient: ["#64748b", "#94a3b8"],
    contexts: ["settings"],
    phase: 1,
  },
  {
    id: "admin",
    key: "admin",
    name: { he: "מנהל", en: "Admin" },
    purpose: { he: "רגיסטרי מערכת — כל הנתיבים, ווידג׳טים, הקשרים", en: "System registry — all routes, widgets, contexts" },
    contains: ["Route registry", "Widget registry", "Context registry", "System health", "Icon library"],
    category: "system",
    status: "active",
    tier: "free",
    href: "/dashboard/admin",
    iconName: "Lock",
    gradient: ["#ef4444", "#f87171"],
    subPages: [
      { key: "admin-components", href: "/dashboard/admin/components", name: { he: "קומפוננטות", en: "Components" } },
      { key: "admin-icons", href: "/dashboard/admin/icon-library", name: { he: "ספריית אייקונים", en: "Icon Library" } },
    ],
    phase: 1,
  },
  {
    id: "control",
    key: "control",
    name: { he: "בקרה", en: "Control" },
    purpose: { he: "לוח בקרה CEO — הנחיות, אינדקס לינקים, מעקב", en: "CEO control panel — directives, links index, tracking" },
    contains: ["CEO intake", "Links index", "Status tracking", "Priority management"],
    category: "system",
    status: "active",
    tier: "free",
    href: "/dashboard/control",
    iconName: "Radio",
    gradient: ["#eab308", "#facc15"],
    phase: 1,
  },

  // ═══ COMING SOON ═══
  {
    id: "vcloud",
    key: "vcloud",
    name: { he: "vCloud", en: "vCloud" },
    purpose: { he: "אחסון קבצים בענן — תמונות, וידאו, מסמכים, סאונד", en: "Cloud file storage — images, video, documents, sound" },
    contains: ["File browser", "Upload", "Categories", "Preview"],
    category: "tools",
    status: "coming-soon",
    tier: "business",
    href: "/dashboard/vcloud",
    iconName: "Cloud",
    gradient: ["#0ea5e9", "#38bdf8"],
    phase: 3,
  },
  {
    id: "integrations",
    key: "integrations",
    name: { he: "אינטגרציות", en: "Integrations" },
    purpose: { he: "חנות אינטגרציות — חיבור לשירותים חיצוניים", en: "Integration store — connect external services" },
    contains: ["Integration catalog", "Connection setup", "Status monitoring"],
    category: "system",
    status: "coming-soon",
    tier: "pro",
    href: "/dashboard/integrations",
    iconName: "Zap",
    gradient: ["#a855f7", "#c084fc"],
    phase: 2,
  },
  {
    id: "grid",
    key: "grid",
    name: { he: "גיליון", en: "Grid" },
    purpose: { he: "גיליון אלקטרוני — עבודה עם נתונים בפורמט טבלאי", en: "Spreadsheet — work with data in tabular format" },
    contains: ["Spreadsheet view", "Formulas", "Filters", "Import/Export"],
    category: "tools",
    status: "coming-soon",
    tier: "pro",
    href: "/dashboard/grid",
    iconName: "Grid3x3",
    gradient: ["#22c55e", "#4ade80"],
    phase: 2,
  },
  {
    id: "slides",
    key: "slides",
    name: { he: "מצגות", en: "Slides" },
    purpose: { he: "בונה מצגות — עיצוב, אנימציה, שיתוף", en: "Presentation builder — design, animation, sharing" },
    contains: ["Slide editor", "Templates", "Animations", "Share/Export"],
    category: "tools",
    status: "coming-soon",
    tier: "pro",
    href: "/dashboard/slides",
    iconName: "Presentation",
    gradient: ["#a855f7", "#c084fc"],
    phase: 2,
  },
];

// ─── Widget Catalog ─────────────────────────────────────

export const WIDGET_CATALOG: WidgetDefinition[] = [
  { id: "search", name: { he: "חיפוש", en: "Search" }, purpose: { he: "חיפוש גלובלי", en: "Global search" }, status: "active", tier: "free", panelMode: "dropdown", iconName: "Search", gradient: ["#3b82f6", "#60a5fa"], category: "utility" },
  { id: "ai-assistant", name: { he: "עוזר AI", en: "AI Assistant" }, purpose: { he: "צ׳אט AI מהיר", en: "Quick AI chat" }, status: "active", tier: "free", panelMode: "modal", iconName: "Bot", gradient: ["#8b5cf6", "#a78bfa"], category: "productivity" },
  { id: "quick-create", name: { he: "יצירה מהירה", en: "Quick Create" }, purpose: { he: "יצירת ישות/מסמך חדש", en: "Create new entity/document" }, status: "active", tier: "free", panelMode: "dropdown", iconName: "Plus", gradient: ["#10b981", "#34d399"], category: "utility" },
  { id: "favorites", name: { he: "מועדפות", en: "Favorites" }, purpose: { he: "גישה מהירה לפריטים מועדפים", en: "Quick access to favorite items" }, status: "active", tier: "free", panelMode: "modal", iconName: "Star", gradient: ["#f59e0b", "#fbbf24"], category: "utility" },
  { id: "today", name: { he: "היום", en: "Today" }, purpose: { he: "סקירת היום — אירועים, משימות", en: "Today overview — events, tasks" }, status: "active", tier: "free", panelMode: "side-panel", iconName: "Calendar", gradient: ["#06b6d4", "#22d3ee"], category: "productivity" },
  { id: "notifications", name: { he: "התראות", en: "Notifications" }, purpose: { he: "התראות מערכת", en: "System notifications" }, status: "active", tier: "free", panelMode: "dropdown", iconName: "Bell", gradient: ["#f43f5e", "#fb7185"], category: "utility" },
  { id: "timer", name: { he: "טיימר", en: "Timer" }, purpose: { he: "מעקב זמן ועצירה", en: "Time tracking and stopwatch" }, status: "active", tier: "free", panelMode: "dropdown", iconName: "Clock", gradient: ["#ef4444", "#f87171"], category: "productivity" },
  { id: "clipboard", name: { he: "לוח עזר", en: "Clipboard" }, purpose: { he: "לוח הדבקות חכם", en: "Smart clipboard" }, status: "active", tier: "free", panelMode: "dropdown", iconName: "ClipboardList", gradient: ["#64748b", "#94a3b8"], category: "utility" },
  { id: "weekly-planner", name: { he: "תכנית שבועית", en: "Weekly Planner" }, purpose: { he: "ווידג׳ט תכנון שבועי", en: "Weekly planner widget" }, status: "active", tier: "pro", panelMode: "side-panel", iconName: "CalendarDays", gradient: ["#f59e0b", "#fbbf24"], category: "productivity" },
  { id: "ceo-queue", name: { he: "תור CEO", en: "CEO Queue" }, purpose: { he: "הנחיות CEO בזמן אמת", en: "CEO directives in real-time" }, status: "active", tier: "free", panelMode: "dropdown", iconName: "Radio", gradient: ["#eab308", "#facc15"], category: "data" },
  { id: "wati", name: { he: "WATI", en: "WATI" }, purpose: { he: "WhatsApp Business", en: "WhatsApp Business" }, status: "active", tier: "pro", panelMode: "side-panel", iconName: "MessageSquare", gradient: ["#22c55e", "#4ade80"], category: "communication" },
  { id: "leads-pipeline", name: { he: "צינור לידים", en: "Leads Pipeline" }, purpose: { he: "ניהול לידים ומשפך מכירות", en: "Lead management and sales funnel" }, status: "active", tier: "business", panelMode: "side-panel", iconName: "TrendingUp", gradient: ["#14b8a6", "#2dd4bf"], category: "data" },
  { id: "communication", name: { he: "תקשורת", en: "Communication" }, purpose: { he: "ציר זמן תקשורת", en: "Communication timeline" }, status: "active", tier: "pro", panelMode: "side-panel", iconName: "MessageCircle", gradient: ["#06b6d4", "#22d3ee"], category: "communication" },
  { id: "email-stats", name: { he: "סטטיסטיקות דוא״ל", en: "Email Stats" }, purpose: { he: "נתוני שליחת אימיילים", en: "Email sending analytics" }, status: "active", tier: "pro", panelMode: "modal", iconName: "BarChart3", gradient: ["#ec4899", "#f472b6"], category: "data" },
  { id: "gmail", name: { he: "Gmail", en: "Gmail" }, purpose: { he: "אינטגרציית Gmail", en: "Gmail integration" }, status: "active", tier: "pro", panelMode: "modal", iconName: "Mail", gradient: ["#ef4444", "#f87171"], category: "communication" },
  { id: "google-calendar", name: { he: "Google Calendar", en: "Google Calendar" }, purpose: { he: "אינטגרציית Google Calendar", en: "Google Calendar integration" }, status: "active", tier: "pro", panelMode: "modal", iconName: "Calendar", gradient: ["#3b82f6", "#60a5fa"], category: "productivity" },
];

// ─── Helpers ────────────────────────────────────────────

export function getAppById(id: string) {
  return APP_CATALOG.find((a) => a.id === id);
}

export function getAppsByCategory(category: AppCategory) {
  return APP_CATALOG.filter((a) => a.category === category);
}

export function getActiveApps() {
  return APP_CATALOG.filter((a) => a.status === "active");
}

export function getAppGradient(id: string): [string, string] {
  const app = APP_CATALOG.find((a) => a.id === id);
  if (app) return app.gradient;
  const widget = WIDGET_CATALOG.find((w) => w.id === id);
  if (widget) return widget.gradient;
  return ["#475569", "#64748b"];
}

export const CATEGORY_META: Record<AppCategory, { name: { he: string; en: string }; gradient: [string, string] }> = {
  core: { name: { he: "ליבה", en: "Core" }, gradient: ["#6366f1", "#818cf8"] },
  content: { name: { he: "תוכן", en: "Content" }, gradient: ["#3b82f6", "#60a5fa"] },
  tools: { name: { he: "כלים", en: "Tools" }, gradient: ["#10b981", "#34d399"] },
  data: { name: { he: "נתונים", en: "Data & Analytics" }, gradient: ["#f97316", "#fb923c"] },
  communication: { name: { he: "תקשורת", en: "Communication" }, gradient: ["#06b6d4", "#22d3ee"] },
  system: { name: { he: "מערכת", en: "System" }, gradient: ["#64748b", "#94a3b8"] },
  widgets: { name: { he: "ווידג׳טים", en: "Widgets" }, gradient: ["#a855f7", "#c084fc"] },
};
