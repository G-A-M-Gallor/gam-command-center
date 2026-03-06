import type {
  UserJourneyStep, ReleaseTier, MLPTier, RiskEntry,
} from './types';

// ─── User Journey Steps (X-Axis) ────────────────────────

export const userJourneySteps: UserJourneyStep[] = [
  // ── Step 1: Authenticate ──
  {
    id: 'authenticate',
    step: 1,
    name: 'Authenticate',
    nameHe: 'הזדהות',
    primaryPages: ['/login', '/auth/callback', 'middleware'],
    currentStatus: 'Partially working — middleware file broken',
    currentStatusHe: 'עובד חלקית — קובץ middleware שבור',
    emotion: 'Neutral → small delight (dark theme login)',
    emotionHe: 'ניטרלי → שמחה קטנה (לוגין בערכת נושא כהה)',
    friction: 'Middleware not active',
    frictionHe: 'Middleware לא פעיל',
    stories: [
      { name: 'Login form (email + password)', nameHe: 'טופס כניסה (מייל + סיסמה)', status: 'done', risk: 'low', keyFile: 'src/app/login/page.tsx' },
      { name: 'GitHub OAuth + callback', nameHe: 'GitHub OAuth + callback', status: 'done', risk: 'low', keyFile: 'src/app/auth/callback/route.ts' },
      { name: 'Email allowlist enforcement', nameHe: 'אכיפת רשימת מיילים מורשים', status: 'done', risk: 'low', keyFile: 'src/app/auth/callback/route.ts' },
      { name: 'Show/hide password toggle', nameHe: 'מתג הצג/הסתר סיסמה', status: 'done', risk: 'low', keyFile: 'src/app/login/page.tsx' },
      { name: 'Forgot password flow', nameHe: 'זרימת שכחתי סיסמה', status: 'untested', risk: 'medium', keyFile: 'src/app/login/page.tsx' },
      { name: 'Auth guard middleware', nameHe: 'Middleware הגנת אותנטיקציה', status: 'broken', risk: 'critical', keyFile: 'src/proxy.ts', note: 'File named wrong + exports proxy() not middleware()', noteHe: 'שם קובץ שגוי + מייצא proxy() ולא middleware()' },
      { name: 'Session listener (onAuthStateChange)', nameHe: 'מאזין סשן (onAuthStateChange)', status: 'done', risk: 'low', keyFile: 'src/contexts/AuthContext.tsx' },
      { name: 'Sign out (sidebar)', nameHe: 'יציאה (סיידבר)', status: 'done', risk: 'low', keyFile: 'src/components/command-center/Sidebar.tsx' },
    ],
    unhappyPaths: ['Network failure during login', 'Supabase down', 'Token expiry mid-session', 'Multiple tabs auth race'],
    unhappyPathsHe: ['כשל רשת בזמן כניסה', 'Supabase לא זמין', 'פקיעת טוקן באמצע סשן', 'מירוץ אותנטיקציה בכמה טאבים'],
    kpis: ['Login success >98%', 'Time to login <3s'],
    kpisHe: ['הצלחת כניסה >98%', 'זמן כניסה <3 שניות'],
  },

  // ── Step 2: Navigate & Orient ──
  {
    id: 'navigate',
    step: 2,
    name: 'Navigate & Orient',
    nameHe: 'ניווט והתמצאות',
    primaryPages: ['Sidebar', 'TopBar', 'DashboardShell'],
    currentStatus: 'Working',
    currentStatusHe: 'עובד',
    emotion: 'Delight (professional dark theme)',
    emotionHe: 'שמחה (ערכת נושא כהה מקצועית)',
    friction: 'None significant',
    frictionHe: 'אין משמעותי',
    ahamoment: 'Discovering the TopBar widget system',
    ahamomentHe: 'גילוי מערכת הווידג׳טים בסרגל העליון',
    stories: [
      { name: '11-route sidebar navigation', nameHe: 'ניווט סיידבר 11 נתיבים', status: 'done', risk: 'low' },
      { name: '3 sidebar modes (visible/float/hidden)', nameHe: '3 מצבי סיידבר (גלוי/צף/מוסתר)', status: 'done', risk: 'low' },
      { name: 'RTL support', nameHe: 'תמיכת RTL', status: 'done', risk: 'low' },
      { name: 'Mobile responsive', nameHe: 'רספונסיבי למובייל', status: 'done', risk: 'low' },
      { name: '9 TopBar widgets (all functional)', nameHe: '9 ווידג׳טים בסרגל (כולם פעילים)', status: 'done', risk: 'low' },
      { name: 'Widget drag-and-drop positioning', nameHe: 'מיקום ווידג׳טים בגרירה', status: 'done', risk: 'medium' },
      { name: 'Cmd+K search', nameHe: 'חיפוש Cmd+K', status: 'done', risk: 'low' },
      { name: 'Page favorites system', nameHe: 'מערכת מועדפים', status: 'done', risk: 'low' },
      { name: 'Widget store (add/remove)', nameHe: 'חנות ווידג׳טים (הוספה/הסרה)', status: 'done', risk: 'low' },
    ],
    unhappyPaths: ['localStorage quota exceeded', 'Widget overlap during drag'],
    unhappyPathsHe: ['חריגת מכסת localStorage', 'חפיפת ווידג׳טים בגרירה'],
    kpis: ['Any page reachable in 1 click', 'First load <3s'],
    kpisHe: ['כל דף נגיש בלחיצה אחת', 'טעינה ראשונה <3 שניות'],
  },

  // ── Step 3: Monitor Projects ──
  {
    id: 'monitor',
    step: 3,
    name: 'Monitor Projects',
    nameHe: 'ניטור פרויקטים',
    primaryPages: ['/dashboard/layers'],
    currentStatus: 'Working (demo data)',
    currentStatusHe: 'עובד (נתוני הדגמה)',
    emotion: 'Delight (health scores at a glance)',
    emotionHe: 'שמחה (ציוני בריאות במבט)',
    friction: 'Demo data only',
    frictionHe: 'נתוני הדגמה בלבד',
    ahamoment: 'When health score changes after Origami update (not yet possible)',
    ahamomentHe: 'כשציון הבריאות משתנה אחרי עדכון Origami (עדיין לא אפשרי)',
    stories: [
      { name: 'Projects list from Supabase', nameHe: 'רשימת פרויקטים מ-Supabase', status: 'done', risk: 'low' },
      { name: 'Health badges (green/yellow/red)', nameHe: 'תגי בריאות (ירוק/צהוב/אדום)', status: 'done', risk: 'low' },
      { name: 'Summary stats bar', nameHe: 'סרגל סיכום סטטיסטיקות', status: 'done', risk: 'low' },
      { name: 'Fallback to demo data', nameHe: 'נפילה לנתוני הדגמה', status: 'done', risk: 'low' },
      { name: 'Skeleton loading', nameHe: 'טעינת שלד', status: 'done', risk: 'low' },
      { name: 'n8n Origami → Supabase sync', nameHe: 'סנכרון n8n Origami → Supabase', status: 'missing', risk: 'high', note: 'External dependency', noteHe: 'תלות חיצונית' },
      { name: 'Health score auto-calculation', nameHe: 'חישוב ציון בריאות אוטומטי', status: 'missing', risk: 'medium' },
      { name: 'Project detail/expand view', nameHe: 'תצוגת פרטים/הרחבה של פרויקט', status: 'missing', risk: 'low' },
      { name: 'Project search/filter', nameHe: 'חיפוש/סינון פרויקטים', status: 'missing', risk: 'low' },
    ],
    unhappyPaths: ['Supabase table missing (handled — fallback)', 'Stale health scores'],
    unhappyPathsHe: ['טבלת Supabase חסרה (מטופל — נפילה)', 'ציוני בריאות מיושנים'],
    kpis: ['All projects visible', 'Data freshness <1 hour'],
    kpisHe: ['כל הפרויקטים נראים', 'רעננות נתונים <שעה'],
  },

  // ── Step 4: Create & Edit Content ──
  {
    id: 'create-edit',
    step: 4,
    name: 'Create & Edit Content',
    nameHe: 'יצירה ועריכת תוכן',
    primaryPages: ['/dashboard/editor'],
    currentStatus: 'Working (needs verification)',
    currentStatusHe: 'עובד (צריך אימות)',
    emotion: 'Delight (canvas editor looks professional)',
    emotionHe: 'שמחה (עורך Canvas נראה מקצועי)',
    friction: 'Template discovery',
    frictionHe: 'גילוי תבניות',
    ahamoment: 'Exporting a professional document from the dashboard',
    ahamomentHe: 'ייצוא מסמך מקצועי מהדשבורד',
    stories: [
      { name: 'Document CRUD (create/list/edit/delete)', nameHe: 'CRUD מסמכים (יצירה/רשימה/עריכה/מחיקה)', status: 'done', risk: 'low' },
      { name: 'Tiptap block editor', nameHe: 'עורך בלוקים Tiptap', status: 'done', risk: 'low' },
      { name: 'Canvas mode with field placements', nameHe: 'מצב Canvas עם מיקומי שדות', status: 'done', risk: 'medium' },
      { name: 'Floating toolbar + slash commands', nameHe: 'סרגל כלים צף + פקודות סלאש', status: 'done', risk: 'low' },
      { name: 'Document duplication', nameHe: 'שכפול מסמכים', status: 'done', risk: 'low' },
      { name: 'Template gallery with categories', nameHe: 'גלריית תבניות עם קטגוריות', status: 'done', risk: 'low' },
      { name: 'Save as template', nameHe: 'שמירה כתבנית', status: 'done', risk: 'low' },
      { name: 'Version history (save/list/restore)', nameHe: 'היסטוריית גרסאות (שמירה/רשימה/שחזור)', status: 'done', risk: 'low' },
      { name: 'Export (PDF/DOCX/HTML/MD)', nameHe: 'ייצוא (PDF/DOCX/HTML/MD)', status: 'done', risk: 'low' },
      { name: 'Import (.html/.md/.txt/.json)', nameHe: 'ייבוא (.html/.md/.txt/.json)', status: 'done', risk: 'low', note: 'Partial', noteHe: 'חלקי' },
      { name: 'Share link (create/revoke)', nameHe: 'קישור שיתוף (יצירה/ביטול)', status: 'done', risk: 'low' },
      { name: 'Public shared doc viewer', nameHe: 'צפייה ציבורית במסמך משותף', status: 'done', risk: 'low' },
    ],
    unhappyPaths: ['vb_records table RLS blocking (fixed)', 'Large doc performance', 'Concurrent editing'],
    unhappyPathsHe: ['חסימת RLS בטבלת vb_records (תוקן)', 'ביצועי מסמך גדול', 'עריכה מקבילית'],
    kpis: ['Document creation <30s', 'Export works in all 4 formats'],
    kpisHe: ['יצירת מסמך <30 שניות', 'ייצוא עובד ב-4 פורמטים'],
  },

  // ── Step 5: Plan & Map Work ──
  {
    id: 'plan-map',
    step: 5,
    name: 'Plan & Map Work',
    nameHe: 'תכנון ומיפוי עבודה',
    primaryPages: ['/dashboard/story-map', '/dashboard/plan'],
    currentStatus: 'Partial',
    currentStatusHe: 'חלקי',
    emotion: 'Delight (DnD feels natural)',
    emotionHe: 'שמחה (גרירה מרגישה טבעית)',
    friction: 'Demo mode, missing tables',
    frictionHe: 'מצב הדגמה, טבלאות חסרות',
    ahamoment: 'Dragging a story card and seeing it sync in real-time',
    ahamomentHe: 'גרירת כרטיס סיפור וראייתו מסתנכרן בזמן אמת',
    stories: [
      { name: '3-tier story cards (epic/feature/story)', nameHe: 'כרטיסים ב-3 שכבות (אפיק/פיצ׳ר/סיפור)', status: 'done', risk: 'low' },
      { name: 'Drag-and-drop between columns', nameHe: 'גרירה בין עמודות', status: 'done', risk: 'low' },
      { name: 'CRUD for cards + columns', nameHe: 'CRUD לכרטיסים + עמודות', status: 'done', risk: 'low' },
      { name: 'Card color + sub-stories', nameHe: 'צבע כרטיס + תת-סיפורים', status: 'done', risk: 'low' },
      { name: 'Realtime sync (Supabase channels)', nameHe: 'סנכרון Realtime (ערוצי Supabase)', status: 'done', risk: 'low' },
      { name: 'Connection status indicator', nameHe: 'מחוון סטטוס חיבור', status: 'done', risk: 'low' },
      { name: 'Demo mode fallback', nameHe: 'נפילה למצב הדגמה', status: 'done', risk: 'low' },
      { name: 'Plan timeline (5 phases)', nameHe: 'ציר זמן תוכנית (5 שלבים)', status: 'done', risk: 'low' },
      { name: 'plan_phases table', nameHe: 'טבלת plan_phases', status: 'missing', risk: 'medium', note: 'Table needs migration', noteHe: 'טבלה צריכה מיגרציה' },
      { name: 'Story card notes (expandable)', nameHe: 'פתקי כרטיס סיפור (מורחבים)', status: 'missing', risk: 'low' },
      { name: 'Story card diagrams (Mermaid)', nameHe: 'דיאגרמות כרטיס סיפור (Mermaid)', status: 'missing', risk: 'medium' },
      { name: 'Story card estimation', nameHe: 'הערכת כרטיס סיפור', status: 'missing', risk: 'low' },
    ],
    unhappyPaths: ['Table missing (handled — fallback)', 'Realtime disconnect', 'Concurrent drag'],
    unhappyPathsHe: ['טבלה חסרה (מטופל — נפילה)', 'ניתוק Realtime', 'גרירה מקבילית'],
    kpis: ['Card create <2s', 'Realtime latency <1s'],
    kpisHe: ['יצירת כרטיס <2 שניות', 'השהיית Realtime <שנייה'],
  },

  // ── Step 6: AI Assistance ──
  {
    id: 'ai-assist',
    step: 6,
    name: 'AI Assistance',
    nameHe: 'עזרת AI',
    primaryPages: ['/dashboard/ai-hub', 'AI Widget'],
    currentStatus: 'Built (needs API key)',
    currentStatusHe: 'נבנה (צריך מפתח API)',
    emotion: 'Delight (streaming + professional UI)',
    emotionHe: 'שמחה (streaming + ממשק מקצועי)',
    friction: 'API key setup',
    frictionHe: 'הגדרת מפתח API',
    ahamoment: 'AI decomposes a feature into structured task breakdown',
    ahamomentHe: 'AI מפרק פיצ׳ר לפירוק משימות מובנה',
    stories: [
      { name: '4 chat modes (chat/analyze/write/decompose)', nameHe: '4 מצבי צ׳אט (צ׳אט/ניתוח/כתיבה/פירוק)', status: 'done', risk: 'low' },
      { name: 'Streaming responses (SSE)', nameHe: 'תגובות streaming (SSE)', status: 'done', risk: 'low' },
      { name: 'Stop generation button', nameHe: 'כפתור עצירת יצירה', status: 'done', risk: 'low' },
      { name: 'Model selection per mode (Haiku/Sonnet)', nameHe: 'בחירת מודל למצב (Haiku/Sonnet)', status: 'done', risk: 'low' },
      { name: 'Conversation persistence (Supabase + localStorage)', nameHe: 'שמירת שיחות (Supabase + localStorage)', status: 'done', risk: 'low' },
      { name: 'Token budget tracking', nameHe: 'מעקב תקציב טוקנים', status: 'done', risk: 'low' },
      { name: 'Context injection (current page)', nameHe: 'הזרקת הקשר (דף נוכחי)', status: 'done', risk: 'low' },
      { name: 'Suggestion chips per mode', nameHe: 'צ׳יפים של הצעות למצב', status: 'done', risk: 'low' },
      { name: 'AI Widget (TopBar side-panel)', nameHe: 'ווידג׳ט AI (פאנל צד סרגל עליון)', status: 'done', risk: 'low' },
      { name: 'ANTHROPIC_API_KEY on Vercel', nameHe: 'ANTHROPIC_API_KEY ב-Vercel', status: 'missing', risk: 'high', note: 'Env var needed', noteHe: 'צריך משתנה סביבה' },
    ],
    unhappyPaths: ['Missing API key (handled — error message)', 'Rate limit', 'Network mid-stream', 'Over budget'],
    unhappyPathsHe: ['מפתח API חסר (מטופל — הודעת שגיאה)', 'מגבלת קצב', 'ניתוק רשת באמצע stream', 'חריגת תקציב'],
    kpis: ['Streaming starts <2s', 'Budget tracked accurately'],
    kpisHe: ['התחלת streaming <2 שניות', 'מעקב תקציב מדויק'],
  },

  // ── Step 7: Understand Organization ──
  {
    id: 'understand-org',
    step: 7,
    name: 'Understand Organization',
    nameHe: 'הבנת הארגון',
    primaryPages: ['/dashboard/functional-map', '/dashboard/architecture'],
    currentStatus: 'Partial (missing table)',
    currentStatusHe: 'חלקי (טבלה חסרה)',
    emotion: 'Clarity (organizational picture)',
    emotionHe: 'בהירות (תמונה ארגונית)',
    friction: 'Missing data connections',
    frictionHe: 'חיבורי נתונים חסרים',
    ahamoment: '3x5 functional map reveals who owns what',
    ahamomentHe: 'מפה פונקציונלית 3×5 חושפת מי אחראי למה',
    stories: [
      { name: '3x5 functional map grid', nameHe: 'רשת מפה פונקציונלית 3×5', status: 'done', risk: 'low' },
      { name: 'Inline cell editing', nameHe: 'עריכה ישירה בתאים', status: 'done', risk: 'low' },
      { name: 'Status indicators', nameHe: 'מחווני סטטוס', status: 'done', risk: 'low' },
      { name: 'Architecture Mermaid diagram', nameHe: 'דיאגרמת ארכיטקטורה Mermaid', status: 'done', risk: 'low' },
      { name: 'Tool stack table', nameHe: 'טבלת חבילת כלים', status: 'done', risk: 'low' },
      { name: 'functional_map_cells table', nameHe: 'טבלת functional_map_cells', status: 'missing', risk: 'high', note: 'Table needs migration', noteHe: 'טבלה צריכה מיגרציה' },
      { name: 'Origami iframe for Formily', nameHe: 'Origami iframe ל-Formily', status: 'missing', risk: 'high', note: 'External dependency', noteHe: 'תלות חיצונית' },
      { name: 'Notion API for live data', nameHe: 'Notion API לנתונים חיים', status: 'missing', risk: 'medium', note: 'External dependency', noteHe: 'תלות חיצונית' },
    ],
    unhappyPaths: ['Table missing (handled — local fallback)', 'Mermaid render fail (handled — securityLevel strict)'],
    unhappyPathsHe: ['טבלה חסרה (מטופל — נפילה מקומית)', 'כשל רנדור Mermaid (מטופל — securityLevel strict)'],
    kpis: ['Map loads <2s', 'All cells editable'],
    kpisHe: ['טעינת מפה <2 שניות', 'כל התאים ניתנים לעריכה'],
  },

  // ── Step 8: Customize & Administer ──
  {
    id: 'customize',
    step: 8,
    name: 'Customize & Administer',
    nameHe: 'התאמה אישית וניהול',
    primaryPages: ['/dashboard/settings', '/dashboard/admin'],
    currentStatus: 'Working',
    currentStatusHe: 'עובד',
    emotion: 'High delight (color picker, skins, brand identity)',
    emotionHe: 'שמחה גבוהה (בורר צבע, סקינים, זהות מותגית)',
    friction: 'None',
    frictionHe: 'אין',
    ahamoment: 'Brand colors transform the entire dashboard',
    ahamomentHe: 'צבעי מותג משנים את הדשבורד כולו',
    stories: [
      { name: 'Language toggle (he/en)', nameHe: 'מתג שפה (he/en)', status: 'done', risk: 'low' },
      { name: 'Sidebar position + mode', nameHe: 'מיקום + מצב סיידבר', status: 'done', risk: 'low' },
      { name: 'Accent colors + custom picker', nameHe: 'צבעי מבטא + בורר מותאם', status: 'done', risk: 'low' },
      { name: 'Gradient + glow effects', nameHe: 'אפקטי גרדיאנט + זוהר', status: 'done', risk: 'low' },
      { name: 'Font/radius/density', nameHe: 'גופן/רדיוס/צפיפות', status: 'done', risk: 'low' },
      { name: 'Skin selector', nameHe: 'בורר סקינים', status: 'done', risk: 'low' },
      { name: 'Brand profile (logo + colors)', nameHe: 'פרופיל מותג (לוגו + צבעים)', status: 'done', risk: 'low' },
      { name: 'Admin changelog + workflow', nameHe: 'יומן שינויים אדמין + זרימת עבודה', status: 'done', risk: 'low' },
      { name: 'Dev checklist system (5 items)', nameHe: 'מערכת צ׳קליסט פיתוח (5 פריטים)', status: 'done', risk: 'low' },
      { name: 'Routes/components registry', nameHe: 'רישום נתיבים/רכיבים', status: 'done', risk: 'low' },
    ],
    unhappyPaths: ['localStorage full', 'Color picker browser compat'],
    unhappyPathsHe: ['localStorage מלא', 'תאימות דפדפן של בורר צבע'],
    kpis: ['All settings persist', 'Brand applied consistently'],
    kpisHe: ['כל ההגדרות נשמרות', 'מותג מיושם באופן עקבי'],
  },
];

// ─── Release Tiers ──────────────────────────────────────

export const walkingSkeleton: ReleaseTier = {
  id: 'walking-skeleton',
  name: 'Walking Skeleton',
  nameHe: 'הוכחת ארכיטקטורה',
  goal: 'End-to-end flow proves the architecture works.',
  goalHe: 'זרימה מקצה לקצה מוכיחה שהארכיטקטורה עובדת.',
  tasks: [
    { name: 'Fix src/proxy.ts → rename to src/middleware.ts, export middleware()', nameHe: 'תקן src/proxy.ts → שנה שם ל-src/middleware.ts, ייצא middleware()', status: 'CRITICAL', statusHe: 'קריטי', effort: '5 min', risk: 'low' },
    { name: 'Verify projects table exists in Supabase', nameHe: 'אמת שטבלת projects קיימת ב-Supabase', status: 'Verify', statusHe: 'לאמת', effort: '5 min', risk: 'low' },
    { name: 'Test: login → dashboard → see projects', nameHe: 'בדיקה: כניסה → דשבורד → ראה פרויקטים', status: 'Test', statusHe: 'לבדוק', effort: '15 min', risk: 'low' },
  ],
  kpis: ['Auth flow completes', 'Dashboard loads', 'Page loads <5s'],
  kpisHe: ['זרימת Auth מסתיימת', 'דשבורד נטען', 'טעינת דף <5 שניות'],
};

export const mvp: ReleaseTier = {
  id: 'mvp',
  name: 'MVP',
  nameHe: 'ערך אמיתי ראשון',
  goal: 'First version that delivers daily value to GAM team.',
  goalHe: 'גרסה ראשונה שמספקת ערך יומיומי לצוות GAM.',
  tasks: [
    { name: 'Fix middleware (Walking Skeleton)', nameHe: 'תקן middleware (הוכחת ארכיטקטורה)', status: 'Broken', statusHe: 'שבור', effort: '5 min', risk: 'low' },
    { name: 'Create functional_map_cells table', nameHe: 'צור טבלת functional_map_cells', status: 'Missing', statusHe: 'חסר', effort: '15 min', risk: 'low' },
    { name: 'Create plan_phases table', nameHe: 'צור טבלת plan_phases', status: 'Missing', statusHe: 'חסר', effort: '15 min', risk: 'low' },
    { name: 'Verify doc_templates, doc_versions, doc_shares tables', nameHe: 'אמת טבלאות doc_templates, doc_versions, doc_shares', status: 'Unknown', statusHe: 'לא ידוע', effort: '30 min', risk: 'low' },
    { name: 'Verify story_cards table', nameHe: 'אמת טבלת story_cards', status: 'Unknown', statusHe: 'לא ידוע', effort: '15 min', risk: 'low' },
    { name: 'Verify ai_conversations table', nameHe: 'אמת טבלת ai_conversations', status: 'Unknown', statusHe: 'לא ידוע', effort: '15 min', risk: 'low' },
    { name: 'Set ANTHROPIC_API_KEY on Vercel', nameHe: 'הגדר ANTHROPIC_API_KEY ב-Vercel', status: 'Missing', statusHe: 'חסר', effort: '5 min', risk: 'low' },
    { name: 'Set ALLOWED_EMAILS on Vercel', nameHe: 'הגדר ALLOWED_EMAILS ב-Vercel', status: 'Missing', statusHe: 'חסר', effort: '5 min', risk: 'low' },
    { name: 'RLS policies for new tables', nameHe: 'מדיניות RLS לטבלאות חדשות', status: 'Missing', statusHe: 'חסר', effort: '30 min', risk: 'medium' },
    { name: 'End-to-end testing all 12 pages', nameHe: 'בדיקה מקצה לקצה של כל 12 הדפים', status: 'Untested', statusHe: 'לא נבדק', effort: '2 hours', risk: 'medium' },
  ],
  kpis: ['All pages render', 'CRUD works on all tables', 'AI streaming works', 'Realtime syncs'],
  kpisHe: ['כל הדפים מרונדרים', 'CRUD עובד בכל הטבלאות', 'AI streaming עובד', 'Realtime מסתנכרן'],
};

// ─── MLP Tiers ──────────────────────────────────────────

export const mlpTiers: MLPTier[] = [
  {
    id: 'tier-a',
    name: 'Tier A: Data Integration',
    nameHe: 'שכבה א׳: אינטגרציית נתונים',
    features: [
      { name: 'n8n Origami → Supabase project sync', nameHe: 'סנכרון n8n Origami → Supabase', why: 'Real data instead of demo', whyHe: 'נתונים אמיתיים במקום הדגמה', effort: 'L', risk: 'high' },
      { name: 'Health score auto-calculation', nameHe: 'חישוב ציון בריאות אוטומטי', why: 'Meaningful monitoring', whyHe: 'ניטור בעל משמעות', effort: 'M', risk: 'medium' },
      { name: 'Project detail/expand view', nameHe: 'תצוגת פרטים/הרחבה', why: 'Drill into projects', whyHe: 'חדירה לפרויקטים', effort: 'M', risk: 'low' },
      { name: 'Project search/filter on Layers', nameHe: 'חיפוש/סינון ב-Layers', why: 'Find fast', whyHe: 'מציאה מהירה', effort: 'S', risk: 'low' },
    ],
  },
  {
    id: 'tier-b',
    name: 'Tier B: Editor Power Features',
    nameHe: 'שכבה ב׳: פיצ׳רי כוח עורך',
    features: [
      { name: 'Pre-built template library (8+ templates)', nameHe: 'ספריית תבניות מוכנות (8+)', why: 'Faster creation', whyHe: 'יצירה מהירה', effort: 'M', risk: 'low' },
      { name: 'Document search across all content', nameHe: 'חיפוש מסמכים בכל התוכן', why: 'Find anything', whyHe: 'מצא הכל', effort: 'M', risk: 'medium' },
      { name: 'Field library expansion', nameHe: 'הרחבת ספריית שדות', why: 'Richer documents', whyHe: 'מסמכים עשירים', effort: 'M', risk: 'low' },
    ],
  },
  {
    id: 'tier-c',
    name: 'Tier C: Story Map Intelligence',
    nameHe: 'שכבה ג׳: אינטליגנציית מפת סיפורים',
    features: [
      { name: 'Story card notes (expandable)', nameHe: 'פתקי כרטיס סיפור (מורחבים)', why: 'More context per card', whyHe: 'יותר הקשר לכרטיס', effort: 'S', risk: 'low' },
      { name: 'Story card estimation (T-shirt)', nameHe: 'הערכת כרטיס סיפור (T-shirt)', why: 'Sprint planning', whyHe: 'תכנון ספרינט', effort: 'S', risk: 'low' },
      { name: 'AI-assisted decomposition', nameHe: 'פירוק בסיוע AI', why: 'Bridge to AI Hub', whyHe: 'גשר למרכז AI', effort: 'M', risk: 'medium' },
      { name: 'Story Map export (CSV/image)', nameHe: 'ייצוא מפת סיפורים (CSV/תמונה)', why: 'Stakeholder sharing', whyHe: 'שיתוף בעלי עניין', effort: 'M', risk: 'low' },
    ],
  },
  {
    id: 'tier-d',
    name: 'Tier D: AI Enhancement',
    nameHe: 'שכבה ד׳: שיפור AI',
    features: [
      { name: 'AI context from current page data', nameHe: 'הקשר AI מנתוני דף נוכחי', why: 'Smarter answers', whyHe: 'תשובות חכמות', effort: 'M', risk: 'medium' },
      { name: 'AI document generation from prompt', nameHe: 'יצירת מסמך AI מפרומפט', why: 'Fast creation', whyHe: 'יצירה מהירה', effort: 'M', risk: 'low' },
      { name: 'AI project summaries', nameHe: 'סיכומי פרויקט AI', why: 'Weekly reports', whyHe: 'דו"חות שבועיים', effort: 'S', risk: 'low' },
    ],
  },
  {
    id: 'tier-e',
    name: 'Tier E: UX Polish & Delight',
    nameHe: 'שכבה ה׳: ליטוש UX ושמחה',
    features: [
      { name: 'Sidebar redesign (innovative nav)', nameHe: 'עיצוב סיידבר חדש (ניווט חדשני)', why: 'Core UX improvement', whyHe: 'שיפור UX ליבה', effort: 'L', risk: 'medium' },
      { name: 'Split-screen navigation', nameHe: 'ניווט מסך מפוצל', why: 'Power user feature', whyHe: 'פיצ׳ר למשתמש כוח', effort: 'L', risk: 'medium' },
      { name: 'Icon/emoji library', nameHe: 'ספריית אייקונים/אימוג׳ים', why: 'Visual richness', whyHe: 'עושר ויזואלי', effort: 'M', risk: 'low' },
      { name: 'Keyboard shortcuts', nameHe: 'קיצורי מקלדת', why: 'Power users', whyHe: 'משתמשי כוח', effort: 'M', risk: 'low' },
      { name: 'Onboarding guide overlay', nameHe: 'שכבת-על מדריך קליטה', why: 'First-time users', whyHe: 'משתמשים חדשים', effort: 'M', risk: 'low' },
    ],
  },
  {
    id: 'tier-f',
    name: 'Tier F: External Integrations',
    nameHe: 'שכבה ו׳: אינטגרציות חיצוניות',
    features: [
      { name: 'Notion live connection', nameHe: 'חיבור חי ל-Notion', why: 'Knowledge SOT', whyHe: 'מקור אמת לידע', effort: 'L', risk: 'high' },
      { name: 'Origami API for Formily', nameHe: 'Origami API ל-Formily', why: 'Form management', whyHe: 'ניהול טפסים', effort: 'L', risk: 'high' },
      { name: 'WATI widget', nameHe: 'ווידג׳ט WATI', why: 'WhatsApp messages', whyHe: 'הודעות WhatsApp', effort: 'M', risk: 'high' },
    ],
  },
];

// ─── Risk Matrix ────────────────────────────────────────

export const riskMatrix: RiskEntry[] = [
  { risk: 'proxy.ts middleware naming', riskHe: 'שם קובץ proxy.ts middleware', type: 'Technical', typeHe: 'טכני', level: 'critical', mitigation: 'Rename file + export', mitigationHe: 'שנה שם קובץ + ייצוא' },
  { risk: 'Missing Supabase tables', riskHe: 'טבלאות Supabase חסרות', type: 'Technical', typeHe: 'טכני', level: 'high', mitigation: 'Run migrations', mitigationHe: 'הרץ מיגרציות' },
  { risk: 'Missing ANTHROPIC_API_KEY', riskHe: 'ANTHROPIC_API_KEY חסר', type: 'Dependency', typeHe: 'תלות', level: 'high', mitigation: 'Set env var', mitigationHe: 'הגדר משתנה סביבה' },
  { risk: 'n8n Origami sync', riskHe: 'סנכרון n8n Origami', type: 'Dependency', typeHe: 'תלות', level: 'high', mitigation: 'Requires Origami API access', mitigationHe: 'דורש גישה ל-Origami API' },
  { risk: 'Origami API for Formily', riskHe: 'Origami API ל-Formily', type: 'Dependency', typeHe: 'תלות', level: 'high', mitigation: 'External cooperation needed', mitigationHe: 'נדרש שיתוף פעולה חיצוני' },
  { risk: 'Notion API integration', riskHe: 'אינטגרציית Notion API', type: 'Dependency', typeHe: 'תלות', level: 'high', mitigation: 'API key + mapping needed', mitigationHe: 'נדרש מפתח API + מיפוי' },
  { risk: 'RLS for new tables', riskHe: 'RLS לטבלאות חדשות', type: 'Technical', typeHe: 'טכני', level: 'medium', mitigation: 'Add authenticated policies', mitigationHe: 'הוסף מדיניות מאומתת' },
  { risk: 'Large story maps perf', riskHe: 'ביצועי מפות סיפורים גדולות', type: 'Technical', typeHe: 'טכני', level: 'medium', mitigation: 'Pagination/virtualization', mitigationHe: 'עימוד/וירטואליזציה' },
  { risk: 'Token cost control', riskHe: 'בקרת עלות טוקנים', type: 'Business', typeHe: 'עסקי', level: 'medium', mitigation: 'Budget tracker exists', mitigationHe: 'מעקב תקציב קיים' },
];

// ─── Implementation Sequence ────────────────────────────

export interface WeekPlan {
  week: string;
  weekHe: string;
  tasks: string[];
  tasksHe: string[];
}

export const implementationSequence: WeekPlan[] = [
  {
    week: 'Week 1: Walking Skeleton → MVP',
    weekHe: 'שבוע 1: הוכחת ארכיטקטורה → MVP',
    tasks: [
      'Day 1: Fix middleware, run migrations, set env vars',
      'Day 2: Verify all 12 pages end-to-end',
      'Day 3: Fix issues, add RLS policies, document limitations',
    ],
    tasksHe: [
      'יום 1: תקן middleware, הרץ מיגרציות, הגדר משתני סביבה',
      'יום 2: אמת כל 12 הדפים מקצה לקצה',
      'יום 3: תקן בעיות, הוסף מדיניות RLS, תעד מגבלות',
    ],
  },
  {
    week: 'Week 2-3: MLP Tier A (Data Integration)',
    weekHe: 'שבוע 2-3: שכבה א׳ MLP (אינטגרציית נתונים)',
    tasks: ['n8n Origami sync, health scores, project details'],
    tasksHe: ['סנכרון n8n Origami, ציוני בריאות, פרטי פרויקט'],
  },
  {
    week: 'Week 4: MLP Tier B+C (Editor + Story Map)',
    weekHe: 'שבוע 4: שכבה ב׳+ג׳ MLP (עורך + מפת סיפורים)',
    tasks: ['Templates, story card notes, field library'],
    tasksHe: ['תבניות, פתקי כרטיסי סיפור, ספריית שדות'],
  },
  {
    week: 'Week 5: MLP Tier D+E (AI + UX Polish)',
    weekHe: 'שבוע 5: שכבה ד׳+ה׳ MLP (AI + ליטוש UX)',
    tasks: ['Context injection, sidebar redesign, shortcuts'],
    tasksHe: ['הזרקת הקשר, עיצוב סיידבר מחדש, קיצורים'],
  },
  {
    week: 'Week 6: MLP Tier F (External Integrations)',
    weekHe: 'שבוע 6: שכבה ו׳ MLP (אינטגרציות חיצוניות)',
    tasks: ['Notion, Origami, WATI connections'],
    tasksHe: ['חיבורי Notion, Origami, WATI'],
  },
];

// ─── Helper Functions ───────────────────────────────────

export function getJourneyStats() {
  let totalStories = 0;
  let doneStories = 0;
  let brokenStories = 0;
  let missingStories = 0;
  let criticalRisks = 0;
  let highRisks = 0;

  for (const step of userJourneySteps) {
    for (const story of step.stories) {
      totalStories++;
      if (story.status === 'done') doneStories++;
      if (story.status === 'broken') brokenStories++;
      if (story.status === 'missing') missingStories++;
      if (story.risk === 'critical') criticalRisks++;
      if (story.risk === 'high') highRisks++;
    }
  }

  return {
    totalStories,
    doneStories,
    brokenStories,
    missingStories,
    untestedStories: totalStories - doneStories - brokenStories - missingStories,
    criticalRisks,
    highRisks,
    completionPct: Math.round((doneStories / totalStories) * 100),
  };
}
