'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { getTranslations } from '@/lib/i18n';
import type { NoteRecord, GlobalField, I18nLabel, TemplateConfig } from '@/lib/entities/types';

interface Props {
  notes: NoteRecord[];
  fields: GlobalField[];
  language: string;
  timelineConfig?: TemplateConfig['timeline_config'];
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function getStatusColor(meta: Record<string, unknown>): string {
  const s = String(meta.status ?? meta.pipeline_stage ?? '');
  const colors: Record<string, string> = {
    'todo': '#60a5fa', 'in-progress': '#f472b6', 'done': '#34d399',
    'cancelled': '#ef4444', 'lead': '#94a3b8', 'qualified': '#60a5fa',
    'proposal': '#a78bfa', 'negotiation': '#fbbf24', 'closed_won': '#34d399',
    'closed_lost': '#ef4444',
  };
  return colors[s] ?? '#a78bfa';
}

interface TimelineItem {
  note: NoteRecord;
  date: Date;
  isMilestone: boolean;
}

interface TimelineGroup {
  label: string;
  items: TimelineItem[];
}

export function TimelineView({ notes, fields, language, timelineConfig }: Props) {
  const t = getTranslations(language as 'he' | 'en' | 'ru');
  const te = t.entities;
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
  const isRtl = language === 'he';
  const LOCALE_MAP: Record<string, string> = { he: 'he-IL', en: 'en-US', ru: 'ru-RU' };
  const locale = LOCALE_MAP[lang] ?? 'en-US';

  const dateField = timelineConfig?.date_field ?? 'due_date';
  const milestoneStatuses = useMemo(() => timelineConfig?.milestone_statuses ?? [], [timelineConfig?.milestone_statuses]);

  // Build sorted timeline items grouped by month
  const groups = useMemo(() => {
    const items: TimelineItem[] = [];
    for (const note of notes) {
      const date = parseDate(note.meta[dateField]);
      if (!date) continue;
      const status = String(note.meta.status ?? note.meta.pipeline_stage ?? '');
      const isMilestone = milestoneStatuses.includes(status);
      items.push({ note, date, isMilestone });
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    const grouped: TimelineGroup[] = [];
    let currentLabel = '';

    for (const item of items) {
      const label = item.date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      if (label !== currentLabel) {
        grouped.push({ label, items: [] });
        currentLabel = label;
      }
      grouped[grouped.length - 1].items.push(item);
    }

    return grouped;
  }, [notes, dateField, milestoneStatuses, locale]);

  // Get display value for a field
  const getDisplayValue = (note: NoteRecord, fieldKey: string): string => {
    const val = note.meta[fieldKey];
    if (val == null) return '';
    const field = fields.find(f => f.meta_key === fieldKey);
    if (field?.field_type === 'select' && field.options.length > 0) {
      const opt = field.options.find(o => o.value === String(val));
      return opt?.label[lang as keyof I18nLabel] ?? String(val);
    }
    if (field?.field_type === 'number') {
      return Number(val).toLocaleString(locale);
    }
    return String(val);
  };

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        {te.noTimelineDataDisplay}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {groups.map(group => (
        <div key={group.label}>
          {/* Month header */}
          <h3 className="text-xs font-semibold text-slate-400 mb-3 sticky top-0 bg-slate-900/80 backdrop-blur-sm py-1 z-10">
            {group.label}
          </h3>

          <div className="relative ms-3">
            {/* Vertical line */}
            <div className="absolute start-0 top-0 bottom-0 w-px bg-white/[0.06]" />

            <div className="space-y-3">
              {group.items.map(item => {
                const color = getStatusColor(item.note.meta);
                return (
                  <div key={item.note.id} className="relative ps-6">
                    {/* Dot */}
                    <div
                      className="absolute start-0 top-2 -translate-x-1/2 flex items-center justify-center"
                      style={{ left: 0 }}
                    >
                      {item.isMilestone ? (
                        <Star size={14} fill={color} stroke={color} />
                      ) : (
                        <div
                          className="w-2.5 h-2.5 rounded-full border-2 border-slate-800"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </div>

                    {/* Card */}
                    <div className={`rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors ${item.isMilestone ? 'border-l-2' : ''}`}
                      style={item.isMilestone ? { borderInlineStartColor: color } : undefined}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {item.note.title}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {item.date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {/* Meta badges */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {fields.slice(0, 4).map(f => {
                          const val = getDisplayValue(item.note, f.meta_key);
                          if (!val) return null;
                          return (
                            <span
                              key={f.meta_key}
                              className="text-[10px] rounded px-1.5 py-0.5 bg-white/[0.04] text-slate-400"
                            >
                              {f.label[lang as keyof I18nLabel] ?? f.meta_key}: {val}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
