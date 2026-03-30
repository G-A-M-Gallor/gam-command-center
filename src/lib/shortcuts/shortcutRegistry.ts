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
  _Star,
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
  label: { he: string; en: string; ru: string };
  icon: LucideIcon;
}

export const SHORTCUT_CATEGORIES: CategoryDefinition[] = [
  { id: "navigation", label: { he: "ניווט", en: "Navigation", ru: "Навигация" }, icon: Compass },
  { id: "actions", label: { he: "פעולות מהירות", en: "Quick Actions", ru: "Быстрые действия" }, icon: Zap },
  { id: "views", label: { he: "תצוגות", en: "Views", ru: "Представления" }, icon: LayoutGrid },
  { id: "card_browser", label: { he: "דפדפן כרטיסים", en: "Card Browser", ru: "Браузер карточек" }, icon: CreditCard },
  { id: "communication", label: { he: "תקשורת", en: "Communication", ru: "Коммуникация" }, icon: MessageCircle },
  { id: "editing", label: { he: "עריכה", en: "Editing", ru: "Редактирование" }, icon: PenTool },
  { id: "filtering", label: { he: "סינון", en: "Filtering", ru: "Фильтрация" }, icon: Filter },
  { id: "ai", label: { he: "AI", en: "AI", ru: "AI" }, icon: Bot },
  { id: "custom", label: { he: "מותאם אישית", en: "Custom", ru: "Пользовательские" }, icon: _Star },
];

// ─── Shortcut Types ─────────────────────────────────────────

export interface ShortcutDefinition {
  id: string;
  keyCombo: string;
  actionSlug: string;
  category: ShortcutCategory;
  displayName: { he: string; en: string; ru: string };
  isSystem: boolean;
  scope: ShortcutScope;
  sortOrder: number;
}

export interface UserShortcutOverride {
  shortcutId: string | null;
  keyCombo: string;
  actionSlug: string;
  category: ShortcutCategory;
  displayName: { he: string; en: string; ru: string };
  isActive: boolean;
  isCustom: boolean;
}

// ─── System Shortcuts ───────────────────────────────────────

export const SYSTEM_SHORTCUTS: ShortcutDefinition[] = [
  // ── Navigation ──────────────────────────────────────────
  { id: "nav_layers", keyCombo: "Ctrl+1", actionSlug: "nav_layers", category: "navigation", displayName: { he: "עבור לשכבות", en: "Go to Layers", ru: "Перейти к слоям" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "nav_editor", keyCombo: "Ctrl+2", actionSlug: "nav_editor", category: "navigation", displayName: { he: "עבור לעורך", en: "Go to Editor", ru: "Перейти к редактору" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "nav_story_map", keyCombo: "Ctrl+3", actionSlug: "nav_story_map", category: "navigation", displayName: { he: "עבור למפת סיפור", en: "Go to Story Map", ru: "Перейти к карте историй" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "nav_functional_map", keyCombo: "Ctrl+4", actionSlug: "nav_functional_map", category: "navigation", displayName: { he: "עבור למפה פונקציונלית", en: "Go to Functional Map", ru: "Перейти к функциональной карте" }, isSystem: true, scope: "global", sortOrder: 4 },
  { id: "nav_ai_hub", keyCombo: "Ctrl+5", actionSlug: "nav_ai_hub", category: "navigation", displayName: { he: "עבור למרכז AI", en: "Go to AI Hub", ru: "Перейти к центру AI" }, isSystem: true, scope: "global", sortOrder: 5 },
  { id: "nav_design_system", keyCombo: "Ctrl+6", actionSlug: "nav_design_system", category: "navigation", displayName: { he: "עבור למערכת עיצוב", en: "Go to Design System", ru: "Перейти к дизайн-системе" }, isSystem: true, scope: "global", sortOrder: 6 },
  { id: "nav_architecture", keyCombo: "Ctrl+7", actionSlug: "nav_architecture", category: "navigation", displayName: { he: "עבור לארכיטקטורה", en: "Go to Architecture", ru: "Перейти к архитектуре" }, isSystem: true, scope: "global", sortOrder: 7 },
  { id: "nav_plan", keyCombo: "Ctrl+8", actionSlug: "nav_plan", category: "navigation", displayName: { he: "עבור לתוכנית", en: "Go to Plan", ru: "Перейти к плану" }, isSystem: true, scope: "global", sortOrder: 8 },
  { id: "nav_home", keyCombo: "Ctrl+H", actionSlug: "nav_home", category: "navigation", displayName: { he: "חזור לדשבורד", en: "Go Home", ru: "На главную" }, isSystem: true, scope: "global", sortOrder: 10 },

  // ── Quick Actions ───────────────────────────────────────
  { id: "search_open", keyCombo: "Cmd+K", actionSlug: "search_open", category: "actions", displayName: { he: "פתח חיפוש", en: "Open Search", ru: "Открыть поиск" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "shortcuts_open", keyCombo: "Ctrl+/", actionSlug: "shortcuts_open", category: "actions", displayName: { he: "פתח קיצורים", en: "Open Shortcuts", ru: "Открыть горячие клавиши" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "ai_toggle", keyCombo: "Ctrl+J", actionSlug: "ai_toggle", category: "actions", displayName: { he: "פתח/סגור AI", en: "Toggle AI Panel", ru: "Переключить панель AI" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "quick_create", keyCombo: "Ctrl+Shift+N", actionSlug: "quick_create", category: "actions", displayName: { he: "יצירה מהירה", en: "Quick Create", ru: "Быстрое создание" }, isSystem: true, scope: "global", sortOrder: 4 },
  { id: "new_document", keyCombo: "Ctrl+Shift+D", actionSlug: "new_document", category: "actions", displayName: { he: "מסמך חדש", en: "New Document", ru: "Новый документ" }, isSystem: true, scope: "global", sortOrder: 5 },
  { id: "new_project", keyCombo: "Ctrl+Shift+P", actionSlug: "new_project", category: "actions", displayName: { he: "פרויקט חדש", en: "New Project", ru: "Новый проект" }, isSystem: true, scope: "global", sortOrder: 6 },
  { id: "toggle_sidebar", keyCombo: "Ctrl+\\", actionSlug: "toggle_sidebar", category: "actions", displayName: { he: "הצג/הסתר סרגל צד", en: "Toggle Sidebar", ru: "Переключить боковую панель" }, isSystem: true, scope: "global", sortOrder: 7 },
  { id: "toggle_edit_mode", keyCombo: "Ctrl+E", actionSlug: "toggle_edit_mode", category: "actions", displayName: { he: "מצב עריכה", en: "Toggle Edit Mode", ru: "Режим редактирования" }, isSystem: true, scope: "global", sortOrder: 8 },

  // ── Views ───────────────────────────────────────────────
  { id: "view_grid", keyCombo: "Ctrl+Shift+G", actionSlug: "view_grid", category: "views", displayName: { he: "תצוגת רשת", en: "Grid View", ru: "Сетка" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "view_list", keyCombo: "Ctrl+Shift+L", actionSlug: "view_list", category: "views", displayName: { he: "תצוגת רשימה", en: "List View", ru: "Список" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "view_board", keyCombo: "Ctrl+Shift+B", actionSlug: "view_board", category: "views", displayName: { he: "תצוגת לוח", en: "Board View", ru: "Доска" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "fullscreen", keyCombo: "Ctrl+Shift+F", actionSlug: "fullscreen", category: "views", displayName: { he: "מסך מלא", en: "Fullscreen", ru: "Полный экран" }, isSystem: true, scope: "global", sortOrder: 4 },

  // ── Card Browser ────────────────────────────────────────
  { id: "card_next", keyCombo: "J", actionSlug: "card_next", category: "card_browser", displayName: { he: "כרטיס הבא", en: "Next Card", ru: "Следующая карточка" }, isSystem: true, scope: "card_browser", sortOrder: 1 },
  { id: "card_prev", keyCombo: "K", actionSlug: "card_prev", category: "card_browser", displayName: { he: "כרטיס קודם", en: "Previous Card", ru: "Предыдущая карточка" }, isSystem: true, scope: "card_browser", sortOrder: 2 },
  { id: "card_open", keyCombo: "Enter", actionSlug: "card_open", category: "card_browser", displayName: { he: "פתח כרטיס", en: "Open Card", ru: "Открыть карточку" }, isSystem: true, scope: "card_browser", sortOrder: 3 },
  { id: "card_expand", keyCombo: "X", actionSlug: "card_expand", category: "card_browser", displayName: { he: "הרחב כרטיס", en: "Expand Card", ru: "Развернуть карточку" }, isSystem: true, scope: "card_browser", sortOrder: 4 },
  { id: "card_archive", keyCombo: "A", actionSlug: "card_archive", category: "card_browser", displayName: { he: "העבר לארכיון", en: "Archive Card", ru: "В архив" }, isSystem: true, scope: "card_browser", sortOrder: 5 },

  // ── Communication ───────────────────────────────────────
  { id: "open_wati", keyCombo: "Ctrl+Shift+W", actionSlug: "open_wati", category: "communication", displayName: { he: "פתח WATI", en: "Open WATI", ru: "Открыть WATI" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "open_notifications", keyCombo: "Ctrl+Shift+I", actionSlug: "open_notifications", category: "communication", displayName: { he: "פתח התראות", en: "Open Notifications", ru: "Открыть уведомления" }, isSystem: true, scope: "global", sortOrder: 2 },

  // ── Editing (editor scope — keep Cmd for native text editing) ──
  { id: "editor_save", keyCombo: "Cmd+S", actionSlug: "editor_save", category: "editing", displayName: { he: "שמור", en: "Save", ru: "Сохранить" }, isSystem: true, scope: "editor", sortOrder: 1 },
  { id: "editor_bold", keyCombo: "Cmd+B", actionSlug: "editor_bold", category: "editing", displayName: { he: "מודגש", en: "Bold", ru: "Жирный" }, isSystem: true, scope: "editor", sortOrder: 2 },
  { id: "editor_italic", keyCombo: "Cmd+I", actionSlug: "editor_italic", category: "editing", displayName: { he: "נטוי", en: "Italic", ru: "Курсив" }, isSystem: true, scope: "editor", sortOrder: 3 },
  { id: "editor_undo", keyCombo: "Cmd+Z", actionSlug: "editor_undo", category: "editing", displayName: { he: "בטל", en: "Undo", ru: "Отменить" }, isSystem: true, scope: "editor", sortOrder: 4 },
  { id: "editor_redo", keyCombo: "Cmd+Shift+Z", actionSlug: "editor_redo", category: "editing", displayName: { he: "בצע שוב", en: "Redo", ru: "Повторить" }, isSystem: true, scope: "editor", sortOrder: 5 },

  // ── Filtering ───────────────────────────────────────────
  { id: "filter_toggle", keyCombo: "Ctrl+F", actionSlug: "filter_toggle", category: "filtering", displayName: { he: "חיפוש בעמוד", en: "Find in Page", ru: "Поиск на странице" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "filter_by_status", keyCombo: "Ctrl+Shift+S", actionSlug: "filter_by_status", category: "filtering", displayName: { he: "סנן לפי סטטוס", en: "Filter by Status", ru: "Фильтр по статусу" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "filter_by_layer", keyCombo: "Ctrl+Shift+Y", actionSlug: "filter_by_layer", category: "filtering", displayName: { he: "סנן לפי שכבה", en: "Filter by Layer", ru: "Фильтр по слою" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "filter_clear", keyCombo: "Ctrl+Shift+X", actionSlug: "filter_clear", category: "filtering", displayName: { he: "נקה סינון", en: "Clear Filters", ru: "Сбросить фильтры" }, isSystem: true, scope: "global", sortOrder: 4 },

  // ── AI ──────────────────────────────────────────────────
  { id: "ai_chat_mode", keyCombo: "Ctrl+Shift+C", actionSlug: "ai_chat_mode", category: "ai", displayName: { he: "מצב שיחה", en: "Chat Mode", ru: "Режим чата" }, isSystem: true, scope: "global", sortOrder: 1 },
  { id: "ai_analyze_mode", keyCombo: "Ctrl+Shift+A", actionSlug: "ai_analyze_mode", category: "ai", displayName: { he: "מצב ניתוח", en: "Analyze Mode", ru: "Режим анализа" }, isSystem: true, scope: "global", sortOrder: 2 },
  { id: "ai_write_mode", keyCombo: "Ctrl+Shift+R", actionSlug: "ai_write_mode", category: "ai", displayName: { he: "מצב כתיבה", en: "Write Mode", ru: "Режим записи" }, isSystem: true, scope: "global", sortOrder: 3 },
  { id: "ai_clear_chat", keyCombo: "Ctrl+Shift+K", actionSlug: "ai_clear_chat", category: "ai", displayName: { he: "נקה שיחת AI", en: "Clear AI Chat", ru: "Очистить чат AI" }, isSystem: true, scope: "global", sortOrder: 4 },

  // ── Gibberish Converter ───────────────────────────────────
  { id: "gibberish_to_he", keyCombo: "Ctrl+Shift+H", actionSlug: "gibberish_to_he", category: "editing", displayName: { he: "המר לעברית (Gibberish)", en: "Convert to Hebrew (Gibberish)", ru: "Конвертировать в иврит (Gibberish)" }, isSystem: true, scope: "global", sortOrder: 10 },
  { id: "gibberish_to_en", keyCombo: "Ctrl+Shift+E", actionSlug: "gibberish_to_en", category: "editing", displayName: { he: "המר לאנגלית (Gibberish)", en: "Convert to English (Gibberish)", ru: "Конвертировать в английский (Gibberish)" }, isSystem: true, scope: "global", sortOrder: 11 },
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
  "Cmd+R",
  "Cmd+L",
  "Cmd+N",
  "Cmd+P",
  "Cmd+F",
  "Cmd+D",
  "Cmd+Tab",
  "Cmd+Shift+T",
  "Cmd+Shift+R",
];

export function getCategoryById(id: ShortcutCategory): CategoryDefinition | undefined {
  return SHORTCUT_CATEGORIES.find((c) => c.id === id);
}
