// ===================================================
// App Launcher — Types
// Home screen grid with apps, widgets, folders
// ===================================================

export type LaunchMode = "full-page" | "popup" | "side-panel" | "blur-card";
export type LauncherItemType = "page" | "widget";
export type LauncherCategory = "core" | "tools" | "system" | "widgets";

export interface LauncherItem {
  id: string;
  type: LauncherItemType;
  href?: string;
  iconName: string;
  label: { he: string; en: string; ru: string };
  description?: { he: string; en: string; ru: string };
  status: "active" | "coming-soon";
  defaultLaunchMode: LaunchMode;
  category: LauncherCategory;
  /** Widget registry ID if this is a widget */
  widgetId?: string;
}

export interface GridPosition {
  page: number;
  row: number;
  col: number;
}

export interface LauncherFolder {
  id: string;
  label: { he: string; en: string; ru: string };
  color: string;
  itemIds: string[];
}

export interface LauncherLayout {
  version: number;
  gridCols: number;
  gridRows: number;
  positions: Record<string, GridPosition>;
  folders: LauncherFolder[];
  launchModes: Record<string, LaunchMode>;
  hiddenItems: string[];
}

export interface LauncherState {
  layout: LauncherLayout;
  catalog: LauncherItem[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  selectedItemId: string | null;
  dragActiveId: string | null;
  expandedFolderId: string | null;
}
