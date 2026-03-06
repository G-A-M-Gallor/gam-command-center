export type SkinName = "dark" | "light" | "midnight" | "forest" | "royal";

export interface Skin {
  id: SkinName;
  name: string;
  nameHe: string;
  desc: string;
  descHe: string;
  preview: [string, string, string];
  vars: Record<string, string>;
}

export const SKINS: Skin[] = [
  {
    id: "dark",
    name: "Dark Premium",
    nameHe: "כהה פרימיום",
    desc: "Dark glassmorphism",
    descHe: "גלאסמורפיזם כהה",
    preview: ["#07090e", "#f97316", "#3b82f6"],
    vars: {
      "--cc-skin-bg": "#07090e",
      "--cc-skin-bg-card": "rgba(255,255,255,0.05)",
      "--cc-skin-border": "rgba(255,255,255,0.08)",
      "--cc-skin-text": "#f1f5f9",
      "--cc-skin-text-soft": "#94a3b8",
      "--cc-skin-text-muted": "#475569",
      "--cc-skin-nav-bg": "rgba(7,9,14,0.85)",
      "--cc-skin-card-bg": "rgba(255,255,255,0.04)",
      "--cc-skin-card-border": "rgba(255,255,255,0.08)",
      "--cc-skin-input-bg": "rgba(255,255,255,0.06)",
      "--cc-skin-input-border": "rgba(255,255,255,0.1)",
    },
  },
  {
    id: "light",
    name: "Light Pro",
    nameHe: "בהיר מקצועי",
    desc: "Clean & professional",
    descHe: "נקי ומקצועי",
    preview: ["#f8fafc", "#f97316", "#1e40af"],
    vars: {
      "--cc-skin-bg": "#f8fafc",
      "--cc-skin-bg-card": "#ffffff",
      "--cc-skin-border": "rgba(0,0,0,0.08)",
      "--cc-skin-text": "#0f172a",
      "--cc-skin-text-soft": "#475569",
      "--cc-skin-text-muted": "#94a3b8",
      "--cc-skin-nav-bg": "rgba(248,250,252,0.92)",
      "--cc-skin-card-bg": "#ffffff",
      "--cc-skin-card-border": "rgba(0,0,0,0.07)",
      "--cc-skin-input-bg": "#f1f5f9",
      "--cc-skin-input-border": "rgba(0,0,0,0.12)",
    },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    nameHe: "כחול חצות",
    desc: "Deep blue",
    descHe: "כחול עמוק",
    preview: ["#040d1a", "#60a5fa", "#818cf8"],
    vars: {
      "--cc-skin-bg": "#040d1a",
      "--cc-skin-bg-card": "rgba(96,165,250,0.05)",
      "--cc-skin-border": "rgba(96,165,250,0.12)",
      "--cc-skin-text": "#e2e8f0",
      "--cc-skin-text-soft": "#94a3b8",
      "--cc-skin-text-muted": "#475569",
      "--cc-skin-nav-bg": "rgba(4,13,26,0.9)",
      "--cc-skin-card-bg": "rgba(96,165,250,0.04)",
      "--cc-skin-card-border": "rgba(96,165,250,0.1)",
      "--cc-skin-input-bg": "rgba(96,165,250,0.06)",
      "--cc-skin-input-border": "rgba(96,165,250,0.15)",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    nameHe: "ירוק יער",
    desc: "Natural green",
    descHe: "ירוק טבעי",
    preview: ["#0a1a0f", "#22c55e", "#84cc16"],
    vars: {
      "--cc-skin-bg": "#0a1a0f",
      "--cc-skin-bg-card": "rgba(34,197,94,0.05)",
      "--cc-skin-border": "rgba(34,197,94,0.12)",
      "--cc-skin-text": "#f0fdf4",
      "--cc-skin-text-soft": "#86efac",
      "--cc-skin-text-muted": "#4ade80",
      "--cc-skin-nav-bg": "rgba(10,26,15,0.88)",
      "--cc-skin-card-bg": "rgba(34,197,94,0.04)",
      "--cc-skin-card-border": "rgba(34,197,94,0.1)",
      "--cc-skin-input-bg": "rgba(34,197,94,0.06)",
      "--cc-skin-input-border": "rgba(34,197,94,0.15)",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    nameHe: "סגול מלכותי",
    desc: "Luxury purple",
    descHe: "סגול יוקרתי",
    preview: ["#0d0a1a", "#a855f7", "#ec4899"],
    vars: {
      "--cc-skin-bg": "#0d0a1a",
      "--cc-skin-bg-card": "rgba(168,85,247,0.05)",
      "--cc-skin-border": "rgba(168,85,247,0.12)",
      "--cc-skin-text": "#faf5ff",
      "--cc-skin-text-soft": "#d8b4fe",
      "--cc-skin-text-muted": "#7c3aed",
      "--cc-skin-nav-bg": "rgba(13,10,26,0.88)",
      "--cc-skin-card-bg": "rgba(168,85,247,0.04)",
      "--cc-skin-card-border": "rgba(168,85,247,0.1)",
      "--cc-skin-input-bg": "rgba(168,85,247,0.06)",
      "--cc-skin-input-border": "rgba(168,85,247,0.15)",
    },
  },
];

export function getSkinById(id: SkinName): Skin {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}
