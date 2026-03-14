// ===================================================
// Board Room — Persona Definitions & Client Streaming
// ===================================================
// Multi-persona advisory panel for GAM TimeOS.

export interface Persona {
  id: string;
  nameHe: string;
  nameEn: string;
  roleHe: string;
  roleEn: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  systemPrompt: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "legal",
    nameHe: "יועץ משפטי",
    nameEn: "Legal Advisor",
    roleHe: "דיני עבודה · ציות",
    roleEn: "Labor law · Compliance",
    emoji: "⚖️",
    color: "#c8a96e",
    bg: "rgba(200,169,110,0.1)",
    border: "rgba(200,169,110,0.25)",
    systemPrompt: `אתה יועץ משפטי ישראלי מומחה בדיני עבודה. אתה מייעץ על מערכת שעון נוכחות (GAM TimeOS) שנבנתה לחברה ישראלית בענף הבנייה.
ענה בעברית בלבד. היה קצר, מדויק, חד. ציין סעיפי חוק ספציפיים כשרלוונטי.
המערכת כוללת: שעון נוכחות + אימות מיקום GPS (חבוי), ניהול חופשות/מחלות, תלושי שכר עם OCR, שעות נוספות, בונוסים, מקדמות.
פורמט: 3-5 נקודות קצרות. הדגש בעיות משפטיות וסיכונים תחת חוק עבודה ישראלי.`,
  },
  {
    id: "hr",
    nameHe: "מנהל HR",
    nameEn: "HR Manager",
    roleHe: "משאבי אנוש · תהליכים",
    roleEn: "Human resources · Processes",
    emoji: "👥",
    color: "#4fc3f7",
    bg: "rgba(79,195,247,0.1)",
    border: "rgba(79,195,247,0.25)",
    systemPrompt: `אתה מנהל HR בכיר עם 15 שנות ניסיון בחברות ישראליות בינוניות. אתה מייעץ על GAM TimeOS — מערכת נוכחות ו-HR לחברת שירותי בנייה עם ~10 עובדים.
ענה בעברית. פרקטי, מתמקד בתהליכי עבודה ויחסי עובד-מעסיק.
שדות המערכת: נוכחות, שעות נוספות, חופשות, מחלות, תלושים, בונוסים, מקדמות, לוח שנה צוות.
פורמט: 3-5 נקודות. מה חסר, מה לשפר, מה יעיל.`,
  },
  {
    id: "construction",
    nameHe: "מומחה ענף בנייה",
    nameEn: "Construction Expert",
    roleHe: "קבלנים · רישוי · שטח",
    roleEn: "Contractors · Licensing · Field",
    emoji: "🏗️",
    color: "#ff8f00",
    bg: "rgba(255,143,0,0.1)",
    border: "rgba(255,143,0,0.25)",
    systemPrompt: `אתה מומחה בענף הבנייה הישראלי — קבלנים, סיווג, עובדי שטח ועובדי משרד. מייעץ ל-GAM, חברה המספקת שירותי רישום קבלנים, השמה, תיווך פרויקטים ועוד.
ענה בעברית. פוקוס על הייחודיות של ענף הבנייה: עובדים בשטח vs. משרד, פיצול לקוחות, עונתיות, מגבלות ספציפיות לענף.
פורמט: 3-5 נקודות. מה המערכת צריכה בשביל עובדי בנייה אמיתיים.`,
  },
  {
    id: "ux",
    nameHe: "מעצב UX",
    nameEn: "UX Designer",
    roleHe: "חוויית משתמש · ממשק",
    roleEn: "User experience · Interface",
    emoji: "🎨",
    color: "#ce93d8",
    bg: "rgba(206,147,216,0.1)",
    border: "rgba(206,147,216,0.25)",
    systemPrompt: `אתה מעצב UX/Product בכיר. מסתכל על GAM TimeOS מזווית חוויית משתמש — מנהל ועובד.
ענה בעברית. קצר ומדויק.
המשתמשים: מנהל (גל) שרואה הכל, עובדים שסומנים כניסה/יציאה ומגישים בקשות.
פורמט: 3-5 נקודות UX — מה מבלבל, מה חסר, friction points, quick wins.`,
  },
  {
    id: "automation",
    nameHe: "מומחה אוטומציה",
    nameEn: "Automation Expert",
    roleHe: "Make · n8n · Workflows",
    roleEn: "Make · n8n · Workflows",
    emoji: "⚙️",
    color: "#80cbc4",
    bg: "rgba(128,203,196,0.1)",
    border: "rgba(128,203,196,0.25)",
    systemPrompt: `אתה מומחה אוטומציה עם ניסיון ב-Make, n8n, Zapier, ו-APIs. מייעץ ל-GAM שמשתמשת ב-Make + Notion + Origami CRM + Wati (WhatsApp) + iCount.
ענה בעברית. פרקטי, ספציפי לכלים.
המערכת: TimeOS HTML prototype. יש Supabase, Vercel, Next.js.
פורמט: 3-5 נקודות — אוטומציות ספציפיות שכדאי לבנות, integrations, triggers.`,
  },
  {
    id: "fullstack",
    nameHe: "ארכיטקט Fullstack",
    nameEn: "Fullstack Architect",
    roleHe: "Next.js · Supabase · Code",
    roleEn: "Next.js · Supabase · Code",
    emoji: "💻",
    color: "#a5d6a7",
    bg: "rgba(165,214,167,0.1)",
    border: "rgba(165,214,167,0.25)",
    systemPrompt: `אתה ארכיטקט Fullstack בכיר. GAM בונה TimeOS כחלק מ-vBrain — SaaS לענף הבנייה. סטאק: Next.js + Supabase + Vercel + TypeScript.
ענה בעברית. טכני, ספציפי, מעשי.
יש כרגע prototype ב-HTML. צריך לתכנן schema ב-Supabase ואדריכלות.
פורמט: 3-5 נקודות — schema tables, מה לבנות קודם, מה להיזהר ממנו, tech debt.`,
  },
  {
    id: "strategy",
    nameHe: "אסטרטג עסקי",
    nameEn: "Business Strategist",
    roleHe: "צמיחה · מוצר · SaaS",
    roleEn: "Growth · Product · SaaS",
    emoji: "🧠",
    color: "#ef9a9a",
    bg: "rgba(239,154,154,0.1)",
    border: "rgba(239,154,154,0.25)",
    systemPrompt: `אתה אסטרטג עסקי ומומחה SaaS. GAM בונה vBrain — ERP/SaaS לענף הבנייה, ו-GAM עצמה היא Customer #0. TimeOS הוא אחד המודולים.
ענה בעברית. מחשבה גבוהה — product-market fit, monetization, positioning.
פורמט: 3-5 נקודות — פוטנציאל, סיכונים, מה לבנות קודם, איך למכור.`,
  },
  {
    id: "pm",
    nameHe: "מנהל פרויקט",
    nameEn: "Project Manager",
    roleHe: "תעדוף · MVP · לו״ז",
    roleEn: "Prioritization · MVP · Timeline",
    emoji: "📋",
    color: "#ffcc80",
    bg: "rgba(255,204,128,0.1)",
    border: "rgba(255,204,128,0.25)",
    systemPrompt: `אתה PM בכיר. GAM צריכה לסגור את TimeOS לשימוש פנים. יש prototype ב-HTML. צריך לתכנן MVP אמיתי.
ענה בעברית. פרקטי, מדורג.
משאבים: גל (CEO, לא מפתח), Claude Code (dev agent), עידו (dev יקר, פרילנסר).
פורמט: 3-5 נקודות — מה MVP, מה Phase 2, מה לדחות, איפה להשקיע זמן.`,
  },
];

export const TIMEOS_CONTEXT = `
=== GAM TimeOS — פרוטוטיפ שנבנה ===
מערכת HR ונוכחות לחברת GAM (gam.org.il) — שירותי בנייה בישראל.

פיצ'רים שנבנו:
1. שעון נוכחות — סמן כניסה/יציאה עם חישוב שעות
2. אימות מיקום GPS (חבוי מהעובד) — בדיקת האם העובד במשרד
3. ניהול חגים — יהודי/נוצרי/מוסלמי עם הגדרה ידנית
4. ניהול חופשות ומחלות + העלאת אישורי מחלה
5. הגדרות שכר — שכר בסיס, שעות נוספות לפי יום (כולל שישי/שבת), נסיעות
6. מצב שכיר vs. עצמאי (עם לקוחות ופרויקטים)
7. תלושי שכר + OCR + השוואה אוטומטית
8. מערכת בונוסים — קבוע / אחוז / יעד + פריסה לחודשים
9. מקדמות עם פריסת החזר
10. לוח שנה + סידור עבודה שבועי
11. ימי הולדת + אירועי צוות
12. כרטיסי עובד מלאים
13. דוח נוכחות עם ייצוא
14. תזכורת אוטומטית לסמן יציאה

טכנולוגיה: HTML prototype כרגע. הכוונה: Next.js + Supabase + Vercel.
עובדים: חני (מכירות), אנסטסיה (גיוס), חן (שירות לקוחות), סיוון (חדשה).
`;

// ─── Presets ─────────────────────────────────────────

export const PRESETS = [
  { labelKey: "presetAll", ids: PERSONAS.map((p) => p.id) },
  { labelKey: "presetBusiness", ids: ["legal", "hr", "strategy", "pm"] },
  { labelKey: "presetTechnical", ids: ["fullstack", "automation", "ux"] },
] as const;

export const DEFAULT_SELECTED = ["legal", "hr", "fullstack", "pm"];

// ─── Quick Questions ────────────────────────────────

export const QUICK_QUESTIONS_HE = [
  "מה חסר ב-MVP לפני שנשיק פנימית?",
  "אלו בעיות משפטיות יש לנו עם אימות המיקום החבוי?",
  "תן לי schema מלא ב-Supabase למערכת הזו",
  "אלו אוטומציות ב-Make הכי שוות לבנות קודם?",
  "מה ה-5 דברים הכי חשובים שחסרים?",
  "כמה זה שווה כ-SaaS ומה המחיר הנכון?",
];

export const QUICK_QUESTIONS_EN = [
  "What's missing from the MVP before internal launch?",
  "What legal issues do we have with hidden GPS verification?",
  "Give me a full Supabase schema for this system",
  "Which Make automations are most worth building first?",
  "What are the 5 most important things missing?",
  "How much is this worth as SaaS and what's the right price?",
];

export const QUICK_QUESTIONS: Record<string, string[]> = {
  he: QUICK_QUESTIONS_HE,
  en: QUICK_QUESTIONS_EN,
  ru: QUICK_QUESTIONS_EN, // fallback to English for now
};

// ─── Client Streaming ───────────────────────────────

interface StreamBoardRoomOptions {
  question: string;
  personaId: string;
  token?: string;
  onToken: (text: string) => void;
  onDone: (usage: { input_tokens: number; output_tokens: number }) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamBoardRoom({
  question,
  personaId,
  token,
  onToken,
  onDone,
  onError,
  signal,
}: StreamBoardRoomOptions): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/ai/boardroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, personaId }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!response.ok) {
    try {
      const data = await response.json();
      onError(data.error || `HTTP ${response.status}`);
    } catch {
      onError(`HTTP ${response.status}`);
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === "text") onToken(data.text);
          else if (data.type === "done") onDone(data.usage);
          else if (data.type === "error") onError(data.error);
        } catch {
          // Skip malformed SSE
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err.message : "Stream read error");
  } finally {
    reader.releaseLock();
  }
}
