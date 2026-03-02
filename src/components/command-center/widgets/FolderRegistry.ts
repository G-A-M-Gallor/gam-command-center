import {
  FileText,
  FolderPlus,
  CheckSquare,
  Search,
  Bot,
  Layers,
  PenTool,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { WidgetSize } from "./WidgetRegistry";

// ─── Folder Item Types ──────────────────────────────────────

export interface FolderItemWidget {
  type: "widget";
  id: string;
  widgetId: string;
}

export interface FolderItemShortcut {
  type: "shortcut";
  id: string;
  widgetId: string;
}

export type QuickActionId =
  | "create-document"
  | "create-project"
  | "create-task"
  | "open-search"
  | "open-ai"
  | "navigate-layers"
  | "navigate-editor"
  | "navigate-settings";

export interface FolderItemAction {
  type: "action";
  id: string;
  actionId: QuickActionId;
}

export type FolderItem =
  | FolderItemWidget
  | FolderItemShortcut
  | FolderItemAction;

// ─── Folder Definition ──────────────────────────────────────

export interface FolderDefinition {
  id: string;
  label: { he: string; en: string };
  icon: string;
  defaultSize: WidgetSize;
  gridCols: number;
  gridRows: number;
  items: FolderItem[];
  pinned: boolean;
}

// ─── Action Config ──────────────────────────────────────────

export interface ActionConfig {
  icon: LucideIcon;
  color: string;
  label: { he: string; en: string };
}

export const ACTION_CONFIG: Record<QuickActionId, ActionConfig> = {
  "create-document": {
    icon: FileText,
    color: "text-blue-400",
    label: { he: "מסמך חדש", en: "New Document" },
  },
  "create-project": {
    icon: FolderPlus,
    color: "text-emerald-400",
    label: { he: "פרויקט חדש", en: "New Project" },
  },
  "create-task": {
    icon: CheckSquare,
    color: "text-amber-400",
    label: { he: "משימה חדשה", en: "New Task" },
  },
  "open-search": {
    icon: Search,
    color: "text-slate-300",
    label: { he: "חיפוש", en: "Search" },
  },
  "open-ai": {
    icon: Bot,
    color: "text-purple-400",
    label: { he: "עוזר AI", en: "AI Assistant" },
  },
  "navigate-layers": {
    icon: Layers,
    color: "text-cyan-400",
    label: { he: "שכבות", en: "Layers" },
  },
  "navigate-editor": {
    icon: PenTool,
    color: "text-indigo-400",
    label: { he: "עורך", en: "Editor" },
  },
  "navigate-settings": {
    icon: Settings,
    color: "text-slate-400",
    label: { he: "הגדרות", en: "Settings" },
  },
};

export const ALL_ACTION_IDS = Object.keys(ACTION_CONFIG) as QuickActionId[];

// ─── Emoji Options ──────────────────────────────────────────

export const EMOJI_OPTIONS = [
  "📁", "⚡", "🔧", "🎯", "📋", "🔗", "💡", "⭐",
  "🚀", "📊", "🏠", "💼", "🔥", "💎", "🎨", "📝",
  "🛠️", "📌", "🧩", "🔒",
];
