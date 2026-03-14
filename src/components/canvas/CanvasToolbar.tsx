'use client';

import { Grid3X3, Magnet, ZoomIn, ZoomOut, ArrowRight, Plus, Copy, Share2, Clock, LayoutTemplate } from 'lucide-react';
import { useCanvas } from '@/contexts/CanvasContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { ExportMenu } from '@/components/editor/ExportMenu';
import type { JSONContent } from '@tiptap/react';
import type { SaveState } from '@/lib/editor/useAutoSave';

interface CanvasToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onBack: () => void;
  saveStatus: SaveState;
  showFieldLibrary: boolean;
  onToggleFieldLibrary: () => void;
  content?: JSONContent;
  onShare?: () => void;
  onVersionHistory?: () => void;
  onDuplicate?: () => void;
  onSaveAsTemplate?: () => void;
}

export function CanvasToolbar({
  title,
  onTitleChange,
  onTitleBlur,
  onBack,
  saveStatus,
  showFieldLibrary,
  onToggleFieldLibrary,
  content,
  onShare,
  onVersionHistory,
  onDuplicate,
  onSaveAsTemplate,
}: CanvasToolbarProps) {
  const { layout, toggleGrid, toggleSnap, setZoom } = useCanvas();
  const { language } = useSettings();
  const t = getTranslations(language);
  const ct = t.canvas;
  const et = t.editor;

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-700/50 bg-slate-800/95 px-3 backdrop-blur-sm">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        <span>{ct?.documents || 'Documents'}</span>
      </button>

      {/* Add fields button */}
      <button
        onClick={onToggleFieldLibrary}
        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          showFieldLibrary
            ? 'bg-purple-500/20 text-purple-300'
            : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        }`}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{ct?.fields || 'Fields'}</span>
      </button>

      <div className="mx-1 h-4 w-px bg-slate-700" />

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onTitleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        placeholder={ct?.documentTitle || 'Document title'}
        dir="auto"
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-600"
      />

      {/* Save status */}
      <span className="text-[11px] text-slate-500">
        {saveStatus === 'saving' && (ct?.saving || 'Saving...')}
        {saveStatus === 'saved' && (ct?.saved || '✓ Saved')}
        {saveStatus === 'retrying' && (ct?.retrying || 'Retrying...')}
        {saveStatus === 'error' && (ct?.saveError || '⚠ Save error')}
        {saveStatus === 'conflict' && (
          <span className="text-amber-400">{ct?.conflict || '⚠ Conflict'}</span>
        )}
        {saveStatus === 'offline' && (ct?.offline || '☁ Offline — saved locally')}
      </span>

      <div className="mx-1 h-4 w-px bg-slate-700" />

      {/* Export menu */}
      {content && <ExportMenu content={content} title={title} />}

      {/* Share */}
      {onShare && (
        <button
          data-cc-id="editor.toolbar.share"
          onClick={onShare}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          title={et.share}
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Version history */}
      {onVersionHistory && (
        <button
          data-cc-id="editor.toolbar.version-history"
          onClick={onVersionHistory}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          title={et.versionHistory}
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Duplicate */}
      {onDuplicate && (
        <button
          data-cc-id="editor.toolbar.duplicate"
          onClick={onDuplicate}
          className="rounded-md p-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          title={et.duplicate}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Save as template */}
      {onSaveAsTemplate && (
        <button
          data-cc-id="editor.toolbar.save-template"
          onClick={onSaveAsTemplate}
          className="rounded-md p-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          title={et.saveAsTemplate}
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="mx-1 h-4 w-px bg-slate-700" />

      {/* Grid toggle */}
      <button
        onClick={toggleGrid}
        className={`rounded p-1.5 text-xs transition-colors ${
          layout.show_grid
            ? 'bg-purple-500/15 text-purple-400'
            : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
        }`}
        title={ct?.showGrid || 'Show Grid'}
      >
        <Grid3X3 className="h-3.5 w-3.5" />
      </button>

      {/* Snap toggle */}
      <button
        onClick={toggleSnap}
        className={`rounded p-1.5 text-xs transition-colors ${
          layout.snap_to_grid
            ? 'bg-purple-500/15 text-purple-400'
            : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
        }`}
        title={ct?.snapToGrid || 'Snap to Grid'}
      >
        <Magnet className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-700" />

      {/* Zoom controls */}
      <button
        onClick={() => setZoom(layout.zoom - 0.1)}
        className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
        title={ct?.zoom || 'Zoom'}
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[36px] text-center text-[11px] text-slate-500">
        {Math.round(layout.zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(layout.zoom + 0.1)}
        className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
