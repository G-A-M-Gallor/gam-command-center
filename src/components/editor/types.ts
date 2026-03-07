// ===================================================
// GAM Command Center — Tiptap Editor Types
// Phase 1: S2.1
// ===================================================

import type { JSONContent } from '@tiptap/react';
import type { SaveState } from '@/lib/editor/useAutoSave';

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'horizontalRule';

export interface SlashCommandItem {
  title: string;
  titleHe: string;
  description: string;
  icon: string;
  command: (props: { editor: any; range: any }) => void;
  aliases: string[];
}

export interface TiptapEditorProps {
  /** Initial content as Tiptap JSON */
  content?: JSONContent;
  /** Callback on every content change */
  onChange?: (json: JSONContent) => void;
  /** Callback on save (Ctrl+S) */
  onSave?: (json: JSONContent) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Read-only mode */
  editable?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Record ID (for future block-level storage) */
  recordId?: string;
  /** Save status from parent — displayed in status bar */
  saveStatus?: SaveState;
  /** Timestamp of last successful save */
  lastSavedAt?: Date;
  /** Callback when user wants to reload after a conflict */
  onConflictReload?: () => void;
}

export interface FloatingToolbarProps {
  editor: any;
}

export interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  query: string;
}
