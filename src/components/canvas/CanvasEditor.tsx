'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { JSONContent } from '@tiptap/react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import { useAutoSave } from '@/lib/editor/useAutoSave';
import { CanvasProvider, useCanvas } from '@/contexts/CanvasContext';
import { useCanvasGrid } from '@/lib/canvas/useCanvasGrid';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasGrid } from './CanvasGrid';
import { CanvasFieldItem } from './CanvasFieldItem';
import { EditorZone } from './EditorZone';
import { FieldConfigModal } from '@/components/command-center/fields/FieldConfigModal';
import { FieldLibrary } from '@/components/command-center/fields/FieldLibrary';
import { ShareDialog } from '@/components/editor/ShareDialog';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { SourceBanner } from '@/components/editor/SourceBanner';
import { EditorBreadcrumb } from '@/components/editor/EditorBreadcrumb';
import { duplicateDocument, saveVersion, createTemplate } from '@/lib/supabase/editorQueries';
import { NoteMeta } from '@/components/entities/NoteMeta';
import type { FieldTypeId, FieldConfig } from '@/components/command-center/fields/fieldTypes';

interface CanvasEditorProps {
  recordId: string;
}

// ─── Inner Component (uses _context) ──────────────────
function CanvasEditorInner({ recordId }: CanvasEditorProps) {
  const _router = useRouter();
  const { sidebarPosition, language } = useSettings();
  const _t = getTranslations(language);
  const {
    layout,
    placements,
    dragOverCell,
    setIsDragging,
    setDragOverCell,
    movePlacement,
    addPlacement,
    selectPlacement,
  } = useCanvas();

  const [title, setTitle] = useState('');
  const savedTitleRef = useRef('');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFieldLibrary, setShowFieldLibrary] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [fieldModal, setFieldModal] = useState<{
    fieldType: FieldTypeId;
    fieldId?: string;
    config?: FieldConfig;
  } | null>(null);
  const [storyNoteMeta, setStoryNoteMeta] = useState<{
    cardText: string;
    epicText?: string;
  } | null>(null);
  const [bookmarkNoteMeta, setBookmarkNoteMeta] = useState<{
    bookmarkUrl: string;
    bookmarkId: string;
  } | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [noteMeta, setNoteMeta] = useState<Record<string, unknown>>({});

  // ── Auto-save with retry + offline fallback ─────
  const { saveState, lastSavedAt, saveNow, queueSave } = useAutoSave({ recordId });

  // Version auto-save refs
  const lastVersionSaveRef = useRef<number>(Date.now());
  const versionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Grid helpers
  const {
    containerRef,
    visibleColumns,
    visibleRows,
    isOverlapping,
    findNextAvailableCell,
    cellFromPixel,
    isInBounds,
  } = useCanvasGrid({
    cellSize: layout.cell_size,
    columns: layout.grid_columns,
    zoom: layout.zoom,
    placements,
    editorZone: layout.editor_zone,
  });

  // Track drag validity
  const [isDragValid, setIsDragValid] = useState(true);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Load document ─────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('vb_records')
        .select('id, title, content, record_type, source, entity_type, meta')
        .eq('id', recordId)
        .single();

      if (err || !data) {
        setError(`שגיאה בטעינה: ${err?.message || 'רשומה לא נמצאה'}`);
        setLoading(false);
        return;
      }

      const loadedTitle = data.title || 'ללא כותרת';
      setTitle(loadedTitle);
      savedTitleRef.current = loadedTitle;
      setContent(data.content || { type: 'doc', content: [{ type: 'paragraph' }] });
      setEntityType(data.entity_type ?? null);
      setNoteMeta((data.meta as Record<string, unknown>) ?? {});

      // Load story note metadata if this is a story-note
      if (data.record_type === 'story-note') {
        // Extract card text from content metadata
        const firstNode = (data.content as { content?: { attrs?: Record<string, string> }[] })?.content?.[0];
        const cardText = firstNode?.attrs?.['data-story-card-text'] || loadedTitle;
        const cardCol = firstNode?.attrs?.['data-story-card-col'];

        // Try to find the epic for this column
        let epicText: string | undefined;
        if (cardCol !== undefined) {
          const { data: epic } = await supabase
            .from('story_cards')
            .select('text')
            .eq('type', 'epic')
            .eq('col', Number(cardCol))
            .limit(1)
            .maybeSingle();
          if (epic) epicText = epic.text;
        }

        setStoryNoteMeta({ cardText, epicText });
      }

      // Load bookmark note metadata if this is a bookmark-note
      if (data.record_type === 'bookmark-note') {
        const firstNode = (data.content as { content?: { attrs?: Record<string, string> }[] })?.content?.[0];
        const bookmarkUrl = firstNode?.attrs?.['data-bookmark-url'] || '';
        const bookmarkId = firstNode?.attrs?.['data-bookmark-id'] || '';
        setBookmarkNoteMeta({ bookmarkUrl, bookmarkId });
      }

      setLoading(false);
    }
    load();
  }, [recordId]);

  // ── Field events ──────────────────────────────────
  useEffect(() => {
    const handleInsertField = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.fieldType) {
        setFieldModal({ fieldType: detail.fieldType as FieldTypeId });
      }
    };
    const handleEditField = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.fieldType) {
        setFieldModal({
          fieldType: detail.fieldType as FieldTypeId,
          fieldId: detail.fieldId,
          config: detail.config,
        });
      }
    };
    const handleInsertExisting = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.fieldId && detail?.fieldType) {
        // Place on canvas
        const pos = findNextAvailableCell(1, 1);
        addPlacement({
          document_id: recordId,
          field_definition_id: detail.fieldId,
          grid_col: pos.col,
          grid_row: pos.row,
          col_span: 2,
          row_span: 1,
          zone: 'canvas',
          placed_by: null,
          placed_at: new Date().toISOString(),
          last_moved_at: null,
          last_moved_by: null,
          sort_order: 0,
          display_config: {},
        });
      }
    };

    window.addEventListener('cc-insert-field', handleInsertField);
    window.addEventListener('cc-edit-field', handleEditField);
    window.addEventListener('cc-insert-existing-field', handleInsertExisting);
    return () => {
      window.removeEventListener('cc-insert-field', handleInsertField);
      window.removeEventListener('cc-edit-field', handleEditField);
      window.removeEventListener('cc-insert-existing-field', handleInsertExisting);
    };
  }, [findNextAvailableCell, addPlacement, recordId]);

  // ── Save handler (uses useAutoSave) ──────────────
  const handleSave = useCallback(
    (json: JSONContent) => { queueSave(json); },
    [queueSave]
  );

  const handleFieldSave = useCallback(
    (fieldId: string, fieldType: FieldTypeId, config: FieldConfig) => {
      // Also place on canvas
      const pos = findNextAvailableCell(2, 1);
      addPlacement({
        document_id: recordId,
        field_definition_id: fieldId,
        grid_col: pos.col,
        grid_row: pos.row,
        col_span: 2,
        row_span: 1,
        zone: 'canvas',
        placed_by: null,
        placed_at: new Date().toISOString(),
        last_moved_at: null,
        last_moved_by: null,
        sort_order: 0,
        display_config: {},
      });

      // Also dispatch for Tiptap if needed
      window.dispatchEvent(
        new CustomEvent('cc-field-saved', {
          detail: { fieldId, fieldType, config, label: (config as unknown as Record<string, unknown>).label || fieldType },
        })
      );
    },
    [findNextAvailableCell, addPlacement, recordId]
  );

  const handleTitleBlur = useCallback(async () => {
    if (!recordId) return;
    const newTitle = title.trim();
    if (newTitle === savedTitleRef.current) return;
    savedTitleRef.current = newTitle;
    await supabase
      .from('vb_records')
      .update({ title: newTitle })
      .eq('id', recordId);
  }, [recordId, title]);

  // ── Version auto-save (every 5 min) ────────────────
  useEffect(() => {
    versionIntervalRef.current = setInterval(() => {
      if (content && title) {
        saveVersion(recordId, title, content);
        lastVersionSaveRef.current = Date.now();
      }
    }, 5 * 60 * 1000);
    return () => {
      if (versionIntervalRef.current) clearInterval(versionIntervalRef.current);
    };
  }, [recordId, content, title]);

  // Ctrl+S / ⌘S → immediate save + version snapshot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        // Immediate content save
        if (content) saveNow(content);
        // Version snapshot (throttled to 1 per minute)
        if (content && title && Date.now() - lastVersionSaveRef.current > 60_000) {
          saveVersion(recordId, title, content);
          lastVersionSaveRef.current = Date.now();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, recordId, title, saveNow]);

  // ── Warn before leaving with unsaved changes ────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === 'saving' || saveState === 'retrying') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // ── New toolbar handlers ────────────────────────────
  const handleDuplicate = useCallback(async () => {
    const dup = await duplicateDocument(recordId);
    if (dup) {
      router.push(`/dashboard/editor?id=${dup.id}`);
    }
  }, [recordId, router]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!content) return;
    await createTemplate({
      name: title || 'Untitled Template',
      name_he: title || 'תבנית ללא שם',
      content,
    });
  }, [content, title]);

  const handleVersionRestore = useCallback(() => {
    // Reload document after version restore
    window.location.reload();
  }, []);

  // ── Drag handlers ─────────────────────────────────
  const handleDragStart = useCallback(
    () => {
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { activatorEvent, delta } = event;
      if (!activatorEvent || !('clientX' in activatorEvent)) return;

      const me = activatorEvent as MouseEvent;
      const cell = cellFromPixel(me.clientX + delta.x, me.clientY + delta.y);
      setDragOverCell(cell);

      const placement = placements.find((p) => p.id === event.active.id);
      if (placement) {
        const valid =
          isInBounds(cell.col, cell.row, placement.col_span, placement.row_span) &&
          !isOverlapping(cell.col, cell.row, placement.col_span, placement.row_span, placement.id);
        setIsDragValid(valid);
      }
    },
    [cellFromPixel, placements, isInBounds, isOverlapping, setDragOverCell]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      setDragOverCell(null);

      const placement = placements.find((p) => p.id === event.active.id);
      if (!placement || !dragOverCell) return;

      const valid =
        isInBounds(dragOverCell.col, dragOverCell.row, placement.col_span, placement.row_span) &&
        !isOverlapping(dragOverCell.col, dragOverCell.row, placement.col_span, placement.row_span, placement.id);

      if (valid) {
        movePlacement(placement.id, dragOverCell.col, dragOverCell.row);
      }
    },
    [placements, dragOverCell, isInBounds, isOverlapping, movePlacement, setIsDragging, setDragOverCell]
  );

  // ── Render ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-_t-purple-400" />
          <span className="text-sm">טוען...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="p-8">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Story note banner + breadcrumb */}
      {storyNoteMeta && (
        <div className="space-y-2 px-4 pt-3 pb-1">
          <EditorBreadcrumb
            storyMapLabel={t.editor.breadcrumbStoryMap}
            epicText={storyNoteMeta.epicText}
            cardText={storyNoteMeta.cardText}
          />
          <SourceBanner
            cardText={storyNoteMeta.cardText}
            t={{
              storyMap: t.editor.sourceBannerStoryMap,
              backToStoryMap: _t.editor.sourceBannerBack,
            }}
          />
        </div>
      )}

      {/* Bookmark note banner */}
      {bookmarkNoteMeta && (
        <div className="space-y-2 px-4 pt-3 pb-1">
          <SourceBanner
            cardText={bookmarkNoteMeta.bookmarkUrl}
            t={{
              storyMap: t.editor.sourceBannerBookmark || 'Bookmark',
              backToStoryMap: _t.editor.sourceBannerOpenUrl || 'Open URL',
            }}
            linkHref={bookmarkNoteMeta.bookmarkUrl}
          />
        </div>
      )}

      {/* Entity meta fields panel */}
      {entityType && (
        <div className="px-4 pt-2">
          <NoteMeta
            noteId={recordId}
            entityType={entityType}
            meta={noteMeta}
            onMetaChange={setNoteMeta}
          />
        </div>
      )}

      <CanvasToolbar
        title={title}
        onTitleChange={setTitle}
        onTitleBlur={handleTitleBlur}
        onBack={() => router.push('/dashboard/editor')}
        saveStatus={saveState}
        showFieldLibrary={showFieldLibrary}
        onToggleFieldLibrary={() => setShowFieldLibrary((v) => !v)}
        content={content ?? undefined}
        visibleColumns={visibleColumns}
        onShare={() => setShowShare(true)}
        onVersionHistory={() => setShowVersionHistory((v) => !v)}
        onDuplicate={handleDuplicate}
        onSaveAsTemplate={handleSaveAsTemplate}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <CanvasGrid
          ref={containerRef}
          columns={visibleColumns}
          rows={visibleRows}
          cellSize={layout.cell_size}
          showGrid={layout.show_grid}
          zoom={layout.zoom}
          dragOverCell={dragOverCell}
          isDragValid={isDragValid}
          onClick={() => selectPlacement(null)}
        >
          {/* Editor zone */}
          {content && (
            <EditorZone
              editorZone={layout.editor_zone}
              cellSize={layout.cell_size}
              content={content}
              onChange={setContent}
              onSave={handleSave}
              recordId={recordId}
              saveStatus={saveState}
              lastSavedAt={lastSavedAt}
              visibleColumns={visibleColumns}
              direction={layout.direction}
            />
          )}

          {/* Field placements */}
          {placements.map((p) => (
            <CanvasFieldItem
              key={p.id}
              placement={p}
              cellSize={layout.cell_size}
            />
          ))}
        </CanvasGrid>
      </DndContext>

      {/* Field Library — anchorTop = TopBar(48) + content padding(~16) + CanvasToolbar(40) + gap(4) */}
      {showFieldLibrary && (
        <FieldLibrary
          onClose={() => setShowFieldLibrary(false)}
          sidebarPosition={sidebarPosition}
          anchorTop={108}
        />
      )}

      {/* Field Config Modal */}
      {fieldModal && (
        <FieldConfigModal
          fieldType={fieldModal.fieldType}
          fieldId={fieldModal.fieldId}
          initialConfig={fieldModal.config}
          onClose={() => setFieldModal(null)}
          onSave={handleFieldSave}
          onDefinitionCreated={(def) => {
            window.dispatchEvent(
              new CustomEvent('cc-definition-created', { detail: def })
            );
          }}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        documentId={recordId}
        open={showShare}
        onClose={() => setShowShare(false)}
      />

      {/* Version History Panel */}
      <VersionHistory
        documentId={recordId}
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={handleVersionRestore}
      />
    </div>
  );
}

// ─── Wrapper with Provider ───────────────────────────
export function CanvasEditor({ recordId }: CanvasEditorProps) {
  return (
    <CanvasProvider documentId={recordId}>
      <CanvasEditorInner recordId={recordId} />
    </CanvasProvider>
  );
}
