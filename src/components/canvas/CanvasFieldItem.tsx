'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { getFieldType } from '@/components/command-center/fields/fieldTypes';
import { useCanvas } from '@/contexts/CanvasContext';
import type { FieldPlacement } from '@/lib/canvas/types';

const FIELD_ICONS: Record<string, string> = {
  'short-text': '📝',
  checkbox: '☑️',
  dropdown: '📋',
  'multi-select': '☰',
  date: '📅',
  datetime: '📅',
  time: '🕐',
  tags: '🏷️',
};

interface CanvasFieldItemProps {
  placement: FieldPlacement;
  cellSize: number;
}

export function CanvasFieldItem({ placement, cellSize }: CanvasFieldItemProps) {
  const { selectedPlacementId, selectPlacement, removePlacement } = useCanvas();
  const isSelected = selectedPlacementId === placement.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: placement.id });

  const typeDef = placement.field_type ? getFieldType(placement.field_type) : undefined;
  const icon = placement.field_type ? FIELD_ICONS[placement.field_type] || '📝' : '📝';

  const style = {
    position: 'absolute' as const,
    left: placement.grid_col * cellSize,
    top: placement.grid_row * cellSize,
    width: placement.col_span * cellSize - 4,
    height: placement.row_span * cellSize - 4,
    margin: 2,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 50 : isSelected ? 10 : 1,
    transition: isDragging ? undefined : 'left 200ms ease, top 200ms ease',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        selectPlacement(isSelected ? null : placement.id);
      }}
      onDoubleClick={() => {
        // Open edit modal
        if (placement.field_type) {
          window.dispatchEvent(
            new CustomEvent('cc-edit-field', {
              detail: {
                fieldType: placement.field_type,
                fieldId: placement.field_definition_id,
                config: placement.config,
              },
            })
          );
        }
      }}
      className={`flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 transition-colors active:cursor-grabbing ${
        isSelected
          ? 'border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/10'
          : 'border-indigo-500/30 bg-indigo-500/8 hover:border-indigo-500/50 hover:bg-indigo-500/12'
      }`}
      dir="auto"
    >
      <span className="text-base">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-slate-200">
          {placement.label || placement.field_type || 'Field'}
        </div>
        {typeDef?.label && (
          <div className="truncate text-[10px] text-slate-500">
            {typeDef.label.he}
          </div>
        )}
      </div>

      {/* Delete button (visible when selected) */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removePlacement(placement.id);
          }}
          className="rounded p-0.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
