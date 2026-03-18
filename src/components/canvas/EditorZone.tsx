'use client';

import type { JSONContent } from '@tiptap/react';
import { TiptapEditor } from '@/components/editor';
import type { GridRect, EditorDirection } from '@/lib/canvas/types';
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
  visibleColumns?: number;
  direction?: EditorDirection;
}

export function EditorZone({
  content,
  onChange,
  onSave,
  recordId,
  saveStatus,
  lastSavedAt,
  direction = 'rtl',
}: EditorZoneProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: '1.5%',
    top: 0,
    width: '97%',
    minHeight: '100%',
    zIndex: 2,
  };

  return (
    <div
      style={style}
      className="gam-canvas-editor-zone flex flex-col rounded-lg border border-slate-700/30 bg-slate-900/50 overflow-visible"
    >
      <TiptapEditor
        content={content}
        onChange={onChange}
        onSave={onSave}
        autoFocus
        recordId={recordId}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        className="flex-1"
        direction={direction}
      />
    </div>
  );
}
