export type VBlockMode = "compact" | "standard" | "expanded" | "fullscreen";
export type VBlockSize = { width: number; height: number };

export const VBLOCK_BREAKPOINTS = {
  compact: { maxWidth: 200, maxHeight: 150 },
  standard: { maxWidth: 400, maxHeight: 350 },
  expanded: { maxWidth: 800, maxHeight: 600 },
  fullscreen: { maxWidth: Infinity, maxHeight: Infinity },
} as const;

export interface VBlockAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  dividerBefore?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export type VBlockEvent =
  | { type: "block.resized"; blockId: string; size: VBlockSize; mode: VBlockMode }
  | { type: "block.dragged"; blockId: string; position: { x: number; y: number } }
  | { type: "block.settings.opened"; blockId: string }
  | { type: "block.fullscreen.requested"; blockId: string }
  | { type: "block.fullscreen.exited"; blockId: string }
  | { type: "block.context.action"; blockId: string; actionId: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "block.content.updated"; blockId: string; data?: any };

export interface VBlockFlipConfig {
  enabled: boolean;
  frontLabel?: string;
  backLabel?: string;
}

export interface VBlockShellProps {
  blockId: string;
  title: string;
  icon?: string;
  initialSize?: VBlockSize;
  size?: VBlockSize;
  minSize?: VBlockSize;
  maxSize?: VBlockSize;
  resizable?: boolean;
  draggable?: boolean;
  flip?: VBlockFlipConfig;
  contextActions?: VBlockAction[];
  onSettings?: () => void;
  showSettings?: boolean;
  onFullscreen?: "expand" | "navigate";
  onEvent?: (event: VBlockEvent) => void;
  children:
    | React.ReactNode
    | ((args: {
        mode: VBlockMode;
        size: VBlockSize;
        page: "front" | "back" | "both";
      }) => React.ReactNode);
}
