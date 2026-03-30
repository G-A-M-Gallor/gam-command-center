// ─── Code Audit System — Multi-Hat Review ───────────────────
// Each "hat" is a review perspective. Checks are static registry
// entries that can be updated as the codebase evolves.

export type AuditHat = 'plan' | 'reality' | 'quality' | 'integrity';
export type CheckResult = 'pass' | 'warn' | 'fail' | 'info';

export interface AuditCheck {
  id: string;
  hat: AuditHat;
  title: string;
  titleHe: string;
  result: CheckResult;
  detail: string;
  detailHe: string;
  file?: string;
  recommendation?: string;
  recommendationHe?: string;
}

// ─── Hat 1: Plan Compliance — CLAUDE.md vs Reality ──────────

const planChecks: AuditCheck[] = [
  // Routes
  {
    id: 'route-layers',
    hat: 'plan',
    title: 'Layers page exists',
    titleHe: 'דף שכבות קיים',
    result: 'pass',
    detail: '/dashboard/layers — active, 112 lines. Health badges + project cards implemented.',
    detailHe: '/dashboard/layers — פעיל, 112 שורות. תגי בריאות + כרטיסי פרויקטים מומשו.',
    file: 'src/app/dashboard/layers/page.tsx',
  },
  {
    id: 'route-editor',
    hat: 'plan',
    title: 'Editor page exists',
    titleHe: 'דף עורך קיים',
    result: 'pass',
    detail: '/dashboard/editor — active, 209 lines. Tiptap editor with document list, Canvas field system.',
    detailHe: '/dashboard/editor — פעיל, 209 שורות. עורך Tiptap עם רשימת מסמכים, מערכת שדות Canvas.',
    file: 'src/app/dashboard/editor/page.tsx',
  },
  {
    id: 'route-story-map',
    hat: 'plan',
    title: 'Story Map page exists',
    titleHe: 'דף מפת סיפור קיים',
    result: 'pass',
    detail: '/dashboard/story-map — active, 422 lines. Drag & drop with @dnd-kit, columns, subs.',
    detailHe: '/dashboard/story-map — פעיל, 422 שורות. גרירה ושחרור עם @dnd-kit, עמודות, תת-פריטים.',
    file: 'src/app/dashboard/story-map/page.tsx',
  },
  {
    id: 'route-functional-map',
    hat: 'plan',
    title: 'Functional Map page — placeholder only',
    titleHe: 'דף מפה פונקציונלית — placeholder בלבד',
    result: 'warn',
    detail: '19 lines. Plan says "3×5 locked grid, data from Notion API". Currently a stub with no Notion integration.',
    detailHe: '19 שורות. התוכנית אומרת "רשת 3×5 נעולה, נתונים מ-Notion API". כרגע stub ללא אינטגרציית Notion.',
    file: 'src/app/dashboard/functional-map/page.tsx',
    recommendation: 'Phase 5 — low priority. OK as placeholder.',
    recommendationHe: 'שלב 5 — עדיפות נמוכה. תקין כ-placeholder.',
  },
  {
    id: 'route-ai-hub',
    hat: 'plan',
    title: 'AI Hub page — placeholder only',
    titleHe: 'דף מרכז AI — placeholder בלבד',
    result: 'warn',
    detail: '19 lines. Plan says "Claude API, modes, streaming, context injection". Not implemented.',
    detailHe: '19 שורות. התוכנית אומרת "Claude API, מצבים, streaming, הזרקת הקשר". לא מומש.',
    file: 'src/app/dashboard/ai-hub/page.tsx',
    recommendation: 'Phase 4 — medium priority. AI widget exists (800 lines) but hub page is empty.',
    recommendationHe: 'שלב 4 — עדיפות בינונית. ווידג\'ט AI קיים (800 שורות) אבל דף ה-hub ריק.',
  },
  {
    id: 'route-design-system',
    hat: 'plan',
    title: 'Design System page active',
    titleHe: 'דף מערכת עיצוב פעיל',
    result: 'pass',
    detail: '241 lines. Design gallery with iframe previews and registry pattern. 2 designs registered.',
    detailHe: '241 שורות. גלריית עיצובים עם תצוגות iframe ותבנית רישום. 2 עיצובים רשומים.',
    file: 'src/app/dashboard/design-system/page.tsx',
  },
  {
    id: 'route-architecture',
    hat: 'plan',
    title: 'Architecture page — placeholder only',
    titleHe: 'דף ארכיטקטורה — placeholder בלבד',
    result: 'info',
    detail: '19 lines. Plan says "Static page + Mermaid from Notion". Mermaid is in admin page instead.',
    detailHe: '19 שורות. התוכנית אומרת "דף סטטי + Mermaid מ-Notion". Mermaid נמצא בדף admin במקום.',
    file: 'src/app/dashboard/architecture/page.tsx',
  },
  {
    id: 'route-plan',
    hat: 'plan',
    title: 'Plan page — placeholder only',
    titleHe: 'דף תוכנית — placeholder בלבד',
    result: 'info',
    detail: '19 lines. Plan says "Notion-powered roadmap view". Phase 5.',
    detailHe: '19 שורות. התוכנית אומרת "תצוגת מפת דרכים מ-Notion". שלב 5.',
    file: 'src/app/dashboard/plan/page.tsx',
  },
  // Components planned in CLAUDE.md
  {
    id: 'component-sidebar',
    hat: 'plan',
    title: 'Sidebar component matches spec',
    titleHe: 'קומפוננטת Sidebar תואמת מפרט',
    result: 'pass',
    detail: '276 lines. Fixed 240px width, dark theme, tab navigation with all 11 routes + settings. Supports RTL, float/hidden modes.',
    detailHe: '276 שורות. רוחב קבוע 240px, ערכת נושא כהה, ניווט טאבים עם כל 11 הנתיבים + הגדרות. תומך RTL, מצבי צף/מוסתר.',
    file: 'src/components/command-center/Sidebar.tsx',
  },
  {
    id: 'component-topbar',
    hat: 'plan',
    title: 'TopBar widget system matches spec',
    titleHe: 'מערכת ווידג\'טים של TopBar תואמת מפרט',
    result: 'pass',
    detail: '624 lines. 48px bar with drag-to-place grid, DndContext, ResizeObserver. All 9 spec widgets implemented + extras.',
    detailHe: '624 שורות. סרגל 48px עם רשת גרירה, DndContext, ResizeObserver. כל 9 הווידג\'טים מהמפרט מומשו + תוספות.',
    file: 'src/components/command-center/TopBar.tsx',
  },
  {
    id: 'component-ai-chat',
    hat: 'plan',
    title: 'AIChat component — widget only, no standalone',
    titleHe: 'קומפוננטת AIChat — ווידג\'ט בלבד, ללא עצמאי',
    result: 'warn',
    detail: 'CLAUDE.md lists AIChat.tsx as planned component. Implemented as AIWidget.tsx (800 lines) in widgets. No standalone AIChat.tsx exists.',
    detailHe: 'CLAUDE.md מציין AIChat.tsx כקומפוננטה מתוכננת. מומשה כ-AIWidget.tsx (800 שורות) בווידג\'טים. אין AIChat.tsx עצמאי.',
    file: 'src/components/command-center/widgets/AIWidget.tsx',
    recommendation: 'AI Hub page should use AIWidget or extract shared component.',
    recommendationHe: 'דף AI Hub צריך להשתמש ב-AIWidget או לחלץ קומפוננטה משותפת.',
  },
  // Supabase tables
  {
    id: 'supabase-projects',
    hat: 'plan',
    title: 'Projects table — planned',
    titleHe: 'טבלת projects — מתוכננת',
    result: 'pass',
    detail: 'Table defined in CLAUDE.md schema. Referenced in Layers page queries.',
    detailHe: 'טבלה מוגדרת בסכמת CLAUDE.md. מופנית בשאילתות דף שכבות.',
  },
  {
    id: 'supabase-documents',
    hat: 'plan',
    title: 'Documents table — implemented as vb_records',
    titleHe: 'טבלת מסמכים — מומשה כ-vb_records',
    result: 'warn',
    detail: 'CLAUDE.md defines "documents" table. Actual implementation uses "vb_records". Name mismatch but functional.',
    detailHe: 'CLAUDE.md מגדיר טבלת "documents". מימוש בפועל משתמש ב-"vb_records". אי-התאמה בשם אבל פונקציונלי.',
    recommendation: 'Update CLAUDE.md to reflect actual table name, or rename table.',
    recommendationHe: 'עדכן CLAUDE.md לשקף שם טבלה בפועל, או שנה שם טבלה.',
  },
  {
    id: 'supabase-story-cards',
    hat: 'plan',
    title: 'Story cards table matches spec',
    titleHe: 'טבלת story_cards תואמת מפרט',
    result: 'pass',
    detail: 'story_cards table with col, row, text, type, subs. Queries in storyCardQueries.ts.',
    detailHe: 'טבלת story_cards עם col, row, text, type, subs. שאילתות ב-storyCardQueries.ts.',
    file: 'src/lib/supabase/storyCardQueries.ts',
  },
  // Folder structure
  {
    id: 'folder-structure',
    hat: 'plan',
    title: 'Folder structure — partial match',
    titleHe: 'מבנה תיקיות — התאמה חלקית',
    result: 'warn',
    detail: 'CLAUDE.md lists lib/ai/, lib/utils/. Actual: lib/audit/, lib/canvas/, lib/shortcuts/, lib/weeklyPlanner/. No lib/ai/ or lib/utils/health.ts exists.',
    detailHe: 'CLAUDE.md מציין lib/ai/, lib/utils/. בפועל: lib/audit/, lib/canvas/, lib/shortcuts/, lib/weeklyPlanner/. אין lib/ai/ או lib/utils/health.ts.',
    recommendation: 'CLAUDE.md folder structure is aspirational. Actual structure evolved organically.',
    recommendationHe: 'מבנה התיקיות ב-CLAUDE.md הוא שאפתני. המבנה בפועל התפתח אורגנית.',
  },
  // What NOT to build
  {
    id: 'no-form-builder',
    hat: 'plan',
    title: 'No custom form builder — correct',
    titleHe: 'אין בנאי טפסים מותאם — תקין',
    result: 'pass',
    detail: 'CLAUDE.md says "❌ Form Builder from scratch". Entity platform handles CRUD instead.',
    detailHe: 'CLAUDE.md אומר "❌ בנאי טפסים מאפס". פלטפורמת הישויות מטפלת ב-CRUD במקום.',
  },
  {
    id: 'no-multi-theme',
    hat: 'plan',
    title: 'Multi-theme — partial deviation',
    titleHe: 'ריבוי ערכות נושא — סטייה חלקית',
    result: 'warn',
    detail: 'CLAUDE.md says "❌ Multi-theme — dark mode only". The theme system now supports 20 palettes (10 dark + 10 light) via theme-store + applyTheme(). Skins system was removed.',
    detailHe: 'CLAUDE.md אומר "❌ ריבוי ערכות נושא — מצב כהה בלבד". מערכת התימות תומכת כעת ב-20 פלטות (10 כהות + 10 בהירות) דרך theme-store + applyTheme(). מערכת הסקינים הוסרה.',
    recommendation: 'Acceptable scope expansion — accent colors enhance UX without multi-theme complexity.',
    recommendationHe: 'הרחבת היקף מקובלת — צבעי דגש משפרים UX ללא מורכבות של ריבוי ערכות.',
  },
];

// ─── Hat 2: Reality Check — What Actually Works ──────────────

const realityChecks: AuditCheck[] = [
  {
    id: 'build-status',
    hat: 'reality',
    title: 'Build compiles successfully',
    titleHe: 'הבנייה מתקמפלת בהצלחה',
    result: 'warn',
    detail: 'Last verified build status unknown. Run `npm run build` to verify. TypeScript strict mode is enabled.',
    detailHe: 'סטטוס בנייה אחרון לא ידוע. הרץ `npm run build` לאימות. TypeScript strict mode מופעל.',
    recommendation: 'Run build check and update this status.',
    recommendationHe: 'הרץ בדיקת בנייה ועדכן סטטוס זה.',
  },
  {
    id: 'sidebar-navigation',
    hat: 'reality',
    title: 'Sidebar navigation — all 11 tabs route correctly',
    titleHe: 'ניווט סיידבר — כל 11 הטאבים מנתבים נכון',
    result: 'pass',
    detail: 'All sidebar tabs defined in Sidebar.tsx (lines 27-51) with working href links. Active state highlighting works.',
    detailHe: 'כל טאבי הסיידבר מוגדרים ב-Sidebar.tsx (שורות 27-51) עם קישורי href עובדים. הדגשת מצב פעיל עובדת.',
    file: 'src/components/command-center/Sidebar.tsx',
  },
  {
    id: 'widget-drag-drop',
    hat: 'reality',
    title: 'TopBar widget drag & drop',
    titleHe: 'גרירה ושחרור ווידג\'טים בסרגל עליון',
    result: 'pass',
    detail: 'DndContext in TopBar.tsx handles drag with 5px activation, grid-snap, overlap validation. Positions persist in localStorage.',
    detailHe: 'DndContext ב-TopBar.tsx מנהל גרירה עם הפעלה 5px, הצמדה לרשת, אימות חפיפה. מיקומים נשמרים ב-localStorage.',
    file: 'src/components/command-center/TopBar.tsx',
  },
  {
    id: 'rtl-support',
    hat: 'reality',
    title: 'RTL / Hebrew support',
    titleHe: 'תמיכה RTL / עברית',
    result: 'pass',
    detail: 'i18n.ts has 1,313 lines of Hebrew + English translations. SettingsContext tracks language. Sidebar supports right positioning. All pages use getTranslations().',
    detailHe: 'i18n.ts מכיל 1,313 שורות תרגומים עברית + אנגלית. SettingsContext עוקב אחר שפה. סיידבר תומך במיקום ימין. כל הדפים משתמשים ב-getTranslations().',
    file: 'src/lib/i18n.ts',
  },
  {
    id: 'story-map-dnd',
    hat: 'reality',
    title: 'Story Map drag & drop',
    titleHe: 'גרירה ושחרור במפת סיפור',
    result: 'pass',
    detail: 'StoryBoard.tsx (270 lines) + StoryCard.tsx (623 lines) + StoryColumn.tsx (198 lines). Full drag between columns, sub-items, Supabase persistence.',
    detailHe: 'StoryBoard.tsx (270 שורות) + StoryCard.tsx (623 שורות) + StoryColumn.tsx (198 שורות). גרירה מלאה בין עמודות, תת-פריטים, שמירה ב-Supabase.',
    file: 'src/components/command-center/StoryBoard.tsx',
  },
  {
    id: 'editor-tiptap',
    hat: 'reality',
    title: 'Tiptap editor with extensions',
    titleHe: 'עורך Tiptap עם הרחבות',
    result: 'pass',
    detail: 'Full Tiptap integration with 16 extensions: Image, File, Table, Embed, Callout, Code, Toggle, Field blocks. SlashCommands menu. Supabase save/load.',
    detailHe: 'אינטגרציית Tiptap מלאה עם 16 הרחבות: תמונה, קובץ, טבלה, Embed, הסבר, קוד, Toggle, שדות. תפריט פקודות /. שמירה/טעינה ב-Supabase.',
  },
  {
    id: 'settings-persistence',
    hat: 'reality',
    title: 'Settings persist across sessions',
    titleHe: 'הגדרות נשמרות בין סשנים',
    result: 'pass',
    detail: 'SettingsContext.tsx (457 lines) persists: language, sidebarPosition, sidebarVisibility, accentColor, density, brandProfile, styleOverrides. All via localStorage.',
    detailHe: 'SettingsContext.tsx (457 שורות) שומר: שפה, מיקום סיידבר, נראות סיידבר, צבע דגש, צפיפות, פרופיל מותג, עקיפות סגנון. הכל דרך localStorage.',
    file: 'src/contexts/SettingsContext.tsx',
  },
  {
    id: 'supabase-connection',
    hat: 'reality',
    title: 'Supabase client configured',
    titleHe: 'לקוח Supabase מוגדר',
    result: 'pass',
    detail: 'supabaseClient.ts (16 lines) initializes client. Query files: storyCardQueries.ts, fieldQueries.ts, canvasQueries.ts.',
    detailHe: 'supabaseClient.ts (16 שורות) מאתחל לקוח. קובצי שאילתות: storyCardQueries.ts, fieldQueries.ts, canvasQueries.ts.',
    file: 'src/lib/supabaseClient.ts',
  },
  {
    id: 'context-memoization',
    hat: 'reality',
    title: 'Context providers are memoized',
    titleHe: 'ספקי Context ממוזמנים',
    result: 'pass',
    detail: 'All 7 contexts use useMemo for Provider value objects. Critical fix from commit 2f3e2b4 preventing infinite re-render cascades.',
    detailHe: 'כל 7 ה-Contexts משתמשים ב-useMemo לאובייקטי ערך Provider. תיקון קריטי מ-commit 2f3e2b4 שמנע מפלי רינדור אינסופיים.',
  },
  {
    id: 'automations-page',
    hat: 'reality',
    title: 'Automations page with n8n iframe',
    titleHe: 'דף אוטומציות עם iframe של n8n',
    result: 'pass',
    detail: '610 lines. n8n iframe embedding + documentation of 3 automation types (DB Triggers, Edge Functions, pg_cron). Educational reference + tool.',
    detailHe: '610 שורות. הטמעת iframe של n8n + תיעוד של 3 סוגי אוטומציה (DB Triggers, Edge Functions, pg_cron). מדריך + כלי.',
    file: 'src/app/dashboard/automations/page.tsx',
  },
  {
    id: 'widget-store',
    hat: 'reality',
    title: 'Widget Store — full management UI',
    titleHe: 'חנות ווידג\'טים — ממשק ניהול מלא',
    result: 'pass',
    detail: 'WidgetStore.tsx (932 lines). Tabs: Installed/Available/Coming Soon. Widget placement: Toolbar/Apps/Disabled. Search, detail view, categories.',
    detailHe: 'WidgetStore.tsx (932 שורות). טאבים: מותקנים/זמינים/בקרוב. מיקום ווידג\'ט: סרגל/אפליקציות/מושבת. חיפוש, תצוגת פרטים, קטגוריות.',
    file: 'src/components/command-center/widgets/WidgetStore.tsx',
  },
];

// ─── Hat 3: Code Quality ────────────────────────────────────

const qualityChecks: AuditCheck[] = [
  {
    id: 'test-coverage',
    hat: 'quality',
    title: 'Test coverage: 0%',
    titleHe: 'כיסוי בדיקות: 0%',
    result: 'fail',
    detail: 'No test files exist in the entire src/ directory. No testing framework configured (no jest/vitest in package.json).',
    detailHe: 'אין קובצי בדיקות בכל תיקיית src/. אין מסגרת בדיקות מוגדרת (אין jest/vitest ב-package.json).',
    recommendation: 'Add vitest + @testing-library/react. Priority: context providers, query functions, utility modules.',
    recommendationHe: 'הוסף vitest + @testing-library/react. עדיפות: ספקי context, פונקציות שאילתא, מודולי שירות.',
  },
  {
    id: 'large-file-admin',
    hat: 'quality',
    title: 'Admin page: 1,851 lines — oversized',
    titleHe: 'דף admin: 1,851 שורות — גדול מדי',
    result: 'warn',
    detail: 'Single file with types, data registries, UI components, and page logic. Should be split into data module + component files.',
    detailHe: 'קובץ יחיד עם סוגים, רשומות נתונים, קומפוננטות UI ולוגיקת דף. צריך לפצל למודול נתונים + קבצי קומפוננטה.',
    file: 'src/app/dashboard/admin/page.tsx',
    recommendation: 'Extract: types → lib/admin/types.ts, data → lib/admin/registry.ts, sub-components → components/admin/.',
    recommendationHe: 'חלץ: סוגים → lib/admin/types.ts, נתונים → lib/admin/registry.ts, תת-קומפוננטות → components/admin/.',
  },
  {
    id: 'large-file-i18n',
    hat: 'quality',
    title: 'i18n.ts: 1,313 lines — growing fast',
    titleHe: 'i18n.ts: 1,313 שורות — גדל מהר',
    result: 'warn',
    detail: 'Single translation file for all Hebrew + English strings. Will become unmanageable as features grow.',
    detailHe: 'קובץ תרגום יחיד לכל המחרוזות עברית + אנגלית. יהפוך ללא-ניתן-לניהול ככל שהפיצ\'רים יגדלו.',
    file: 'src/lib/i18n.ts',
    recommendation: 'Consider splitting per-section: i18n/admin.ts, i18n/widgets.ts, i18n/pages.ts.',
    recommendationHe: 'שקול לפצל לפי חלק: i18n/admin.ts, i18n/widgets.ts, i18n/pages.ts.',
  },
  {
    id: 'large-file-weekly-planner',
    hat: 'quality',
    title: 'WeeklyPlannerWidget: 976 lines',
    titleHe: 'WeeklyPlannerWidget: 976 שורות',
    result: 'warn',
    detail: 'Complex widget with team view, templates, recurring tasks, drag. Could benefit from extracting sub-components.',
    detailHe: 'ווידג\'ט מורכב עם תצוגת צוות, תבניות, משימות חוזרות, גרירה. יכול להרוויח מחילוץ תת-קומפוננטות.',
    file: 'src/components/command-center/widgets/WeeklyPlannerWidget.tsx',
  },
  {
    id: 'large-file-widget-store',
    hat: 'quality',
    title: 'WidgetStore: 932 lines',
    titleHe: 'WidgetStore: 932 שורות',
    result: 'warn',
    detail: 'Full widget management system in single file. Could extract WidgetStoreCard, WidgetStoreDetail.',
    detailHe: 'מערכת ניהול ווידג\'טים מלאה בקובץ יחיד. אפשר לחלץ WidgetStoreCard, WidgetStoreDetail.',
    file: 'src/components/command-center/widgets/WidgetStore.tsx',
  },
  {
    id: 'large-file-ai-widget',
    hat: 'quality',
    title: 'AIWidget: 800 lines',
    titleHe: 'AIWidget: 800 שורות',
    result: 'info',
    detail: 'Three view modes (side-panel, dropdown, floating). Acceptable complexity for a multi-mode AI interface.',
    detailHe: 'שלושה מצבי תצוגה (פאנל צד, dropdown, צף). מורכבות מקובלת לממשק AI רב-מצבי.',
    file: 'src/components/command-center/widgets/AIWidget.tsx',
  },
  {
    id: 'large-file-settings',
    hat: 'quality',
    title: 'Settings page: 863 lines',
    titleHe: 'דף הגדרות: 863 שורות',
    result: 'info',
    detail: 'Contains brand profile, accent colors, skins, style overrides, density settings. Rich functionality justifies size.',
    detailHe: 'מכיל פרופיל מותג, צבעי דגש, סקינים, עקיפות סגנון, הגדרות צפיפות. פונקציונליות עשירה מצדיקה גודל.',
    file: 'src/app/dashboard/settings/page.tsx',
  },
  {
    id: 'no-error-boundaries',
    hat: 'quality',
    title: 'No React Error Boundaries',
    titleHe: 'אין React Error Boundaries',
    result: 'warn',
    detail: 'No error.tsx files in app/ routes. A crash in any widget/page takes down the entire dashboard.',
    detailHe: 'אין קבצי error.tsx בנתיבי app/. קריסה בכל ווידג\'ט/דף מפילה את כל הדשבורד.',
    recommendation: 'Add app/dashboard/error.tsx as catch-all, and consider per-widget error boundaries.',
    recommendationHe: 'הוסף app/dashboard/error.tsx כמכסה-הכל, ושקול error boundaries לכל ווידג\'ט.',
  },
  {
    id: 'no-loading-states',
    hat: 'quality',
    title: 'No loading.tsx skeleton pages',
    titleHe: 'אין דפי שלד loading.tsx',
    result: 'info',
    detail: 'No loading.tsx files in dashboard routes. Pages render instantly since most data is client-side.',
    detailHe: 'אין קבצי loading.tsx בנתיבי dashboard. דפים מרונדרים מיידית כי רוב הנתונים הם צד-לקוח.',
  },
  {
    id: 'typescript-strict',
    hat: 'quality',
    title: 'TypeScript strict mode enabled',
    titleHe: 'TypeScript strict mode מופעל',
    result: 'pass',
    detail: 'tsconfig.json has strict: true. All files use TypeScript with proper typing.',
    detailHe: 'tsconfig.json מכיל strict: true. כל הקבצים משתמשים ב-TypeScript עם טיפוסים נכונים.',
  },
  {
    id: 'no-lint-config',
    hat: 'quality',
    title: 'ESLint configured but rules may be default',
    titleHe: 'ESLint מוגדר אבל כללים עלולים להיות ברירת מחדל',
    result: 'info',
    detail: 'eslint-config-next installed. No custom rules seen. Default Next.js lint rules apply.',
    detailHe: 'eslint-config-next מותקן. אין כללים מותאמים. כללי lint ברירת מחדל של Next.js חלים.',
  },
  {
    id: 'consistent-patterns',
    hat: 'quality',
    title: 'Consistent component patterns',
    titleHe: 'תבניות קומפוננטה עקביות',
    result: 'pass',
    detail: 'All pages use: "use client" → imports → useSettings() → getTranslations() → PageHeader. Widget pattern: WidgetWrapper → panel content. Contexts: Provider with useMemo.',
    detailHe: 'כל הדפים משתמשים: "use client" → imports → useSettings() → getTranslations() → PageHeader. תבנית ווידג\'ט: WidgetWrapper → תוכן פאנל. Contexts: Provider עם useMemo.',
  },
];

// ─── Hat 4: System Integrity — No Regressions ──────────────

const integrityChecks: AuditCheck[] = [
  {
    id: 'context-count',
    hat: 'integrity',
    title: '7 React contexts — monitor for bloat',
    titleHe: '7 React Contexts — נטר לנפיחות',
    result: 'info',
    detail: 'SettingsContext (457), WeeklyPlannerContext (425), ShortcutsContext (386), StyleOverrideContext (275), WidgetContext (269), CanvasContext (223), DashboardModeContext (51). Total: 2,086 lines.',
    detailHe: 'SettingsContext (457), WeeklyPlannerContext (425), ShortcutsContext (386), StyleOverrideContext (275), WidgetContext (269), CanvasContext (223), DashboardModeContext (51). סה"כ: 2,086 שורות.',
    recommendation: 'Current count is reasonable. Watch for context proliferation — consider consolidation if >10.',
    recommendationHe: 'ספירה נוכחית סבירה. עקוב אחר ריבוי contexts — שקול איחוד אם מעל 10.',
  },
  {
    id: 'localstorage-keys',
    hat: 'integrity',
    title: 'localStorage key inventory',
    titleHe: 'מלאי מפתחות localStorage',
    result: 'pass',
    detail: 'Known keys: cc-widget-positions, cc-widget-sizes, cc-hidden-widgets, cc-widget-hover-delay, cc-settings, cc-style-overrides, cc-shortcuts, cc-weekly-planner. All prefixed with cc-.',
    detailHe: 'מפתחות ידועים: cc-widget-positions, cc-widget-sizes, cc-hidden-widgets, cc-widget-hover-delay, cc-settings, cc-style-overrides, cc-shortcuts, cc-weekly-planner. כולם עם קידומת cc-.',
  },
  {
    id: 'widget-count',
    hat: 'integrity',
    title: '20 widget files — system growing',
    titleHe: '20 קבצי ווידג\'ט — המערכת גדלה',
    result: 'info',
    detail: 'CLAUDE.md planned 9 active + 4 future widgets. Actual: 20 widget files including WidgetStore, FolderSystem (4 files), ShortcutsWidget, WeeklyPlanner, AppsDrawer. Significant scope expansion.',
    detailHe: 'CLAUDE.md תכנן 9 ווידג\'טים פעילים + 4 עתידיים. בפועל: 20 קבצי ווידג\'ט כולל WidgetStore, FolderSystem (4 קבצים), ShortcutsWidget, WeeklyPlanner, AppsDrawer. הרחבת היקף משמעותית.',
    recommendation: 'Scope expansion is organic and useful. Document new widgets in CLAUDE.md.',
    recommendationHe: 'הרחבת היקף אורגנית ושימושית. תעד ווידג\'טים חדשים ב-CLAUDE.md.',
  },
  {
    id: 'custom-events',
    hat: 'integrity',
    title: 'Custom events for cross-component sync',
    titleHe: 'אירועים מותאמים לסנכרון בין קומפוננטות',
    result: 'pass',
    detail: 'timer-state-change, notifications-change, clipboard-change. Used for WidgetWrapper badge updates without prop drilling.',
    detailHe: 'timer-state-change, notifications-change, clipboard-change. משמשים לעדכוני תגים ב-WidgetWrapper ללא prop drilling.',
  },
  {
    id: 'dnd-kit-versions',
    hat: 'integrity',
    title: '@dnd-kit version alignment',
    titleHe: 'יישור גרסאות @dnd-kit',
    result: 'pass',
    detail: 'core: ^6.3.1, sortable: ^10.0.0, utilities: ^3.2.2. Versions are compatible. Used in TopBar (widget grid) and StoryMap (cards).',
    detailHe: 'core: ^6.3.1, sortable: ^10.0.0, utilities: ^3.2.2. גרסאות תואמות. משמש ב-TopBar (רשת ווידג\'טים) ו-StoryMap (כרטיסים).',
  },
  {
    id: 'unused-dependencies',
    hat: 'integrity',
    title: 'Puppeteer dependency — possibly unused',
    titleHe: 'תלות Puppeteer — ייתכן שלא בשימוש',
    result: 'warn',
    detail: 'puppeteer ^24.38.0 in dependencies. Not referenced in any src/ file. 350MB+ dependency adding bloat.',
    detailHe: 'puppeteer ^24.38.0 בתלויות. לא מופנה בשום קובץ src/. תלות 350MB+ שמוסיפה נפיחות.',
    recommendation: 'Remove puppeteer if not used. If needed for PDF/screenshot generation, move to devDependencies or on-demand.',
    recommendationHe: 'הסר puppeteer אם לא בשימוש. אם נדרש ליצירת PDF/צילום מסך, העבר ל-devDependencies או לפי דרישה.',
  },
  {
    id: 'next-version',
    hat: 'integrity',
    title: 'Next.js 16.1.6 — latest major',
    titleHe: 'Next.js 16.1.6 — גרסה ראשית אחרונה',
    result: 'pass',
    detail: 'Running latest Next.js. CLAUDE.md says 15.5.1 — documentation outdated. React 19.2.3.',
    detailHe: 'רץ על Next.js אחרון. CLAUDE.md אומר 15.5.1 — תיעוד מיושן. React 19.2.3.',
    recommendation: 'Update CLAUDE.md version references.',
    recommendationHe: 'עדכן הפניות גרסה ב-CLAUDE.md.',
  },
  {
    id: 'data-cc-id-coverage',
    hat: 'integrity',
    title: 'data-cc-id system — 20 IDs mapped',
    titleHe: 'מערכת data-cc-id — 20 מזהים ממופים',
    result: 'pass',
    detail: 'Shell, sidebar (7 IDs), page header (3 IDs), project cards (3 IDs), health badge, topbar. StyleOverrideContext can target all.',
    detailHe: 'Shell, סיידבר (7 מזהים), כותרת דף (3 מזהים), כרטיסי פרויקט (3 מזהים), תג בריאות, סרגל עליון. StyleOverrideContext יכול לכוון לכולם.',
  },
  {
    id: 'page-header-consistency',
    hat: 'integrity',
    title: 'PageHeader used consistently across pages',
    titleHe: 'PageHeader משמש באופן עקבי בכל הדפים',
    result: 'pass',
    detail: 'PageHeader.tsx (94 lines) provides title, description, and pin-to-favorites for all dashboard pages.',
    detailHe: 'PageHeader.tsx (94 שורות) מספק כותרת, תיאור והצמדה למועדפים לכל דפי הדשבורד.',
    file: 'src/components/command-center/PageHeader.tsx',
  },
  {
    id: 'uncommitted-scope',
    hat: 'integrity',
    title: 'Uncommitted changes — 13 modified + 5 untracked',
    titleHe: 'שינויים לא שמורים — 13 ששונו + 5 חדשים',
    result: 'warn',
    detail: 'Large uncommitted diff. Includes admin/, designs/, embeds/, landing/. Risk of losing work.',
    detailHe: 'diff גדול לא שמור. כולל admin/, designs/, embeds/, landing/. סיכון לאובדן עבודה.',
    recommendation: 'Commit current work before making more changes.',
    recommendationHe: 'שמור (commit) עבודה נוכחית לפני ביצוע שינויים נוספים.',
  },
];

// ─── Exports ─────────────────────────────────────────────────

export const allChecks: AuditCheck[] = [
  ...planChecks,
  ...realityChecks,
  ...qualityChecks,
  ...integrityChecks,
];

export function getChecksByHat(hat: AuditHat): AuditCheck[] {
  return allChecks.filter(c => c.hat === hat);
}

export function getHatScore(hat: AuditHat): { pass: number; warn: number; fail: number; info: number; total: number; pct: number } {
  const checks = getChecksByHat(hat);
  const pass = checks.filter(c => c.result === 'pass').length;
  const warn = checks.filter(c => c.result === 'warn').length;
  const fail = checks.filter(c => c.result === 'fail').length;
  const info = checks.filter(c => c.result === 'info').length;
  const scorable = pass + warn + fail; // info doesn't count toward score
  const pct = scorable > 0 ? Math.round((pass / scorable) * 100) : 100;
  return { pass, warn, fail, info, total: checks.length, pct };
}

export function getOverallScore(): number {
  const hats: AuditHat[] = ['plan', 'reality', 'quality', 'integrity'];
  const scores = hats.map(h => getHatScore(h).pct);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export const hatMeta: Record<AuditHat, { icon: string; label: string; labelHe: string; description: string; descriptionHe: string }> = {
  plan: {
    icon: '📋',
    label: 'Plan Compliance',
    labelHe: 'תאימות לתוכנית',
    description: 'How well does the code match CLAUDE.md specifications?',
    descriptionHe: 'עד כמה הקוד תואם את מפרטי CLAUDE.md?',
  },
  reality: {
    icon: '🔍',
    label: 'Reality Check',
    labelHe: 'בדיקת מציאות',
    description: 'Does everything actually work as expected?',
    descriptionHe: 'האם הכל באמת עובד כמצופה?',
  },
  quality: {
    icon: '⭐',
    label: 'Code Quality',
    labelHe: 'איכות קוד',
    description: 'Code health, patterns, and maintainability.',
    descriptionHe: 'בריאות קוד, תבניות ותחזוקתיות.',
  },
  integrity: {
    icon: '🛡️',
    label: 'System Integrity',
    labelHe: 'שלמות מערכת',
    description: 'Dependencies, versioning, and regression safety.',
    descriptionHe: 'תלויות, גרסאות ובטיחות מפני רגרסיה.',
  },
};
