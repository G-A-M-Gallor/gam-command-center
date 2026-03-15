'use client';

import { ChevronRight } from 'lucide-react';
import { IconDisplay } from '@/components/ui/IconPicker';
import type { NoteRecord, GlobalField, I18nLabel } from '@/lib/entities/types';

interface Props {
  notes: NoteRecord[];
  fields: GlobalField[];
  onUpdate: () => void;
  language: string;
  entityType?: string;
}

export function ListView({ notes, fields, language, entityType }: Props) {
  const lang = language === 'he' ? 'he' : 'en';

  // Pick key fields to show as badges
  const badgeFields = fields.filter(f => f.field_type === 'select' || f.field_type === 'multi-select').slice(0, 3);
  const textFields = fields.filter(f => !['select', 'multi-select', 'checkbox'].includes(f.field_type)).slice(0, 2);

  if (notes.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        {lang === 'he' ? 'אין רשומות' : 'No records'}
      </div>
    );
  }

  return (
    <div className="space-y-1" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {notes.map(note => (
        <a
          key={note.id}
          href={entityType ? `/dashboard/entities/${entityType}/${note.id}` : `/dashboard/editor/${note.id}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {typeof note.meta.__icon === 'string' && <IconDisplay value={note.meta.__icon} size={14} className="shrink-0 text-slate-400" />}
              <span className="text-sm font-medium text-slate-200 group-hover:text-purple-300 transition-colors truncate">
                {note.title}
              </span>
              {/* Badges */}
              {badgeFields.map(f => {
                const val = note.meta[f.meta_key];
                if (!val) return null;
                const opt = f.options.find(o => o.value === val);
                return (
                  <span
                    key={f.meta_key}
                    className="inline-block shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                    style={{ backgroundColor: `${opt?.color ?? '#94a3b8'}20`, color: opt?.color ?? '#94a3b8' }}
                  >
                    {opt?.label[lang as keyof I18nLabel] || String(val)}
                  </span>
                );
              })}
            </div>
            {/* Text meta */}
            {textFields.length > 0 && (
              <div className="flex items-center gap-3 mt-0.5">
                {textFields.map(f => {
                  const val = note.meta[f.meta_key];
                  if (!val) return null;
                  return (
                    <span key={f.meta_key} className="text-[10px] text-slate-500">
                      {f.label[lang as keyof I18nLabel] || f.meta_key}: {String(val)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0" />
        </a>
      ))}
    </div>
  );
}
