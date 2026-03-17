/**
 * Skin Registry — All available skins with metadata
 */

import type {
  ShellSkinMeta,
  ContentSkinMeta,
  MobileNavSkinMeta,
  ShellSkinId,
  ContentSkinId,
  MobileNavSkinId,
} from "./types";

// ─── Shell Skins ──────────────────────────────────────────

export const SHELL_SKINS: ShellSkinMeta[] = [
  {
    id: "classic",
    name: { he: "קלאסי", en: "Classic", ru: "Классический" },
    description: {
      he: "הסיידבר הנוכחי של vBrain — רשימה עם קבוצות, פילטרים ותצוגות",
      en: "Current vBrain sidebar — list with groups, filters and view modes",
      ru: "Текущий сайдбар vBrain — список с группами и фильтрами",
    },
    preview: "📋",
    features: ["groups", "filters", "3-view-modes", "folders", "favorites"],
  },
  {
    id: "linear-rail",
    name: { he: "רכבת (Linear)", en: "Rail (Linear)", ru: "Рельс (Linear)" },
    description: {
      he: "פס אייקונים צר + פאנל מורחב בהובר. מינימליסטי ומהיר",
      en: "Narrow icon rail + expanded panel on hover. Minimal and fast",
      ru: "Узкая панель иконок + расширение при наведении",
    },
    preview: "🚂",
    features: ["icon-rail", "hover-expand", "minimal", "keyboard-first"],
  },
  {
    id: "notion-tree",
    name: { he: "עץ (Notion)", en: "Tree (Notion)", ru: "Дерево (Notion)" },
    description: {
      he: "עץ היררכי עם קינון — כל דף מתרחב לתת-דפים ותצוגות",
      en: "Hierarchical tree with nesting — each page expands to sub-pages and views",
      ru: "Иерархическое дерево — страницы раскрываются в подстраницы",
    },
    preview: "🌳",
    features: ["tree", "nesting", "expandable", "drag-reorder"],
  },
  {
    id: "attio-split",
    name: { he: "מפוצל (Attio)", en: "Split (Attio)", ru: "Разделённый (Attio)" },
    description: {
      he: "הפרדה ברורה: כלים למעלה, ישויות באמצע, תצוגות למטה",
      en: "Clear separation: Tools on top, Entities in middle, Views at bottom",
      ru: "Чёткое разделение: инструменты, сущности, представления",
    },
    preview: "📊",
    features: ["3-sections", "tools-data-views", "counts", "clean"],
  },
  {
    id: "minimal-icons",
    name: { he: "אייקונים מינימליים", en: "Minimal Icons", ru: "Минимальные иконки" },
    description: {
      he: "רק אייקונים, תמיד. טולטיפ בהובר, קליק לניווט",
      en: "Icons only, always. Tooltip on hover, click to navigate",
      ru: "Только иконки. Подсказка при наведении, клик для навигации",
    },
    preview: "⚡",
    features: ["icons-only", "tooltip", "ultra-compact", "max-content-area"],
  },
  {
    id: "command-first",
    name: { he: "Command First", en: "Command First", ru: "Command First" },
    description: {
      he: "סיידבר מוסתר ברירת מחדל. ⌃K לניווט. מקסימום שטח תוכן",
      en: "Sidebar hidden by default. Ctrl+K to navigate. Maximum content area",
      ru: "Сайдбар скрыт. Ctrl+K для навигации. Максимум контента",
    },
    preview: "⌨️",
    features: ["hidden-sidebar", "command-palette", "full-screen", "power-user"],
  },
];

// ─── Content Skins ────────────────────────────────────────

export const CONTENT_SKINS: ContentSkinMeta[] = [
  {
    id: "dark-cards",
    name: { he: "כרטיסיות כהות", en: "Dark Cards", ru: "Тёмные карточки" },
    description: {
      he: "העיצוב הנוכחי — כרטיסיות כהות עם מסגרות דקות",
      en: "Current design — dark cards with subtle borders",
      ru: "Текущий дизайн — тёмные карточки с тонкими рамками",
    },
    preview: "🌑",
    features: ["dark", "bordered", "classic"],
  },
  {
    id: "bento-grid",
    name: { he: "בנטו גריד", en: "Bento Grid", ru: "Бенто сетка" },
    description: {
      he: "פריסת בנטו — בלוקים בגדלים שונים כמו Apple",
      en: "Bento layout — mixed-size blocks like Apple",
      ru: "Бенто — блоки разных размеров в стиле Apple",
    },
    preview: "🍱",
    features: ["bento", "mixed-sizes", "modern", "visual"],
  },
  {
    id: "minimal-clean",
    name: { he: "מינימלי נקי", en: "Minimal Clean", ru: "Минимальный чистый" },
    description: {
      he: "הרבה רווח לבן, טיפוגרפיה חזקה, מעט צבע",
      en: "Lots of white space, strong typography, minimal color",
      ru: "Много пространства, сильная типографика, минимум цвета",
    },
    preview: "✨",
    features: ["whitespace", "typography", "clean", "calm"],
  },
  {
    id: "dense-data",
    name: { he: "נתונים צפופים", en: "Dense Data", ru: "Плотные данные" },
    description: {
      he: "מקסימום מידע על המסך — טבלאות צפופות, גופן קטן",
      en: "Maximum info on screen — dense tables, small font",
      ru: "Максимум информации — плотные таблицы, мелкий шрифт",
    },
    preview: "📈",
    features: ["dense", "data-heavy", "small-font", "efficient"],
  },
  {
    id: "glassmorphism",
    name: { he: "זכוכית (Glass)", en: "Glassmorphism", ru: "Стекломорфизм" },
    description: {
      he: "אפקט זכוכית חלבית — שקיפות, blur, מסגרות זוהרות",
      en: "Frosted glass effect — transparency, blur, glowing borders",
      ru: "Эффект матового стекла — прозрачность, размытие, свечение",
    },
    preview: "🪟",
    features: ["glass", "blur", "transparent", "modern"],
  },
  {
    id: "soft-panels",
    name: { he: "פאנלים רכים", en: "Soft Panels", ru: "Мягкие панели" },
    description: {
      he: "פינות עגולות, צללים רכים, צבעים עדינים — הרגשה נעימה",
      en: "Rounded corners, soft shadows, gentle colors — cozy feel",
      ru: "Скруглённые углы, мягкие тени, нежные цвета",
    },
    preview: "☁️",
    features: ["rounded", "soft-shadow", "gentle", "cozy"],
  },
];

// ─── Mobile Nav Skins ─────────────────────────────────────

export const MOBILE_NAV_SKINS: MobileNavSkinMeta[] = [
  {
    id: "bottom-bar",
    name: { he: "סרגל תחתון", en: "Bottom Bar", ru: "Нижняя панель" },
    description: {
      he: "4-5 אייקונים קבועים בתחתית + כפתור תפריט לניווט מלא",
      en: "4-5 fixed icons at bottom + menu button for full navigation",
      ru: "4-5 иконок внизу + кнопка меню для полной навигации",
    },
    preview: "📱",
    escapeHatch: "Menu button always visible in bottom bar",
  },
  {
    id: "top-hamburger",
    name: { he: "המבורגר למעלה", en: "Top Hamburger", ru: "Гамбургер сверху" },
    description: {
      he: "כפתור המבורגר בפינה העליונה — לחיצה פותחת תפריט מלא",
      en: "Hamburger button in top corner — tap opens full menu",
      ru: "Кнопка-гамбургер вверху — открывает полное меню",
    },
    preview: "☰",
    escapeHatch: "Hamburger icon always visible in top-left/right corner",
  },
  {
    id: "floating-fab",
    name: { he: "כפתור צף", en: "Floating Button", ru: "Плавающая кнопка" },
    description: {
      he: "כפתור עגול צף — לחיצה פותחת תפריט מלא. ניתן לגרור למיקום",
      en: "Floating round button — tap opens full menu. Draggable position",
      ru: "Плавающая круглая кнопка — открывает полное меню",
    },
    preview: "🔘",
    escapeHatch: "FAB always visible, draggable to preferred position",
  },
  {
    id: "swipe-drawer",
    name: { he: "מגירה בהחלקה", en: "Swipe Drawer", ru: "Выдвижная панель" },
    description: {
      he: "החלקה מהקצה פותחת סיידבר מלא. כפתור גיבוי קבוע",
      en: "Swipe from edge opens full sidebar. Backup button always visible",
      ru: "Свайп от края открывает сайдбар. Резервная кнопка видна всегда",
    },
    preview: "👆",
    escapeHatch: "Small grab handle on edge + backup hamburger icon in header",
  },
  {
    id: "tab-drawer",
    name: { he: "טאבים + מגירה", en: "Tabs + Drawer", ru: "Вкладки + панель" },
    description: {
      he: "טאבים בתחתית לדברים הראשיים + מגירה לתפריט מלא",
      en: "Bottom tabs for main items + drawer for full menu",
      ru: "Вкладки внизу для основного + панель для полного меню",
    },
    preview: "📑",
    escapeHatch: "More tab in bottom bar always opens full navigation",
  },
  {
    id: "bottom-sheet",
    name: { he: "גיליון תחתון", en: "Bottom Sheet", ru: "Нижний лист" },
    description: {
      he: "משיכה למעלה מתחתית המסך — גיליון עם כל הניווט",
      en: "Pull up from bottom — sheet with all navigation",
      ru: "Потяните вверх снизу — лист с навигацией",
    },
    preview: "📄",
    escapeHatch: "Persistent grab handle at bottom of screen + swipe up gesture",
  },
];

// ─── Lookup helpers ───────────────────────────────────────

export function getShellSkin(id: ShellSkinId): ShellSkinMeta | undefined {
  return SHELL_SKINS.find((s) => s.id === id);
}

export function getContentSkin(id: ContentSkinId): ContentSkinMeta | undefined {
  return CONTENT_SKINS.find((s) => s.id === id);
}

export function getMobileNavSkin(id: MobileNavSkinId): MobileNavSkinMeta | undefined {
  return MOBILE_NAV_SKINS.find((s) => s.id === id);
}
