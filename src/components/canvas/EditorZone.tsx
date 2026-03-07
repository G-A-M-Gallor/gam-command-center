'use client';

import type { JSONContent } from '@tiptap/react';
import { TiptapEditor } from '@/components/editor';
import type { GridRect } from '@/lib/canvas/types';

interface EditorZoneProps {
  editorZone: GridRect;
  cellSize: number;
  content: JSONContent;
  onChange: (json: JSONContent) => void;
  onSave: (json: JSONContent) => void;
  recordId: string;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date;
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
}: EditorZoneProps) {
  const style = {
    position: 'absolute' as const,
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
