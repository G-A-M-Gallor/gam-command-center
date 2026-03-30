/** Configuration stored in each block's JSONB (vblock_layouts.blocks[].storyMapConfig) */
export interface StoryMapConfig {
  trackField: string;
  doneValue: string;
  label: string;
  /** Static value override — used when no entityId (mock/manual steps) */
  staticValue?: string;
}

export interface StoryMapStep {
  blockId: string;
  label: string;
  trackField: string;
  doneValue: string;
  currentValue: unknown;
  isDone: boolean;
}

/** A block entry as stored in vblock_layouts.blocks JSONB array */
export interface LayoutBlock {
  blockId: string;
  entityType?: string;
  entityId?: string;
  storyMapConfig?: StoryMapConfig;
  [key: string]: any;
}

export interface StoryMapProps {
  /** Layout context id — used to fetch blocks from vblock_layouts */
  contextId?: string;
  /** Alternatively, pass blocks directly (e.g. mock data) */
  blocks?: LayoutBlock[];
  /** Scroll target when clicking a step */
  onStepClick?: (blockId: string) => void;
}
