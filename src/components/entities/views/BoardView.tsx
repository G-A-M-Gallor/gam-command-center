'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { updateNoteMeta } from '@/lib/supabase/entityQueries';
import { IconDisplay } from '@/components/ui/IconPicker';
import type { NoteRecord, GlobalField, I18nLabel } from '@/lib/entities/types';

interface Props {
  notes: NoteRecord[];
  fields: GlobalField[];
  onUpdate: () => void;
  language: string;
  entityType?: string;
}

// ─── Draggable Card ──────────────────────────────────
function DraggableCard({ note, fields, lang, entityType }: { note: NoteRecord; fields: GlobalField[]; lang: string; entityType?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: { note },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  // Show 2-3 key fields on card
  const displayFields = fields.filter(f => !['select', 'multi-select'].includes(f.field_type)).slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-white/[0.06] bg-slate-800/80 p-3 cursor-grab active:cursor-grabbing hover:border-white/[0.12] transition-colors"
    >
      <a href={entityType ? `/dashboard/entities/${entityType}/${note.id}` : `/dashboard/editor/${note.id}`} className="flex items-center gap-1.5 text-sm font-medium text-slate-200 hover:text-purple-300 mb-1">
        {typeof note.meta.__icon === 'string' && <IconDisplay value={note.meta.__icon} size={14} className="shrink-0" />}
        <span className="truncate">{note.title}</span>
      </a>
      {displayFields.map(f => {
        const val = note.meta[f.meta_key];
        if (!val) return null;
        return (
          <div key={f.meta_key} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span>{f.label[lang as keyof I18nLabel] || f.meta_key}:</span>
            <span className="text-slate-400">{String(val)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Droppable Column ────────────────────────────────
function DroppableColumn({
  columnValue, label, color, notes, fields, lang, entityType,
}: {
  columnValue: string; label: string; color: string;
  notes: NoteRecord[]; fields: GlobalField[]; lang: string; entityType?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnValue });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[220px] rounded-xl border p-3 transition-colors ${
        isOver ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="text-[10px] text-slate-500 ms-auto">{notes.length}</span>
      </div>
      <div className="space-y-2">
        {notes.map(note => (
          <DraggableCard key={note.id} note={note} fields={fields} lang={lang} entityType={entityType} />
        ))}
      </div>
    </div>
  );
}

export function BoardView({ notes, fields, onUpdate, language, entityType }: Props) {
  const lang = language === 'he' ? 'he' : 'en';

  // Find the first select field to use as board columns
  const groupField = useMemo(
    () => fields.find(f => f.field_type === 'select'),
    [fields],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() => {
    if (!groupField) return [{ value: '_all', label: lang === 'he' ? 'הכל' : 'All', color: '#94a3b8' }];
    return [
      ...groupField.options.map(o => ({
        value: o.value,
        label: o.label[lang as keyof I18nLabel] || o.value,
        color: o.color ?? '#94a3b8',
      })),
      { value: '_none', label: lang === 'he' ? 'ללא' : 'None', color: '#475569' },
    ];
  }, [groupField, lang]);

  const notesByColumn = useMemo(() => {
    const map: Record<string, NoteRecord[]> = {};
    for (const col of columns) map[col.value] = [];

    if (!groupField) {
      map['_all'] = notes;
      return map;
    }

    for (const note of notes) {
      const val = String(note.meta[groupField.meta_key] ?? '');
      const colKey = columns.find(c => c.value === val) ? val : '_none';
      map[colKey]?.push(note);
    }
    return map;
  }, [notes, columns, groupField]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !groupField) return;

    const noteId = active.id as string;
    const newValue = over.id === '_none' ? '' : String(over.id);

    await updateNoteMeta(noteId, { [groupField.meta_key]: newValue });
    onUpdate();
  }, [groupField, onUpdate]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {columns.map(col => (
          <DroppableColumn
            key={col.value}
            columnValue={col.value}
            label={col.label}
            color={col.color}
            notes={notesByColumn[col.value] ?? []}
            fields={fields}
            lang={lang}
            entityType={entityType}
          />
        ))}
      </div>
    </DndContext>
  );
}
