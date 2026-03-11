// ─── Slides / Presentation Types ────────────────────────────

export type SlideElementType = "text" | "image" | "shape";
export type ShapeType = "rectangle" | "circle" | "arrow" | "line";

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** Z-index for layering */
  zIndex: number;
  // Text properties
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  color?: string;
  // Image properties
  src?: string;
  objectFit?: "cover" | "contain" | "fill";
  // Shape properties
  shapeType?: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface Slide {
  id: string;
  /** Background color or gradient */
  background: string;
  /** Background image URL */
  backgroundImage?: string;
  elements: SlideElement[];
}

export interface SlidePresentation {
  id: string;
  name: string;
  slides: Slide[];
  /** 16:9 aspect ratio base dimensions */
  width: number;
  height: number;
}

export const SLIDE_WIDTH = 960;
export const SLIDE_HEIGHT = 540;
export const THUMBNAIL_SCALE = 0.18;
