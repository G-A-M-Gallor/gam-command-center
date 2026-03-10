'use client';

import { useState } from 'react';
import {
  X, Lock, Plus, Trash2, ChevronDown, ChevronRight,
  Hash, Type, Calendar as CalendarIcon, CheckSquare, List,
  Link as LinkIcon, Mail, Phone, Users, Tag, Combine,
  Eye, EyeOff, Palette, GripVertical, Sparkles,
} from 'lucide-react';
import { IconPicker, IconDisplay } from '@/components/ui/IconPicker';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import type {
  GlobalFieldInsert, FieldType, FieldCategory, SubField,
  FieldOption, I18nLabel, VisibilityRule, VisibilityOperator,
  ColorRule, ColorOperator,
} from '@/lib/entities/types';

const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };

const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
  text: Type, number: Hash, select: List, 'multi-select': Tag,
  date: CalendarIcon, person: Users, url: LinkIcon, email: Mail,
  phone: Phone, checkbox: CheckSquare, composite: Combine,
  relation: LinkIcon, formula: Hash,
};

const FIELD_TYPE_LABELS: Record<string, { he: string; en: string }> = {
  text: { he: 'טקסט', en: 'Text' },
  number: { he: 'מספר', en: 'Number' },
  select: { he: 'בחירה', en: 'Select' },
  'multi-select': { he: 'בחירה מרובה', en: 'Multi-Select' },
  date: { he: 'תאריך', en: 'Date' },
  person: { he: 'איש קשר', en: 'Person' },
  url: { he: 'קישור', en: 'URL' },
  email: { he: 'אימייל', en: 'Email' },
  phone: { he: 'טלפון', en: 'Phone' },
  checkbox: { he: 'תיבת סימון', en: 'Checkbox' },
  composite: { he: 'מורכב', en: 'Composite' },
  relation: { he: 'קשר', en: 'Relation' },
  formula: { he: 'נוסחה', en: 'Formula' },
};

const CATEGORIES: FieldCategory[] = ['general', 'contact', 'business', 'project', 'hr', 'finance', 'construction'];
const CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  general: { he: 'כללי', en: 'General' },
  contact: { he: 'איש קשר', en: 'Contact' },
  business: { he: 'עסקי', en: 'Business' },
  project: { he: 'פרויקט', en: 'Project' },
  hr: { he: 'משאבי אנוש', en: 'HR' },
  finance: { he: 'כספים', en: 'Finance' },
  construction: { he: 'בנייה', en: 'Construction' },
};

const VISIBILITY_OPERATORS: { value: VisibilityOperator; he: string; en: string }[] = [
  { value: 'eq', he: 'שווה ל', en: 'Equals' },
  { value: 'neq', he: 'לא שווה ל', en: 'Not equals' },
  { value: 'empty', he: 'ריק', en: 'Is empty' },
  { value: 'not_empty', he: 'לא ריק', en: 'Not empty' },
  { value: 'contains', he: 'מכיל', en: 'Contains' },
  { value: 'gt', he: 'גדול מ', en: 'Greater than' },
  { value: 'lt', he: 'קטן מ', en: 'Less than' },
];

const COLOR_OPERATORS: { value: ColorOperator; he: string; en: string }[] = [
  { value: 'empty', he: 'ריק', en: 'Is empty' },
  { value: 'not_empty', he: 'לא ריק', en: 'Not empty' },
  { value: 'eq', he: 'שווה ל', en: 'Equals' },
  { value: 'neq', he: 'לא שווה ל', en: 'Not equals' },
  { value: 'contains', he: 'מכיל', en: 'Contains' },
  { value: 'length_lt', he: 'אורך קטן מ', en: 'Length less than' },
  { value: 'length_gt', he: 'אורך גדול מ', en: 'Length greater than' },
  { value: 'gt', he: 'גדול מ', en: 'Greater than' },
  { value: 'lt', he: 'קטן מ', en: 'Less than' },
];

const VALIDATION_CONFIG: Record<string, { required?: boolean; minMax?: boolean; pattern?: boolean; unique?: boolean }> = {
  text: { required: true, pattern: true, unique: true },
  email: { required: true, pattern: true, unique: true },
  url: { required: true, pattern: true, unique: true },
  phone: { required: true, pattern: true, unique: true },
  number: { required: true, minMax: true, unique: true },
  date: { required: true },
  select: { required: true },
  'multi-select': { required: true },
  person: { required: true },
  relation: { required: true },
  composite: { required: true },
  formula: {},
  checkbox: {},
};

type Tab = 'general' | 'options' | 'validation' | 'visibility' | 'colors' | 'aliases';

interface Props {
  draft: GlobalFieldInsert;
  editingId: string | null;
  onDraftChange: (draft: GlobalFieldInsert) => void;
  onSave: () => void;
  onClose: () => void;
  allFieldKeys: string[];
}

export function FieldEditorModal({ draft, editingId, onDraftChange, onSave, onClose, allFieldKeys }: Props) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const te = t.entities;
  const isHe = language === 'he';
  const lang = isHe ? 'he' : 'en';

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [newAlias, setNewAlias] = useState('');

  const setDraft = (fn: (d: GlobalFieldInsert) => GlobalFieldInsert) => {
    onDraftChange(fn(draft));
  };

  const valConfig = VALIDATION_CONFIG[draft.field_type] ?? {};
  const hasOptions = draft.field_type === 'select' || draft.field_type === 'multi-select';
  const hasValidation = Object.values(valConfig).some(Boolean);
  const TypeIcon = FIELD_TYPE_ICONS[draft.field_type] ?? Type;

  const tabs: { key: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { key: 'general', label: isHe ? 'כללי' : 'General', icon: Type, show: true },
    { key: 'options', label: isHe ? 'אפשרויות' : 'Options', icon: List, show: hasOptions || draft.is_composite },
    { key: 'validation', label: isHe ? 'ולידציה' : 'Validation', icon: CheckSquare, show: hasValidation },
    { key: 'visibility', label: isHe ? 'חוקי הצגה' : 'Visibility', icon: Eye, show: true },
    { key: 'colors', label: isHe ? 'חוקי צבע' : 'Colors', icon: Palette, show: true },
    { key: 'aliases', label: isHe ? 'כינויים' : 'Aliases', icon: LinkIcon, show: !!editingId },
  ];

  const visibleTabs = tabs.filter(t => t.show);

  const canSave = editingId
    ? !!(draft.meta_key?.trim())
    : !!((draft.label?.en?.trim()) || (draft.label?.he?.trim()));

  // Field ref options for visibility rules
  const fieldRefOptions = allFieldKeys
    .filter(k => k !== draft.meta_key)
    .map(k => ({ value: k, label: k }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]"
        dir={isHe ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <TypeIcon size={20} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-100">
              {editingId ? (te.editField) : (te.newField)}
            </h2>
            {editingId && (
              <code className="text-[10px] text-slate-500">{draft.meta_key}</code>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] px-6 overflow-x-auto">
          {visibleTabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <TabIcon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── General Tab ────────────────────────── */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Icon + Label row */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">{isHe ? 'אייקון' : 'Icon'}</label>
                  <IconPicker
                    value={draft.icon ?? undefined}
                    onChange={icon => setDraft(d => ({ ...d, icon }))}
                    size={36}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400">{te.labelHe}</label>
                      <input
                        type="text"
                        value={draft.label?.he ?? ''}
                        onChange={e => setDraft(d => ({ ...d, label: { ...d.label, he: e.target.value } }))}
                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                        dir="rtl"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400">{te.labelEn}</label>
                      <input
                        type="text"
                        value={draft.label?.en ?? ''}
                        onChange={e => setDraft(d => ({ ...d, label: { ...d.label, en: e.target.value } }))}
                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.descriptionHe}</label>
                  <input
                    type="text"
                    value={draft.description?.he ?? ''}
                    onChange={e => setDraft(d => ({ ...d, description: { ...d.description, he: e.target.value } }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.descriptionEn}</label>
                  <input
                    type="text"
                    value={draft.description?.en ?? ''}
                    onChange={e => setDraft(d => ({ ...d, description: { ...d.description, en: e.target.value } }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.fieldType}</label>
                  <CustomSelect
                    value={draft.field_type}
                    options={Object.keys(FIELD_TYPE_LABELS).map(ft => ({ value: ft, label: FIELD_TYPE_LABELS[ft]?.[lang] ?? ft }))}
                    onChange={v => {
                      const ft = v as FieldType;
                      setDraft(d => ({ ...d, field_type: ft, is_composite: ft === 'composite' }));
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.category}</label>
                  <CustomSelect
                    value={draft.category}
                    options={CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c]?.[lang] ?? c }))}
                    onChange={v => setDraft(d => ({ ...d, category: v as FieldCategory }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Read-Only toggle */}
              <label className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors">
                <input
                  type="checkbox"
                  checked={draft.read_only ?? false}
                  onChange={e => setDraft(d => ({ ...d, read_only: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                />
                <div>
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <Lock size={13} />
                    {isHe ? 'שדה לקריאה בלבד' : 'Read-only field'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isHe ? 'לא ניתן לעריכה, מתעדכן אוטומטית בכל המערכת' : 'Not editable, updated system-wide automatically'}
                  </p>
                </div>
              </label>

              {/* meta_key (locked) */}
              {editingId && (
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.metaKey}</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <Lock size={12} className="text-slate-500 shrink-0" />
                    <code className="text-sm text-slate-300">{draft.meta_key}</code>
                  </div>
                </div>
              )}

              {/* Default Value */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400">{te.defaultValue}</label>
                  {draft.default_value != null && (
                    <button onClick={() => setDraft(d => ({ ...d, default_value: null }))} className="text-[10px] text-slate-500 hover:text-red-400">
                      <X size={10} className="inline" /> {te.noDefault}
                    </button>
                  )}
                </div>
                {draft.field_type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer mt-1">
                    <input type="checkbox" checked={draft.default_value === true}
                      onChange={e => setDraft(d => ({ ...d, default_value: e.target.checked }))}
                      className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30" />
                    {te.defaultValue}
                  </label>
                ) : draft.field_type === 'select' ? (
                  <CustomSelect value={String(draft.default_value ?? '')}
                    options={[{ value: '', label: te.noDefault }, ...draft.options.map(o => ({ value: o.value, label: o.label[lang] || o.value }))]}
                    onChange={v => setDraft(d => ({ ...d, default_value: v || null }))} className="mt-1" />
                ) : (
                  <input type={draft.field_type === 'number' ? 'number' : draft.field_type === 'date' ? 'date' : 'text'}
                    value={draft.default_value != null ? String(draft.default_value) : ''}
                    onChange={e => setDraft(d => ({ ...d, default_value: draft.field_type === 'number' ? (e.target.value ? Number(e.target.value) : null) : (e.target.value || null) }))}
                    placeholder={te.noDefault}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                )}
              </div>
            </div>
          )}

          {/* ── Options Tab ────────────────────────── */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              {/* Select/Multi-Select options */}
              {hasOptions && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">{te.options}</label>
                    <button onClick={() => setDraft(d => ({ ...d, options: [...d.options, { value: '', label: { ...EMPTY_LABEL }, color: '#94a3b8' }] }))}
                      className="text-xs text-purple-400 hover:text-purple-300">+ {te.addOption}</button>
                  </div>
                  <div className="space-y-2">
                    {draft.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                        <input type="color" value={opt.color ?? '#94a3b8'}
                          onChange={e => setDraft(d => ({ ...d, options: d.options.map((o, j) => j === i ? { ...o, color: e.target.value } : o) }))}
                          className="h-7 w-7 rounded border-0 bg-transparent cursor-pointer shrink-0" />
                        <input type="text" value={opt.value} placeholder="value" dir="ltr"
                          onChange={e => setDraft(d => ({ ...d, options: d.options.map((o, j) => j === i ? { ...o, value: e.target.value } : o) }))}
                          className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                        <input type="text" value={opt.label[lang] ?? ''} placeholder={te.label}
                          onChange={e => setDraft(d => ({ ...d, options: d.options.map((o, j) => j === i ? { ...o, label: { ...o.label, [lang]: e.target.value } } : o) }))}
                          className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                        <button onClick={() => setDraft(d => ({ ...d, options: d.options.filter((_, j) => j !== i) }))}
                          className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Composite sub-fields */}
              {draft.is_composite && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">{te.subFields}</label>
                    <button onClick={() => setDraft(d => ({ ...d, sub_fields: [...d.sub_fields, { meta_key: '', label: { ...EMPTY_LABEL }, field_type: 'text' as FieldType }] }))}
                      className="text-xs text-purple-400 hover:text-purple-300">+ {te.addSubField}</button>
                  </div>
                  <div className="space-y-2">
                    {draft.sub_fields.map((sf, i) => (
                      <div key={i} className="flex gap-2 items-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                        <input type="text" value={sf.meta_key} placeholder="meta_key" dir="ltr"
                          onChange={e => setDraft(d => ({ ...d, sub_fields: d.sub_fields.map((s, j) => j === i ? { ...s, meta_key: e.target.value.replace(/[^a-z0-9_]/g, '') } : s) }))}
                          className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200" />
                        <input type="text" value={sf.label[lang] ?? ''} placeholder={te.label}
                          onChange={e => setDraft(d => ({ ...d, sub_fields: d.sub_fields.map((s, j) => j === i ? { ...s, label: { ...s.label, [lang]: e.target.value } } : s) }))}
                          className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200" />
                        <CustomSelect value={sf.field_type}
                          options={['text', 'number', 'date', 'email', 'phone'].map(ft => ({ value: ft, label: ft }))}
                          onChange={v => setDraft(d => ({ ...d, sub_fields: d.sub_fields.map((s, j) => j === i ? { ...s, field_type: v as FieldType } : s) }))}
                          className="min-w-[100px]" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">{te.displayTemplate}</label>
                    <input type="text" value={draft.display_template ?? ''} placeholder="{first_name} {last_name}" dir="ltr"
                      onChange={e => setDraft(d => ({ ...d, display_template: e.target.value || null }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Validation Tab ─────────────────────── */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {valConfig.required && (
                  <label className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300 cursor-pointer hover:bg-white/[0.04]">
                    <input type="checkbox" checked={draft.validation.required ?? false}
                      onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, required: e.target.checked || undefined } }))}
                      className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30" />
                    {te.required}
                  </label>
                )}
                {valConfig.unique && (
                  <label className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300 cursor-pointer hover:bg-white/[0.04]">
                    <input type="checkbox" checked={draft.validation.unique ?? false}
                      onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, unique: e.target.checked || undefined } }))}
                      className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30" />
                    {te.uniqueValue}
                  </label>
                )}
              </div>
              {valConfig.minMax && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400">Min</label>
                    <input type="number" value={draft.validation.min ?? ''}
                      onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, min: e.target.value ? Number(e.target.value) : undefined } }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">Max</label>
                    <input type="number" value={draft.validation.max ?? ''}
                      onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, max: e.target.value ? Number(e.target.value) : undefined } }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                  </div>
                </div>
              )}
              {valConfig.pattern && (
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.patternRegex}</label>
                  <input type="text" value={draft.validation.pattern ?? ''} placeholder="^[A-Z].*" dir="ltr"
                    onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, pattern: e.target.value || undefined } }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                </div>
              )}
            </div>
          )}

          {/* ── Visibility Rules Tab ───────────────── */}
          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <Eye size={14} />
                    {isHe ? 'חוקי הצגה' : 'Visibility Rules'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isHe ? 'השדה יוצג רק אם כל התנאים מתקיימים. שדה חובה מוסתר — לא נאכף.' : 'Field shown only when all conditions are met. Hidden required fields are not enforced.'}
                  </p>
                </div>
                <button
                  onClick={() => setDraft(d => ({ ...d, visibility_rules: [...(d.visibility_rules ?? []), { field_ref: '', operator: 'not_empty' }] }))}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Plus size={12} /> {isHe ? 'הוסף תנאי' : 'Add rule'}
                </button>
              </div>

              {(draft.visibility_rules ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
                  <EyeOff size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">{isHe ? 'השדה מוצג תמיד (ללא תנאים)' : 'Field always visible (no conditions)'}</p>
                </div>
              )}

              {(draft.visibility_rules ?? []).map((rule, i) => (
                <div key={i} className="flex gap-2 items-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <CustomSelect
                    value={rule.field_ref}
                    options={fieldRefOptions}
                    onChange={v => setDraft(d => ({ ...d, visibility_rules: (d.visibility_rules ?? []).map((r, j) => j === i ? { ...r, field_ref: v } : r) }))}
                    className="flex-1 min-w-[120px]"
                  />
                  <CustomSelect
                    value={rule.operator}
                    options={VISIBILITY_OPERATORS.map(o => ({ value: o.value, label: o[lang] }))}
                    onChange={v => setDraft(d => ({ ...d, visibility_rules: (d.visibility_rules ?? []).map((r, j) => j === i ? { ...r, operator: v as VisibilityOperator } : r) }))}
                    className="min-w-[120px]"
                  />
                  {!['empty', 'not_empty'].includes(rule.operator) && (
                    <input type="text" value={rule.value ?? ''} placeholder={isHe ? 'ערך' : 'Value'}
                      onChange={e => setDraft(d => ({ ...d, visibility_rules: (d.visibility_rules ?? []).map((r, j) => j === i ? { ...r, value: e.target.value } : r) }))}
                      className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                  )}
                  <button onClick={() => setDraft(d => ({ ...d, visibility_rules: (d.visibility_rules ?? []).filter((_, j) => j !== i) }))}
                    className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {/* ── Color Rules Tab ────────────────────── */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <Palette size={14} />
                    {isHe ? 'חוקי צבע' : 'Color Rules'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isHe ? 'צבע השדה ישתנה בהתאם לתנאים. הכלל הראשון שמתקיים קובע.' : 'Field color changes based on conditions. First matching rule wins.'}
                  </p>
                </div>
                <button
                  onClick={() => setDraft(d => ({ ...d, color_rules: [...(d.color_rules ?? []), { operator: 'empty', color: '#ef4444' }] }))}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Plus size={12} /> {isHe ? 'הוסף חוק' : 'Add rule'}
                </button>
              </div>

              {(draft.color_rules ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
                  <Palette size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">{isHe ? 'ללא חוקי צבע (צבע ברירת מחדל)' : 'No color rules (default styling)'}</p>
                </div>
              )}

              {(draft.color_rules ?? []).map((rule, i) => (
                <div key={i} className="flex gap-2 items-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <input type="color" value={rule.color}
                    onChange={e => setDraft(d => ({ ...d, color_rules: (d.color_rules ?? []).map((r, j) => j === i ? { ...r, color: e.target.value } : r) }))}
                    className="h-8 w-8 rounded border-0 bg-transparent cursor-pointer shrink-0" />
                  <CustomSelect
                    value={rule.operator}
                    options={COLOR_OPERATORS.map(o => ({ value: o.value, label: o[lang] }))}
                    onChange={v => setDraft(d => ({ ...d, color_rules: (d.color_rules ?? []).map((r, j) => j === i ? { ...r, operator: v as ColorOperator } : r) }))}
                    className="min-w-[140px]"
                  />
                  {!['empty', 'not_empty'].includes(rule.operator) && (
                    <input type="text" value={rule.value ?? ''} placeholder={isHe ? 'ערך' : 'Value'}
                      onChange={e => setDraft(d => ({ ...d, color_rules: (d.color_rules ?? []).map((r, j) => j === i ? { ...r, value: e.target.value } : r) }))}
                      className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                  )}
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: rule.color }} />
                  <button onClick={() => setDraft(d => ({ ...d, color_rules: (d.color_rules ?? []).filter((_, j) => j !== i) }))}
                    className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {/* ── Aliases Tab ────────────────────────── */}
          {activeTab === 'aliases' && editingId && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-400">{te.aliases}</label>
              {(draft.aliases ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(draft.aliases ?? []).map(alias => (
                    <span key={alias} className="inline-flex items-center gap-1 rounded-lg bg-blue-500/15 px-2.5 py-1 text-xs text-blue-300">
                      <LinkIcon size={10} />
                      <code>{alias}</code>
                      <button onClick={() => setDraft(d => ({ ...d, aliases: (d.aliases ?? []).filter(a => a !== alias) }))}
                        className="text-blue-400 hover:text-red-400 ms-0.5"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600">{te.noAliases}</p>
              )}
              <div className="flex gap-2">
                <input type="text" value={newAlias} dir="ltr" placeholder="alias_key"
                  onChange={e => setNewAlias(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const alias = newAlias.trim(); if (alias && !(draft.aliases ?? []).includes(alias)) { setDraft(d => ({ ...d, aliases: [...(d.aliases ?? []), alias] })); setNewAlias(''); } } }}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none" />
                <button onClick={() => { const alias = newAlias.trim(); if (alias && !(draft.aliases ?? []).includes(alias)) { setDraft(d => ({ ...d, aliases: [...(d.aliases ?? []), alias] })); setNewAlias(''); } }}
                  className="text-xs text-purple-400 hover:text-purple-300 px-3">+ {te.addAlias}</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-sm text-slate-400 hover:bg-white/[0.04] transition-colors">
            {te.cancel}
          </button>
          <button onClick={onSave} disabled={!canSave}
            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editingId ? te.save : te.create}
          </button>
        </div>
      </div>
    </div>
  );
}
