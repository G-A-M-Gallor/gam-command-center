'use client';

import { useState, useMemo } from 'react';
import { _X, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { _getTranslations } from '@/lib/i18n';
import { bulkUpdateMeta } from '@/lib/supabase/entityQueries';
import type { _Language } from '@/contexts/SettingsContext';
import type { GlobalField, NoteRecord } from '@/lib/entities/types';

type Step = 'field' | 'value' | 'preview';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  notes: NoteRecord[];
  fields: GlobalField[];
  language: string;
  actorId?: string | null;
  onComplete: () => void;
}

export function BulkFieldUpdateModal({
  open, onClose, selectedIds, notes, fields, language, actorId, onComplete,
}: Props) {
  const _t = getTranslations(language as _Language);
  const tb = t.entities.bulk;
  const isRtl = language === 'he';

  const [step, setStep] = useState<Step>('field');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<unknown>('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const selectedNotes = useMemo(
    () => notes.filter(n => selectedIds.has(n.id)),
    [notes, selectedIds],
  );

  const field = useMemo(
    () => fields.find(f => f.meta_key === selectedField),
    [fields, selectedField],
  );

  const filteredFields = useMemo(() => {
    if (!search) return fields;
    const q = search.toLowerCase();
    return fields.filter(f =>
      f.label.he.includes(q) || f.label.en.toLowerCase().includes(q) ||
      f.meta_key.toLowerCase().includes(q)
    );
  }, [fields, search]);

  const handleApply = async () => {
    if (!selectedField) return;
    setLoading(true);
    const ids = [...selectedIds];
    await bulkUpdateMeta(ids, { [selectedField]: newValue }, {
      trackActivity: true,
      actorId: actorId ?? null,
    });
    setLoading(false);
    onComplete();
    handleClose();
  };

  const handleClose = () => {
    setStep('field');
    setSelectedField(null);
    setNewValue('');
    setSearch('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-slate-900 shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-100">
            {tb.title}
          </h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300">
            <_X size={16} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-2.5">
          {(['field', 'value', 'preview'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
              <span className={`text-xs font-medium ${step === s ? 'text-purple-400' : s === 'field' && step !== 'field' ? 'text-slate-400' : 'text-slate-600'}`}>
                {s === 'field' ? tb.stepField : s === 'value' ? tb.stepValue : tb.stepPreview}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[280px] p-5">
          {/* Step 1: Pick field */}
          {step === 'field' && (
            <div className="space-y-3">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.common.search}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500/40"
              />
              <div className="max-h-[220px] overflow-y-auto space-y-1">
                {filteredFields.map(f => (
                  <button
                    key={f.meta_key}
                    onClick={() => { setSelectedField(f.meta_key); setStep('value'); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-white/[0.04] ${selectedField === f.meta_key ? 'bg-purple-500/10 text-purple-300' : 'text-slate-300'}`}
                  >
                    <span className="flex-1">{f.label[language as 'he' | 'en' | 'ru'] || f.label.en}</span>
                    <span className="text-[10px] text-slate-500">{f.field_type}</span>
                  </button>
                ))}
                {filteredFields.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-500">{_t.common.noResults}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Set value */}
          {step === 'value' && field && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                {tb.settingValueFor}{' '}
                <span className="font-medium text-slate-200">{field.label[language as 'he' | 'en' | 'ru'] || field.label.en}</span>
              </div>
              <FieldValueInput field={field} value={newValue} onChange={setNewValue} language={language} />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('field')}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.04]"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
                >
                  {tb.next}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && field && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300">
                  {selectedNotes.length} {tb.recordsAffected}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                <span className="font-medium text-slate-200">{field.label[language as 'he' | 'en' | 'ru'] || field.label.en}</span>
                {' → '}
                <span className="font-medium text-purple-300">{formatValue(newValue)}</span>
              </div>

              {/* Preview table */}
              <div className="max-h-[180px] overflow-y-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-3 py-1.5 text-start font-medium text-slate-400">{tb.record}</th>
                      <th className="px-3 py-1.5 text-start font-medium text-slate-400">{tb.currentValue}</th>
                      <th className="px-3 py-1.5 text-start font-medium text-purple-400">{tb.newValueLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotes.slice(0, 20).map(note => (
                      <tr key={note.id} className="border-b border-white/[0.04]">
                        <td className="px-3 py-1.5 text-slate-300 truncate max-w-[150px]">{note.title}</td>
                        <td className="px-3 py-1.5 text-slate-500">{formatValue(note.meta[field.meta_key])}</td>
                        <td className="px-3 py-1.5 text-purple-300">{formatValue(newValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedNotes.length > 20 && (
                  <div className="px-3 py-1.5 text-[10px] text-slate-500 text-center">
                    +{selectedNotes.length - 20} {tb.more}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="flex items-center justify-end gap-2 border-_t border-white/[0.06] px-5 py-3">
            <button
              onClick={() => setStep('value')}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.04]"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              <Check size={13} />
              {loading ? t.common.loading : tb.apply}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Field Value Input ─────────────────────────────

function FieldValueInput({
  field, value, onChange, language,
}: {
  field: GlobalField;
  value: unknown;
  onChange: (v: unknown) => void;
  language: string;
}) {
  const inputClass = 'w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-purple-500/40';

  switch (field.field_type) {
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return (
        <input
          type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            className="rounded border-white/20 bg-white/[0.03] text-purple-500"
          />
          <span className="text-sm text-slate-300">{value ? 'Yes' : 'No'}</span>
        </label>
      );

    case 'select':
      return (
        <div className="space-y-1">
          {field.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors ${value === opt.value ? 'bg-purple-500/15 text-purple-300' : 'text-slate-300 hover:bg-white/[0.04]'}`}
            >
              {opt.color && (
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
              )}
              {opt.label[language as 'he' | 'en' | 'ru'] || opt.label.en}
              {value === opt.value && <Check size={13} className="ms-auto text-purple-400" />}
            </button>
          ))}
        </div>
      );

    case 'multi-select': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-1">
          {field.options.map(opt => {
            const isChecked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(isChecked
                    ? selected.filter(v => v !== opt.value)
                    : [...selected, opt.value]);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors ${isChecked ? 'bg-purple-500/15 text-purple-300' : 'text-slate-300 hover:bg-white/[0.04]'}`}
              >
                {opt.color && (
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                )}
                {opt.label[language as 'he' | 'en' | 'ru'] || opt.label.en}
                {isChecked && <Check size={13} className="ms-auto text-purple-400" />}
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}
