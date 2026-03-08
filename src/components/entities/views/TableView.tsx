'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { updateNoteMeta } from '@/lib/supabase/entityQueries';
import type { NoteRecord, GlobalField, FieldGroup, ViewSort, I18nLabel } from '@/lib/entities/types';

interface Props {
  notes: NoteRecord[];
  fields: GlobalField[];
  groups: FieldGroup[];
  sort?: ViewSort;
  onSort: (sort: ViewSort) => void;
  onUpdate: () => void;
  language: string;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

function renderCompositeValue(field: GlobalField, meta: Record<string, unknown>): string {
  if (!field.display_template) {
    return field.sub_fields.map(sf => String(meta[sf.meta_key] ?? '')).filter(Boolean).join(' ');
  }
  let result = field.display_template;
  for (const sf of field.sub_fields) {
    result = result.replace(`{${sf.meta_key}}`, String(meta[sf.meta_key] ?? ''));
  }
  return result.trim();
}

function renderFieldValue(field: GlobalField, meta: Record<string, unknown>, lang: string): React.ReactNode {
  const value = meta[field.meta_key];

  if (field.is_composite) {
    return <span className="text-slate-300">{renderCompositeValue(field, meta) || '—'}</span>;
  }

  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-600">—</span>;
  }

  switch (field.field_type) {
    case 'select': {
      const opt = field.options.find(o => o.value === value);
      if (opt) {
        return (
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${opt.color}20`, color: opt.color ?? '#94a3b8' }}
          >
            {opt.label[lang as keyof I18nLabel] || opt.value}
          </span>
        );
      }
      return <span className="text-slate-300">{String(value)}</span>;
    }
    case 'multi-select': {
      const vals = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {vals.map((v, i) => {
            const opt = field.options.find(o => o.value === v);
            return (
              <span
                key={i}
                className="inline-block rounded-full px-1.5 py-0.5 text-[9px]"
                style={{ backgroundColor: `${opt?.color ?? '#94a3b8'}20`, color: opt?.color ?? '#94a3b8' }}
              >
                {opt?.label[lang as keyof I18nLabel] || v}
              </span>
            );
          })}
        </div>
      );
    }
    case 'checkbox':
      return value ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-slate-600" />;
    case 'date':
      return <span className="text-slate-300 text-xs">{String(value)}</span>;
    case 'url':
      return (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-xs truncate max-w-[150px] block">
          {String(value)}
        </a>
      );
    case 'email':
      return <a href={`mailto:${value}`} className="text-purple-400 hover:underline text-xs">{String(value)}</a>;
    default:
      return <span className="text-slate-300 text-xs">{String(value)}</span>;
  }
}

// ─── Inline Edit Cell ────────────────────────────────
function EditableCell({
  noteId, field, value, lang, onSave,
}: {
  noteId: string; field: GlobalField; value: unknown; lang: string;
  onSave: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const startEdit = () => {
    if (field.is_composite || field.field_type === 'relation') return; // complex fields not inline-editable
    setEditValue(String(value ?? ''));
    setEditing(true);
  };

  const save = async () => {
    setEditing(false);
    let parsedValue: unknown = editValue;
    if (field.field_type === 'number') parsedValue = Number(editValue) || 0;
    if (field.field_type === 'checkbox') parsedValue = editValue === 'true';

    await updateNoteMeta(noteId, { [field.meta_key]: parsedValue });
    onSave();
  };

  const cancel = () => setEditing(false);

  if (editing) {
    if (field.field_type === 'select') {
      return (
        <select
          value={String(editValue)}
          onChange={async e => {
            await updateNoteMeta(noteId, { [field.meta_key]: e.target.value });
            setEditing(false);
            onSave();
          }}
          onBlur={cancel}
          autoFocus
          className="w-full rounded border border-purple-500/50 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200"
        >
          <option value="">—</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label[lang as keyof I18nLabel] || o.value}</option>
          ))}
        </select>
      );
    }

    if (field.field_type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={editValue === 'true'}
          onChange={async e => {
            await updateNoteMeta(noteId, { [field.meta_key]: e.target.checked });
            setEditing(false);
            onSave();
          }}
          className="rounded"
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        onBlur={save}
        className="w-full rounded border border-purple-500/50 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none"
      />
    );
  }

  return (
    <div
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-white/[0.04] min-h-[22px]"
      onDoubleClick={startEdit}
    >
      {renderFieldValue(field, { [field.meta_key]: value } as Record<string, unknown>, lang)}
    </div>
  );
}

export function TableView({ notes, fields, groups, sort, onSort, onUpdate, language, selectedIds: controlledIds, onSelectionChange }: Props) {
  const lang = language === 'he' ? 'he' : 'en';
  const [internalIds, setInternalIds] = useState<Set<string>>(new Set());

  // Use controlled mode if props provided, otherwise internal state
  const selectedIds = controlledIds ?? internalIds;
  const setSelectedIds = onSelectionChange ?? setInternalIds;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === notes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notes.map(n => n.id)));
    }
  };

  const handleSort = (fieldKey: string) => {
    if (sort?.field === fieldKey) {
      onSort({ field: fieldKey, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ field: fieldKey, direction: 'asc' });
    }
  };

  if (notes.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        {lang === 'he' ? 'אין רשומות' : 'No records'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <th className="w-8 px-2 py-2">
              <input
                type="checkbox"
                checked={selectedIds.size === notes.length && notes.length > 0}
                onChange={toggleAll}
                className="rounded border-white/20"
              />
            </th>
            <th
              className="px-3 py-2 text-start text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-1">
                {lang === 'he' ? 'כותרת' : 'Title'}
                {sort?.field === 'title' && (sort.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
              </div>
            </th>
            {fields.map(f => (
              <th
                key={f.meta_key}
                className="px-3 py-2 text-start text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 whitespace-nowrap"
                onClick={() => handleSort(f.meta_key)}
              >
                <div className="flex items-center gap-1">
                  {f.label[lang] || f.meta_key}
                  {sort?.field === f.meta_key && (sort.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {notes.map(note => (
            <tr
              key={note.id}
              className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                selectedIds.has(note.id) ? 'bg-purple-500/5' : ''
              }`}
            >
              <td className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(note.id)}
                  onChange={() => toggleSelect(note.id)}
                  className="rounded border-white/20"
                />
              </td>
              <td className="px-3 py-2">
                <a
                  href={`/dashboard/editor/${note.id}`}
                  className="text-sm font-medium text-slate-200 hover:text-purple-300 transition-colors"
                >
                  {note.title}
                </a>
              </td>
              {fields.map(f => (
                <td key={f.meta_key} className="px-3 py-1.5">
                  <EditableCell
                    noteId={note.id}
                    field={f}
                    value={note.meta[f.meta_key]}
                    lang={lang}
                    onSave={onUpdate}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
