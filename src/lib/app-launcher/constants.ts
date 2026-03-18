// ===================================================
// App Launcher — Constants
// ===================================================

export const GRID_COLS = 9;
export const GRID_ROWS = 4;
export const SLOTS_PER_PAGE = GRID_COLS * GRID_ROWS;
export const STORAGE_KEY = "cc-app-launcher-layout";
export const LAYOUT_VERSION = 2;

export const CATEGORY_ORDER: Record<string, number> = {
  core: 0,
  tools: 1,
  system: 2,
  widgets: 3,
};

export const CATEGORY_LABELS = {
  core: { he: "ליבה", en: "Core", ru: "Основное" },
  tools: { he: "כלים", en: "Tools", ru: "Инструменты" },
  system: { he: "מערכת", en: "System", ru: "Система" },
  widgets: { he: "ווידג׳טים", en: "Widgets", ru: "Виджеты" },
};

export const LAUNCH_MODE_LABELS = {
  "full-page": { he: "דף מלא", en: "Full Page", ru: "Полная страница" },
  popup: { he: "בועה", en: "Popup", ru: "Всплывающее" },
  "side-panel": { he: "פאנל צד", en: "Side Panel", ru: "Боковая панель" },
  "blur-card": { he: "כרטיסיה", en: "Card", ru: "Карточка" },
};
