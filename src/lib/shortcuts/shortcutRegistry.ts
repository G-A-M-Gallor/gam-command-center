import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Zap,
  LayoutGrid,
  CreditCard,
  MessageCircle,
  PenTool,
  Filter,
  Bot,
  Star,
} from "lucide-react";

// ─── Scope & Category ───────────────────────────────────────

export type ShortcutScope = "global" | "card_browser" | "editor" | "table";

export type ShortcutCategory =
  | "navigation"
  | "actions"
  | "views"
  | "card_browser"
  | "communication"
  | "editing"
  | "filtering"
  | "ai"
  | "custom";

export interface CategoryDefinition {
  id: ShortcutCategory;
  label: { he: string; en: string };
  icon: LucideIcon;
}

export const SHORTCUT_CATEGORIES: CategoryDefinition[] = [
  { id: "navigation", label: { he: "ניווט", en: "Navigation" }, icon: Compass },
  { id: "actions", label: { he: "פעולות מהירות", en: "Quick Actions" }, icon: Zap },
  { id: "views", label: { he: "תצוגות", en: "Views" }, icon: LayoutGrid },
  { id: "card_browser", label: { he: "דפדפן כרטיסים", en: "Card Browser" }, icon: CreditCard },
  { id: "communication", label: { he: "תקשורת", en: "Communication" }, icon: MessageCircle },
  { id: "editing", label: { he: "עריכה", en: "Editing" }, icon: PenTool },
  { id: "filtering", label: { he: "סינון", en: "Filtering" }, icon: Filter },
  { id: "ai", label: { he: "AI", en: "AI" }, icon: Bot },
  { id: "custom", label: { he: "מותאם אישית", en: "Custom" }, icon: Star },
];

// ─── Shortcut Types ─────────────────────────────────────────

export interface ShortcutDefinition {
  id: string;
  keyCombo: string;
  actionSlug: string;
  category: ShortcutCategory;
  displayName: { he: string; en: string };
  isSystem: boolean;
  scope: ShortcutScope;
  sortOrder: number;
}

export interface UserShortcutOverride {
  shortcutId: string | null;
  keyCombo: string;
  actionSlug: string;
  category: ShortcutCategory;
  displayName: { he: string; en: string };
  isActive: boolean;
  isCustom: boolean;
}

// ─── System Shortcuts ───────────────────────────────────────

export const SYSTEM_SHORTCUTS: ShortcutDefinition[] = [
  // ── Navigation ──────────────────────────────────────────
  { id: "nav_layers", keyCombo: "Cmd+1", actionSlug: "nav_layers", category: "navigation", displayName: { he: "עבור לשכבות", en: "Go to Layers" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "nav_editor", keyCombo: "Cmd+2", actionSlug: "nav_editor", category: "navigation", displayName: { he: "עבור לעורך", en: "Go to Editor" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "nav_story_map", keyCombo: "Cmd+3", actionSlug: "nav_story_map", category: "navigation", displayName: { he: "עבור למפת סיפור", en: "Go to Story Map" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "nav_functional_map", keyCombo: "Cmd+4", actionSlug: "nav_functional_map", category: "navigation", displayName: { he: "עבור למפה פונקציונלית", en: "Go to Functional Map" }, isSystem: true, scope: "global", sortOrder: 4 },
  { id: "nav_ai_hub", keyCombo: "Cmd+5", actionSlug: "nav_ai_hub", category: "navigation", displayName: { he: "עבור למרכז AI", en: "Go to AI Hub" }, isSystem: true, scope: "global", sortOrder: 5 },
  { id: "nav_design_system", keyCombo: "Cmd+6", actionSlug: "nav_design_system", category: "navigation", displayName: { he: "עבור למערכת עיצוב", en: "Go to Design System" }, isSystem: true, scope: "global", sortOrder: 6 },
  { id: "nav_formily", keyCombo: "Cmd+7", actionSlug: "nav_formily", category: "navigation", displayName: { he: "עבור לטפסים", en: "Go to Formily" }, isSystem: true, scope: "global", sortOrder: 7 },
  { id: "nav_architecture", keyCombo: "Cmd+8", actionSlug: "nav_architecture", category: "navigation", displayName: { he: "עבור לארכיטקטורה", en: "Go to Architecture" }, isSystem: true, scope: "global", sortOrder: 8 },
  { id: "nav_plan", keyCombo: "Cmd+9", actionSlug: "nav_plan", category: "navigation", displayName: { he: "עבור לתוכנית", en: "Go to Plan" }, isSystem: true, scope: "global", sortOrder: 9 },
  { id: "nav_home", keyCombo: "Cmd+H", actionSlug: "nav_home", category: "navigation", displayName: { he: "חזור לדשבורד", en: "Go Home" }, isSystem: true, scope: "global", sortOrder: 10 },

  // ── Quick Actions ───────────────────────────────────────
  { id: "search_open", keyCombo: "Cmd+K", actionSlug: "search_open", category: "actions", displayName: { he: "פתח חיפוש", en: "Open Search" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "shortcuts_open", keyCombo: "Cmd+/", actionSlug: "shortcuts_open", category: "actions", displayName: { he: "פתח קיצורים", en: "Open Shortcuts" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "ai_toggle", keyCombo: "Cmd+J", actionSlug: "ai_toggle", category: "actions", displayName: { he: "פתח/סגור AI", en: "Toggle AI Panel" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "quick_create", keyCombo: "Cmd+Shift+N", actionSlug: "quick_create", category: "actions", displayName: { he: "יצירה מהירה", en: "Quick Create" }, isSystem: true, scope: "global", sortOrder: 4 },
  { id: "new_document", keyCombo: "Cmd+Shift+D", actionSlug: "new_document", category: "actions", displayName: { he: "מסמך חדש", en: "New Document" }, isSystem: true, scope: "global", sortOrder: 5 },
  { id: "new_project", keyCombo: "Cmd+Shift+P", actionSlug: "new_project", category: "actions", displayName: { he: "פרויקט חדש", en: "New Project" }, isSystem: true, scope: "global", sortOrder: 6 },
  { id: "toggle_sidebar", keyCombo: "Cmd+\\", actionSlug: "toggle_sidebar", category: "actions", displayName: { he: "הצג/הסתר סרגל צד", en: "Toggle Sidebar" }, isSystem: true, scope: "global", sortOrder: 7 },
  { id: "toggle_edit_mode", keyCombo: "Cmd+E", actionSlug: "toggle_edit_mode", category: "actions", displayName: { he: "מצב עריכה", en: "Toggle Edit Mode" }, isSystem: true, scope: "global", sortOrder: 8 },

  // ── Views ───────────────────────────────────────────────
  { id: "view_grid", keyCombo: "Cmd+Shift+G", actionSlug: "view_grid", category: "views", displayName: { he: "תצוגת רשת", en: "Grid View" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "view_list", keyCombo: "Cmd+Shift+L", actionSlug: "view_list", category: "views", displayName: { he: "תצוגת רשימה", en: "List View" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "view_board", keyCombo: "Cmd+Shift+B", actionSlug: "view_board", category: "views", displayName: { he: "תצוגת לוח", en: "Board View" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "fullscreen", keyCombo: "Cmd+Shift+F", actionSlug: "fullscreen", category: "views", displayName: { he: "מסך מלא", en: "Fullscreen" }, isSystem: true, scope: "global", sortOrder: 4 },

  // ── Card Browser ────────────────────────────────────────
  { id: "card_next", keyCombo: "J", actionSlug: "card_next", category: "card_browser", displayName: { he: "כרטיס הבא", en: "Next Card" }, isSystem: true, scope: "card_browser", sortOrder: 1 },
  { id: "card_prev", keyCombo: "K", actionSlug: "card_prev", category: "card_browser", displayName: { he: "כרטיס קודם", en: "Previous Card" }, isSystem: true, scope: "card_browser", sortOrder: 2 },
  { id: "card_open", keyCombo: "Enter", actionSlug: "card_open", category: "card_browser", displayName: { he: "פתח כרטיס", en: "Open Card" }, isSystem: true, scope: "card_browser", sortOrder: 3 },
  { id: "card_expand", keyCombo: "X", actionSlug: "card_expand", category: "card_browser", displayName: { he: "הרחב כרטיס", en: "Expand Card" }, isSystem: true, scope: "card_browser", sortOrder: 4 },
  { id: "card_archive", keyCombo: "A", actionSlug: "card_archive", category: "card_browser", displayName: { he: "העבר לארכיון", en: "Archive Card" }, isSystem: true, scope: "card_browser", sortOrder: 5 },

  // ── Communication ───────────────────────────────────────
  { id: "open_wati", keyCombo: "Cmd+Shift+W", actionSlug: "open_wati", category: "communication", displayName: { he: "פתח WATI", en: "Open WATI" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "open_notifications", keyCombo: "Cmd+Shift+I", actionSlug: "open_notifications", category: "communication", displayName: { he: "פתח התראות", en: "Open Notifications" }, isSystem: true, scope: "global", sortOrder: 2 },

  // ── Editing ─────────────────────────────────────────────
  { id: "editor_save", keyCombo: "Cmd+S", actionSlug: "editor_save", category: "editing", displayName: { he: "שמור", en: "Save" }, isSystem: true, scope: "editor", sortOrder: 1 },
  { id: "editor_bold", keyCombo: "Cmd+B", actionSlug: "editor_bold", category: "editing", displayName: { he: "מודגש", en: "Bold" }, isSystem: true, scope: "editor", sortOrder: 2 },
  { id: "editor_italic", keyCombo: "Cmd+I", actionSlug: "editor_italic", category: "editing", displayName: { he: "נטוי", en: "Italic" }, isSystem: true, scope: "editor", sortOrder: 3 },
  { id: "editor_undo", keyCombo: "Cmd+Z", actionSlug: "editor_undo", category: "editing", displayName: { he: "בטל", en: "Undo" }, isSystem: true, scope: "editor", sortOrder: 4 },
  { id: "editor_redo", keyCombo: "Cmd+Shift+Z", actionSlug: "editor_redo", category: "editing", displayName: { he: "בצע שוב", en: "Redo" }, isSystem: true, scope: "editor", sortOrder: 5 },

  // ── Filtering ───────────────────────────────────────────
  { id: "filter_toggle", keyCombo: "Cmd+F", actionSlug: "filter_toggle", category: "filtering", displayName: { he: "חיפוש בעמוד", en: "Find in Page" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "filter_by_status", keyCombo: "Cmd+Shift+S", actionSlug: "filter_by_status", category: "filtering", displayName: { he: "סנן לפי סטטוס", en: "Filter by Status" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "filter_by_layer", keyCombo: "Cmd+Shift+Y", actionSlug: "filter_by_layer", category: "filtering", displayName: { he: "סנן לפי שכבה", en: "Filter by Layer" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "filter_clear", keyCombo: "Cmd+Shift+X", actionSlug: "filter_clear", category: "filtering", displayName: { he: "נקה סינון", en: "Clear Filters" }, isSystem: true, scope: "global", sortOrder: 4 },

  // ── AI ──────────────────────────────────────────────────
  { id: "ai_chat_mode", keyCombo: "Cmd+Shift+C", actionSlug: "ai_chat_mode", category: "ai", displayName: { he: "מצב שיחה", en: "Chat Mode" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "ai_analyze_mode", keyCombo: "Cmd+Shift+A", actionSlug: "ai_analyze_mode", category: "ai", displayName: { he: "מצב ניתוח", en: "Analyze Mode" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "ai_write_mode", keyCombo: "Cmd+Shift+R", actionSlug: "ai_write_mode", category: "ai", displayName: { he: "מצב כתיבה", en: "Write Mode" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "ai_clear_chat", keyCombo: "Cmd+Shift+K", actionSlug: "ai_clear_chat", category: "ai", displayName: { he: "נקה שיחת AI", en: "Clear AI Chat" }, isSystem: true, scope: "global", sortOrder: 4 },
];

// ─── OS-Reserved Combos ────────────────────────────────────
// These combos are handled by the OS / browser and must never be intercepted.
// They are displayed in the UI as "system reserved".

export const RESERVED_COMBOS: string[] = [
  "Cmd+C",
  "Cmd+V",
  "Cmd+X",
  "Cmd+A",
  "Cmd+Q",
  "Cmd+W",
  "Cmd+T",
  "Cmd+Tab",
  "Cmd+Shift+T",
];

export function getCategoryById(id: ShortcutCategory): CategoryDefinition | undefined {
  return SHORTCUT_CATEGORIES.find((c) => c.id === id);
}
