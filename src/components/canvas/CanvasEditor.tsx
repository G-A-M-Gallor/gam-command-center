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
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/contexts/SettingsContext';
import { CanvasProvider, useCanvas } from '@/contexts/CanvasContext';
import { useCanvasGrid } from '@/lib/canvas/useCanvasGrid';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasGrid } from './CanvasGrid';
import { CanvasFieldItem } from './CanvasFieldItem';
import { EditorZone } from './EditorZone';
import { FieldConfigModal } from '@/components/command-center/fields/FieldConfigModal';
import { FieldLibrary } from '@/components/command-center/fields/FieldLibrary';
import type { FieldTypeId, FieldConfig } from '@/components/command-center/fields/fieldTypes';

// ─── Types ───────────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CanvasEditorProps {
  recordId: string;
}

// ─── Inner Component (uses context) ──────────────────
function CanvasEditorInner({ recordId }: CanvasEditorProps) {
  const router = useRouter();
  const { sidebarPosition } = useSettings();
  const {
    layout,
    placements,
    isDragging,
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const [showFieldLibrary, setShowFieldLibrary] = useState(false);
  const [fieldModal, setFieldModal] = useState<{
    fieldType: FieldTypeId;
    fieldId?: string;
    config?: FieldConfig;
  } | null>(null);

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
        .select('id, title, content')
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

  // ── Save handlers ─────────────────────────────────
  const handleSave = useCallback(
    async (json: JSONContent) => {
      if (!recordId) return;
      setSaveStatus('saving');
      const { error: err } = await supabase
        .from('vb_records')
        .update({ content: json, last_edited_at: new Date().toISOString() })
        .eq('id', recordId);

      if (err) {
        setSaveStatus('error');
        return;
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    [recordId]
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
      .update({ title: newTitle, last_edited_at: new Date().toISOString() })
      .eq('id', recordId);
  }, [recordId, title]);

  // ── Drag handlers ─────────────────────────────────
  const handleDragStart = useCallback(
    (_event: DragStartEvent) => {
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
      <div className="flex h-full items-center justify-center text-slate-500">
        {/* Loading */}
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
      <CanvasToolbar
        title={title}
        onTitleChange={setTitle}
        onTitleBlur={handleTitleBlur}
        onBack={() => router.push('/dashboard/editor')}
        saveStatus={saveStatus}
        showFieldLibrary={showFieldLibrary}
        onToggleFieldLibrary={() => setShowFieldLibrary((v) => !v)}
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
              onChange={() => {}}
              onSave={handleSave}
              recordId={recordId}
              saveStatus={saveStatus}
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
