/* ═══════════════════════════════════════════
   Design Gallery — Registry
   Add new designs here. Each entry becomes
   a card in /dashboard/design-system.
   ═══════════════════════════════════════════ */

export interface DesignEntry {
  id: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  /** Route to render the design (used in iframe) */
  route: string;
  /** Folder path relative to src/app/designs/ */
  folder: string;
  tags: string[];
  createdAt: string;
  /** Three preview colors: [bg, accent, secondary] */
  colors: [string, string, string];
}

export const DESIGNS: DesignEntry[] = [
  {
    id: "gam-landing",
    title: "GAM Landing Page",
    titleHe: "דף נחיתה GAM",
    description: "5-skin landing page with glassmorphism, animated stats, and contact form",
    descriptionHe: "דף נחיתה עם 5 סקינים, גלאסמורפיזם, אנימציות וטופס יצירת קשר",
    route: "/designs/gam-landing",
    folder: "gam-landing",
    tags: ["landing", "website"],
    createdAt: "2026-03-05",
    colors: ["#07090e", "#f97316", "#3b82f6"],
  },
  {
    id: "video-prompt",
    title: "Video Prompt Generator",
    titleHe: "מחולל פרומפטים לווידאו",
    description: "Veo 3 prompt builder with atmosphere, style, and camera controls",
    descriptionHe: "כלי לבניית פרומפטים ל-Veo 3 עם אווירה, סגנון ותנועות מצלמה",
    route: "/embeds/video-prompt",
    folder: "video-prompt",
    tags: ["tool", "AI", "video"],
    createdAt: "2026-03-06",
    colors: ["#0a0a0a", "#c8f050", "#f0ece4"],
  },
];
