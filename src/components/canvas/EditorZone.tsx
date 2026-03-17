'use client';

import type { JSONContent } from '@tiptap/react';
import { TiptapEditor } from '@/components/editor';
import type { GridRect } from '@/lib/canvas/types';
import type { SaveState } from '@/lib/editor/useAutoSave';

interface EditorZoneProps {
  editorZone: GridRect;
  cellSize: number;
  content: JSONContent;
  onChange: (json: JSONContent) => void;
  onSave: (json: JSONContent) => void;
  recordId: string;
  saveStatus: SaveState;
  lastSavedAt?: Date;
  /** Total visible columns — used to detect "full width" mode */
  visibleColumns?: number;
}

export function EditorZone({
  editorZone,
  cellSize,
  content,
  onChange,
  onSave,
  recordId,
  saveStatus,
  lastSavedAt,
  visibleColumns,
}: EditorZoneProps) {
  // Full-width mode: when col_span exceeds visible columns or is >= 12
  const isFullWidth = visibleColumns ? editorZone.col_span >= visibleColumns : editorZone.col_span >= 12;

  const style: React.CSSProperties = isFullWidth
    ? {
        position: 'absolute',
        left: 0,
        top: editorZone.row * cellSize,
        width: '100%',
        minHeight: editorZone.row_span * cellSize,
        zIndex: 2,
      }
    : {
        position: 'absolute',
        left: editorZone.col * cellSize,
        top: editorZone.row * cellSize,
        width: editorZone.col_span * cellSize,
        minHeight: editorZone.row_span * cellSize,
        zIndex: 2,
      };

  return (
    <div
      style={style}
      className="rounded-lg border border-slate-700/30 bg-slate-900/50"
    >
      <TiptapEditor
        content={content}
        onChange={onChange}
        onSave={onSave}
        autoFocus
        recordId={recordId}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
      />
    </div>
  );
}
