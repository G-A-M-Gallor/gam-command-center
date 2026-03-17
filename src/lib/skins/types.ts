/**
 * Skin System Types
 *
 * 3 independent layers:
 * 1. Shell Skin — sidebar, topbar, widgets, navigation, footer
 * 2. Content Skin — page layouts, cards, tables, forms, modals
 * 3. Mobile Nav Skin — mobile navigation style (bottom bar, top bar, FAB, etc.)
 */

// ─── Shell Skins ──────────────────────────────────────────

export type ShellSkinId =
  | "classic"          // Current vBrain sidebar
  | "linear-rail"      // Narrow icon rail + expandable panel
  | "notion-tree"      // Hierarchical tree with deep nesting
  | "attio-split"      // Tools | Data | Views separation
  | "minimal-icons"    // Icons only, hover to expand
  | "command-first";   // Minimal shell, Cmd+K drives navigation

export interface ShellSkinMeta {
  id: ShellSkinId;
  name: { he: string; en: string; ru: string };
  description: { he: string; en: string; ru: string };
  preview: string; // emoji or icon key for visual preview
  features: string[]; // feature tags
}

// ─── Content Skins ────────────────────────────────────────

export type ContentSkinId =
  | "dark-cards"       // Current: dark cards with borders
  | "bento-grid"       // Bento-style grid layout
  | "minimal-clean"    // Minimal white-space focused
  | "dense-data"       // Compact, data-heavy tables
  | "glassmorphism"    // Frosted glass effect
  | "soft-panels";     // Rounded, soft shadows, gentle

export interface ContentSkinMeta {
  id: ContentSkinId;
  name: { he: string; en: string; ru: string };
  description: { he: string; en: string; ru: string };
  preview: string;
  features: string[];
}

// ─── Mobile Nav Skins ─────────────────────────────────────

export type MobileNavSkinId =
  | "bottom-bar"       // Fixed bottom bar with 4-5 icons (default)
  | "top-hamburger"    // Hamburger menu at top
  | "floating-fab"     // Single floating action button → opens full menu
  | "swipe-drawer"     // Swipe from edge to open sidebar
  | "tab-drawer"       // Bottom tabs for main + drawer for full nav
  | "bottom-sheet";    // Pull-up bottom sheet with full navigation

export interface MobileNavSkinMeta {
  id: MobileNavSkinId;
  name: { he: string; en: string; ru: string };
  description: { he: string; en: string; ru: string };
  preview: string;
  /** Safety: how the user always gets back to navigation */
  escapeHatch: string;
}

// ─── Combined Skin Config ─────────────────────────────────

export interface SkinConfig {
  shell: ShellSkinId;
  content: ContentSkinId;
  mobileNav: MobileNavSkinId;
}

export const DEFAULT_SKIN_CONFIG: SkinConfig = {
  shell: "classic",
  content: "dark-cards",
  mobileNav: "bottom-bar",
};

// ─── CSS Variable Tokens ──────────────────────────────────

export interface ShellTokens {
  /** Sidebar */
  sidebarWidth: string;
  sidebarCollapsedWidth: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarItemHeight: string;
  sidebarItemRadius: string;
  sidebarItemPadding: string;
  sidebarFontSize: string;
  sidebarIconSize: string;
  sidebarGroupGap: string;
  sidebarActiveStyle: "background" | "border-left" | "pill" | "underline";
  /** TopBar */
  topbarHeight: string;
  topbarBg: string;
  topbarBorder: string;
  /** General shell */
  shellTransition: string;
}

export interface ContentTokens {
  /** Cards */
  cardBg: string;
  cardBorder: string;
  cardRadius: string;
  cardShadow: string;
  cardPadding: string;
  /** Page */
  pageMaxWidth: string;
  pageGap: string;
  pagePadding: string;
  /** Tables */
  tableDensity: "compact" | "default" | "spacious";
  tableHeaderBg: string;
  tableRowHover: string;
  /** Modals */
  modalBackdrop: string;
  modalRadius: string;
  modalShadow: string;
}
