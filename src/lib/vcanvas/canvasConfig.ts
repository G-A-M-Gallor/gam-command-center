// ===================================================
// vCanvas — Shared Feature Configuration
// Controls which canvas features are enabled per context
// ===================================================

export type CanvasContext = "standalone" | "entity";

export interface CanvasFeatures {
  /** Drawing tools (pen, pencil, highlighter) */
  draw: boolean;
  /** Shape tools (rectangle, ellipse, arrow, line) */
  shapes: boolean;
  /** Text tool */
  text: boolean;
  /** Sticky notes */
  note: boolean;
  /** Image/media embedding */
  media: boolean;
  /** Frame tool (grouping) */
  frame: boolean;
  /** Hand/pan tool */
  hand: boolean;
  /** Eraser tool */
  eraser: boolean;
  /** Laser pointer */
  laser: boolean;
  /** Export to file */
  export: boolean;
  /** Pages (multiple pages support) */
  pages: boolean;
  /** Debug panel */
  debug: boolean;
}

const STORAGE_KEY = "cc-vcanvas-features";

/** All features ON — default for standalone */
const ALL_ON: CanvasFeatures = {
  draw: true,
  shapes: true,
  text: true,
  note: true,
  media: true,
  frame: true,
  hand: true,
  eraser: true,
  laser: true,
  export: true,
  pages: true,
  debug: false,
};

/** Minimal set — default for entity canvas */
const ENTITY_DEFAULTS: CanvasFeatures = {
  draw: true,
  shapes: true,
  text: true,
  note: false,
  media: false,
  frame: false,
  hand: true,
  eraser: true,
  laser: false,
  export: false,
  pages: false,
  debug: false,
};

export const FEATURE_LABELS: Record<keyof CanvasFeatures, { he: string; en: string; ru: string }> = {
  draw: { he: "כלי ציור", en: "Drawing Tools", ru: "Инструменты рисования" },
  shapes: { he: "צורות", en: "Shapes", ru: "Фигуры" },
  text: { he: "טקסט", en: "Text", ru: "Текст" },
  note: { he: "פתקים", en: "Sticky Notes", ru: "Стикеры" },
  media: { he: "מדיה", en: "Media", ru: "Медиа" },
  frame: { he: "מסגרות", en: "Frames", ru: "Рамки" },
  hand: { he: "יד / גרירה", en: "Hand / Pan", ru: "Рука / Перемещение" },
  eraser: { he: "מחק", en: "Eraser", ru: "Ластик" },
  laser: { he: "מצביע לייזר", en: "Laser Pointer", ru: "Лазерная указка" },
  export: { he: "ייצוא", en: "Export", ru: "Экспорт" },
  pages: { he: "עמודים", en: "Pages", ru: "Страницы" },
  debug: { he: "דיבאג", en: "Debug", ru: "Отладка" },
};

export const DEFAULT_FEATURES: Record<CanvasContext, CanvasFeatures> = {
  standalone: ALL_ON,
  entity: ENTITY_DEFAULTS,
};

/** Load saved features for a context */
export function loadFeatures(context: CanvasContext): CanvasFeatures {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${context}`);
    if (!raw) return DEFAULT_FEATURES[context];
    return { ...DEFAULT_FEATURES[context], ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FEATURES[context];
  }
}

/** Save features for a context */
export function saveFeatures(context: CanvasContext, features: CanvasFeatures): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${context}`, JSON.stringify(features));
  } catch {
    // Ignore localStorage save errors - not critical for functionality
  }
}

/** Reset features for a context to defaults */
export function resetFeatures(context: CanvasContext): CanvasFeatures {
  try {
    localStorage.removeItem(`${STORAGE_KEY}:${context}`);
  } catch {
    // Ignore localStorage remove errors - not critical for functionality
  }
  return DEFAULT_FEATURES[context];
}
