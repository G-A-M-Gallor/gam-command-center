'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/contexts/SettingsContext';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import {
  getFieldType,
  defaultConfigs,
  type FieldTypeId,
  type FieldConfig,
  type ShortTextConfig,
  type CheckboxConfig,
  type DropdownConfig,
  type MultiSelectConfig,
  type DateConfig,
  type DateTimeConfig,
  type TimeConfig,
  type TagsConfig,
} from './fieldTypes';
import { supabase } from '@/lib/supabaseClient';

// ─── Props ───────────────────────────────────────────
interface FieldConfigModalProps {
  fieldType: FieldTypeId;
  onClose: () => void;
  onSave: (fieldId: string, fieldType: FieldTypeId, config: FieldConfig) => void;
  initialConfig?: FieldConfig;
  fieldId?: string;
  onDefinitionCreated?: (def: {
    id: string;
    field_type: FieldTypeId;
    label: string;
    config: Record<string, unknown>;
    category: string;
  }) => void;
}

// ─── Component ───────────────────────────────────────
export function FieldConfigModal({
  fieldType,
  onClose,
  onSave,
  initialConfig,
  fieldId,
  onDefinitionCreated,
}: FieldConfigModalProps) {
  const { language } = useSettings();
  const typeDef = getFieldType(fieldType);
  const [config, setConfig] = useState<FieldConfig>(
    initialConfig || { ...defaultConfigs[fieldType] }
  );
  const [saving, setSaving] = useState(false);

  const trapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose, enabled: !!typeDef });

  const update = useCallback((key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value } as FieldConfig));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const typedConfig = config as unknown as Record<string, unknown>;
    const label = (typedConfig.label as string) || typeDef?.label[language] || fieldType;

    try {
      // Get workspace_id from existing record
      const { data: existing } = await supabase
        .from('vb_records')
        .select('workspace_id')
        .limit(1)
        .single();

      if (fieldId) {
        // Update existing
        await supabase
          .from('field_definitions')
          .update({ label, config: typedConfig })
          .eq('id', fieldId);
        onSave(fieldId, fieldType, config);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('field_definitions')
          .insert({
            field_type: fieldType,
            label,
            config: typedConfig,
            category: typeDef?.category || 'text',
            workspace_id: existing?.workspace_id || null,
          })
          .select('id')
          .single();

        if (error || !data) {
          // Fallback: generate local ID if table doesn't exist yet
          const localId = crypto.randomUUID();
          onDefinitionCreated?.({
            id: localId,
            field_type: fieldType,
            label,
            config: typedConfig,
            category: typeDef?.category || 'text',
          });
          onSave(localId, fieldType, config);
        } else {
          onDefinitionCreated?.({
            id: data.id,
            field_type: fieldType,
            label,
            config: typedConfig,
            category: typeDef?.category || 'text',
          });
          onSave(data.id, fieldType, config);
        }
      }
    } catch {
      // Fallback: still let the field be inserted with a local ID
      const localId = fieldId || crypto.randomUUID();
      onSave(localId, fieldType, config);
    }

    setSaving(false);
    onClose();
  };

  if (!typeDef) return null;
  const Icon = typeDef.icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20" role="dialog" aria-modal="true" aria-label={typeDef.label[language]}>
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label="close"
      />

      {/* Modal */}
      <div
        ref={trapRef}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
        dir="auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">
                {typeDef.label[language]}
              </div>
              <div className="text-[11px] text-slate-500">
                {typeDef.description[language]}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — field-specific config */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <FieldConfigForm
            fieldType={fieldType}
            config={config}
            update={update}
            language={language}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-700/50 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {language === 'he' ? 'ביטול' : language === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            {language === 'he' ? 'שמור' : language === 'ru' ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Field Config Form (renders per field type) ──────
function FieldConfigForm({
  fieldType,
  config,
  update,
  language,
}: {
  fieldType: FieldTypeId;
  config: FieldConfig;
  update: (key: string, value: unknown) => void;
  language: 'he' | 'en' | 'ru';
}) {
  const l = (he: string, en: string, ru?: string) => (language === 'he' ? he : language === 'ru' ? (ru || en) : en);

  switch (fieldType) {
    case 'short-text': {
      const c = config as ShortTextConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Field label={l('טקסט ברירת מחדל', 'Placeholder')}>
            <TextInput value={c.placeholder} onChange={(v) => update('placeholder', v)} placeholder={l('טקסט לדוגמה...', 'Example text...')} />
          </Field>
          <Field label={l('ערך ברירת מחדל', 'Default value')}>
            <TextInput value={c.defaultValue} onChange={(v) => update('defaultValue', v)} />
          </Field>
          <div className="flex items-center gap-4">
            <Toggle label={l('חובה', 'Required')} checked={c.required} onChange={(v) => update('required', v)} />
          </div>
          <Field label={l('אורך מקסימלי', 'Max length')}>
            <NumberInput value={c.maxLength} onChange={(v) => update('maxLength', v)} min={1} max={10000} />
          </Field>
        </div>
      );
    }

    case 'checkbox': {
      const c = config as CheckboxConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Toggle label={l('מסומן כברירת מחדל', 'Default checked')} checked={c.defaultChecked} onChange={(v) => update('defaultChecked', v)} />
        </div>
      );
    }

    case 'dropdown': {
      const c = config as DropdownConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Toggle label={l('חובה', 'Required')} checked={c.required} onChange={(v) => update('required', v)} />
          <Field label={l('ערך ברירת מחדל', 'Default value')}>
            <TextInput value={c.defaultValue} onChange={(v) => update('defaultValue', v)} />
          </Field>
          <OptionsList
            options={c.options}
            onChange={(v) => update('options', v)}
            language={language}
          />
        </div>
      );
    }

    case 'multi-select': {
      const c = config as MultiSelectConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Toggle label={l('חובה', 'Required')} checked={c.required} onChange={(v) => update('required', v)} />
          <Field label={l('מקסימום בחירות', 'Max selections')}>
            <NumberInput value={c.maxSelections} onChange={(v) => update('maxSelections', v)} min={0} max={100} />
            <span className="text-[10px] text-slate-500">{l('0 = ללא הגבלה', '0 = unlimited')}</span>
          </Field>
          <OptionsList
            options={c.options}
            onChange={(v) => update('options', v)}
            language={language}
          />
        </div>
      );
    }

    case 'date': {
      const c = config as DateConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Field label={l('פורמט', 'Format')}>
            <select
              value={c.format}
              onChange={(e) => update('format', e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </Field>
        </div>
      );
    }

    case 'datetime': {
      const c = config as DateTimeConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Field label={l('פורמט', 'Format')}>
            <select
              value={c.format}
              onChange={(e) => update('format', e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm</option>
              <option value="MM/DD/YYYY hh:mm A">MM/DD/YYYY hh:mm A</option>
              <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm</option>
            </select>
          </Field>
        </div>
      );
    }

    case 'time': {
      const c = config as TimeConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Field label={l('פורמט', 'Format')}>
            <div className="flex gap-2">
              <button
                onClick={() => update('format', '24h')}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs ${c.format === '24h' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40' : 'bg-slate-900 text-slate-400'}`}
              >
                24h
              </button>
              <button
                onClick={() => update('format', '12h')}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs ${c.format === '12h' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40' : 'bg-slate-900 text-slate-400'}`}
              >
                12h (AM/PM)
              </button>
            </div>
          </Field>
          <Field label={l('ערך ברירת מחדל', 'Default value')}>
            <TextInput value={c.defaultValue} onChange={(v) => update('defaultValue', v)} placeholder="HH:mm" />
          </Field>
        </div>
      );
    }

    case 'tags': {
      const c = config as TagsConfig;
      return (
        <div className="flex flex-col gap-3">
          <Field label={l('תווית', 'Label')}>
            <TextInput value={c.label} onChange={(v) => update('label', v)} placeholder={l('שם השדה', 'Field name')} />
          </Field>
          <Toggle label={l('אפשר תגיות חופשיות', 'Allow custom tags')} checked={c.allowCustom} onChange={(v) => update('allowCustom', v)} />
          <Field label={l('מקסימום תגיות', 'Max tags')}>
            <NumberInput value={c.maxTags} onChange={(v) => update('maxTags', v)} min={1} max={100} />
          </Field>
          <OptionsList
            options={c.predefinedTags}
            onChange={(v) => update('predefinedTags', v)}
            language={language}
            addLabel={l('הוסף תגית', 'Add tag')}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Shared form primitives ──────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir="auto"
      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500/50"
    />
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-32 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500/50"
    />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-purple-500' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-xs text-slate-300">{label}</span>
    </label>
  );
}

function OptionsList({
  options,
  onChange,
  language,
  addLabel,
}: {
  options: string[];
  onChange: (v: string[]) => void;
  language: 'he' | 'en' | 'ru';
  addLabel?: string;
}) {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
      setNewOption('');
    }
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-slate-400">
        {language === 'he' ? 'אפשרויות' : language === 'ru' ? 'Варианты' : 'Options'}
      </label>
      <div className="flex flex-col gap-1 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <GripVertical className="h-3 w-3 shrink-0 text-slate-600" />
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const updated = [...options];
                updated[i] = e.target.value;
                onChange(updated);
              }}
              dir="auto"
              className="flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-300 outline-none focus:border-slate-700 focus:bg-slate-800"
            />
            <button
              onClick={() => removeOption(i)}
              className="rounded p-0.5 text-slate-600 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
            placeholder={addLabel || (language === 'he' ? 'הוסף אפשרות' : language === 'ru' ? 'Добавить вариант' : 'Add option')}
            dir="auto"
            className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 placeholder-slate-600 outline-none"
          />
          <button
            onClick={addOption}
            className="rounded bg-purple-600/20 p-1 text-purple-400 hover:bg-purple-600/30"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
