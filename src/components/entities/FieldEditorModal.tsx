'use client';

import { useState } from 'react';
import {
  _X, Lock, _Plus, Trash2, Hash, Type, Calendar as CalendarIcon, CheckSquare, List,
  Link as LinkIcon, Mail, Phone, Users, Tag, Combine,
  Eye, EyeOff, Palette, Paperclip, FileText, CalendarClock, DollarSign, _Star,
} from 'lucide-react';
import { IconPicker } from '@/components/ui/IconPicker';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import type {
  GlobalFieldInsert, FieldType, FieldCategory, I18nLabel, VisibilityOperator,
  ColorOperator,
} from '@/lib/entities/types';

const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };

const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
  text: Type, number: Hash, select: List, 'multi-select': Tag,
  date: CalendarIcon, person: Users, url: LinkIcon, email: Mail,
  phone: Phone, checkbox: CheckSquare, composite: Combine,
  relation: LinkIcon, formula: Hash,
  file: Paperclip, rich_text: FileText, datetime: CalendarClock,
  currency: DollarSign, rating: _Star,
};

const FIELD_TYPE_LABELS: Record<string, { he: string; en: string; ru: string }> = {
  text: { he: 'טקסט', en: 'Text', ru: 'Текст' },
  number: { he: 'מספר', en: 'Number', ru: 'Число' },
  select: { he: 'בחירה', en: 'Select', ru: 'Выбор' },
  'multi-select': { he: 'בחירה מרובה', en: 'Multi-Select', ru: 'Мультивыбор' },
  date: { he: 'תאריך', en: 'Date', ru: 'Дата' },
  person: { he: 'איש קשר', en: 'Person', ru: 'Контакт' },
  url: { he: 'קישור', en: 'URL', ru: 'Ссылка' },
  email: { he: 'אימייל', en: 'Email', ru: 'Email' },
  phone: { he: 'טלפון', en: 'Phone', ru: 'Телефон' },
  checkbox: { he: 'תיבת סימון', en: 'Checkbox', ru: 'Чекбокс' },
  composite: { he: 'מורכב', en: 'Composite', ru: 'Составной' },
  relation: { he: 'קשר', en: 'Relation', ru: 'Связь' },
  formula: { he: 'נוסחה', en: 'Formula', ru: 'Формула' },
  file: { he: 'קובץ', en: 'File', ru: 'Файл' },
  rich_text: { he: 'טקסט עשיר', en: 'Rich Text', ru: 'Форматированный текст' },
  datetime: { he: 'תאריך ושעה', en: 'Date & Time', ru: 'Дата и время' },
  currency: { he: 'מטבע', en: 'Currency', ru: 'Валюта' },
  rating: { he: 'דירוג', en: 'Rating', ru: 'Рейтинг' },
};

const CATEGORIES: FieldCategory[] = ['general', 'contact', 'business', 'project', 'hr', 'finance', 'construction'];
const CATEGORY_LABELS: Record<string, { he: string; en: string; ru: string }> = {
  general: { he: 'כללי', en: 'General', ru: 'Общее' },
  contact: { he: 'איש קשר', en: 'Contact', ru: 'Контакт' },
  business: { he: 'עסקי', en: 'Business', ru: 'Бизнес' },
  project: { he: 'פרויקט', en: 'Project', ru: 'Проект' },
  hr: { he: 'משאבי אנוש', en: 'HR', ru: 'Кадры' },
  finance: { he: 'כספים', en: 'Finance', ru: 'Финансы' },
  construction: { he: 'בנייה', en: 'Construction', ru: 'Строительство' },
};

const VISIBILITY_OPERATORS: { value: VisibilityOperator; he: string; en: string; ru: string }[] = [
  { value: 'eq', he: 'שווה ל', en: 'Equals', ru: 'Равно' },
  { value: 'neq', he: 'לא שווה ל', en: 'Not equals', ru: 'Не равно' },
  { value: 'empty', he: 'ריק', en: 'Is empty', ru: 'Пусто' },
  { value: 'not_empty', he: 'לא ריק', en: 'Not empty', ru: 'Не пусто' },
  { value: 'contains', he: 'מכיל', en: 'Contains', ru: 'Содержит' },
  { value: 'gt', he: 'גדול מ', en: 'Greater than', ru: 'Больше чем' },
  { value: 'lt', he: 'קטן מ', en: 'Less than', ru: 'Меньше чем' },
];

const COLOR_OPERATORS: { value: ColorOperator; he: string; en: string; ru: string }[] = [
  { value: 'empty', he: 'ריק', en: 'Is empty', ru: 'Пусто' },
  { value: 'not_empty', he: 'לא ריק', en: 'Not empty', ru: 'Не пусто' },
  { value: 'eq', he: 'שווה ל', en: 'Equals', ru: 'Равно' },
  { value: 'neq', he: 'לא שווה ל', en: 'Not equals', ru: 'Не равно' },
  { value: 'contains', he: 'מכיל', en: 'Contains', ru: 'Содержит' },
  { value: 'length_lt', he: 'אורך קטן מ', en: 'Length less than', ru: 'Длина меньше' },
  { value: 'length_gt', he: 'אורך גדול מ', en: 'Length greater than', ru: 'Длина больше' },
  { value: 'gt', he: 'גדול מ', en: 'Greater than', ru: 'Больше чем' },
  { value: 'lt', he: 'קטן מ', en: 'Less than', ru: 'Меньше чем' },
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
  file: { required: true },
  rich_text: { required: true },
  datetime: { required: true },
  currency: { required: true, minMax: true },
  rating: {},
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
  const _t = getTranslations(language);
  const te = t.entities;
  const isRtl = language === 'he';
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [newAlias, setNewAlias] = useState('');
  const tips = (te as unknown as { tips: Record<string, string> }).tips ?? {};

  const setDraft = (fn: (d: GlobalFieldInsert) => GlobalFieldInsert) => {
    onDraftChange(fn(draft));
  };

  const valConfig = VALIDATION_CONFIG[draft.field_type] ?? {};
  const hasOptions = draft.field_type === 'select' || draft.field_type === 'multi-select';
  const hasValidation = Object.values(valConfig).some(Boolean);
  const TypeIcon = FIELD_TYPE_ICONS[draft.field_type] ?? Type;

  const tabs: { key: Tab; label: string; icon: React.ElementType; show: boolean; tip?: string }[] = [
    { key: 'general', label: te.tabGeneral, icon: Type, show: true },
    { key: 'options', label: te.tabOptions, icon: List, show: hasOptions || draft.is_composite, tip: tips.options },
    { key: 'validation', label: te.tabValidation, icon: CheckSquare, show: hasValidation, tip: tips.validation },
    { key: 'visibility', label: te.tabVisibility, icon: Eye, show: true, tip: tips.visibilityRules },
    { key: 'colors', label: te.tabColors, icon: Palette, show: true, tip: tips.colorRules },
    { key: 'aliases', label: te.tabAliases, icon: LinkIcon, show: !!editingId, tip: tips.aliases },
  ];

  const visibleTabs = tabs.filter(t => _t.show);

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
        dir={isRtl ? 'rtl' : 'ltr'}
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
              <div key={tab.key} className="flex items-center">
                <button
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
                {tab.tip && isActive && <InfoTooltip text={tab.tip} size={11} side="bottom" />}
              </div>
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
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">{te.icon}</label>
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
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.descriptionHe} <InfoTooltip text={tips.description ?? ''} size={11} /></label>
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

              {/* Client Display Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.clientDisplayNameHe}</label>
                  <input
                    type="text"
                    value={draft.client_display_name?.he ?? ''}
                    onChange={e => setDraft(d => ({ ...d, client_display_name: { he: e.target.value, en: d.client_display_name?.en ?? '', ru: d.client_display_name?.ru ?? '' } }))}
                    placeholder={draft.label?.he ?? ''}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-500/50 focus:outline-none"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.clientDisplayNameEn}</label>
                  <input
                    type="text"
                    value={draft.client_display_name?.en ?? ''}
                    onChange={e => setDraft(d => ({ ...d, client_display_name: { he: d.client_display_name?.he ?? '', en: e.target.value, ru: d.client_display_name?.ru ?? '' } }))}
                    placeholder={draft.label?.en ?? ''}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-500/50 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-600">{te.clientDisplayNameHint}</p>

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.fieldType} <InfoTooltip text={tips.fieldType ?? ''} size={11} /></label>
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
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.category} <InfoTooltip text={tips.category ?? ''} size={11} /></label>
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
                    {te.readOnlyField}
                    <InfoTooltip text={tips.readOnly ?? ''} size={11} />
                  </span>
                </div>
              </label>

              {/* meta_key (locked) */}
              {editingId && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.metaKey} <InfoTooltip text={tips.metaKey ?? ''} size={11} /></label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <Lock size={12} className="text-slate-500 shrink-0" />
                    <code className="text-sm text-slate-300">{draft.meta_key}</code>
                  </div>
                </div>
              )}

              {/* Default Value */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.defaultValue} <InfoTooltip text={tips.defaultValue ?? ''} size={11} /></label>
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
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-400">{te.options} <InfoTooltip text={tips.options ?? ''} size={11} /></label>
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
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-400">{te.subFields} <InfoTooltip text={tips.composite ?? ''} size={11} /></label>
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
                    <InfoTooltip text={tips.required ?? ''} size={11} />
                  </label>
                )}
                {valConfig.unique && (
                  <label className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300 cursor-pointer hover:bg-white/[0.04]">
                    <input type="checkbox" checked={draft.validation.unique ?? false}
                      onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, unique: e.target.checked || undefined } }))}
                      className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30" />
                    {te.uniqueValue}
                    <InfoTooltip text={tips.unique ?? ''} size={11} />
                  </label>
                )}
              </div>
              {valConfig.minMax && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-slate-400">Min <InfoTooltip text={tips.minMax ?? ''} size={11} /></label>
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
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.patternRegex} <InfoTooltip text={tips.pattern ?? ''} size={11} /></label>
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
                    {te.visibilityRulesLabel}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {te.visibilityRulesDesc}
                  </p>
                </div>
                <button
                  onClick={() => setDraft(d => ({ ...d, visibility_rules: [...(d.visibility_rules ?? []), { field_ref: '', operator: 'not_empty' }] }))}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Plus size={12} /> {te.addCondition}
                </button>
              </div>

              {(draft.visibility_rules ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
                  <EyeOff size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">{te.fieldAlwaysVisible}</p>
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
                    <input type="text" value={rule.value ?? ''} placeholder={te.valuePlaceholder}
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
                    {te.colorRulesLabel}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {te.colorRulesDesc}
                  </p>
                </div>
                <button
                  onClick={() => setDraft(d => ({ ...d, color_rules: [...(d.color_rules ?? []), { operator: 'empty', color: '#ef4444' }] }))}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Plus size={12} /> {te.addColorRule}
                </button>
              </div>

              {(draft.color_rules ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
                  <Palette size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">{te.noColorRules}</p>
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
                    <input type="text" value={rule.value ?? ''} placeholder={te.valuePlaceholder}
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
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400">{te.aliases} <InfoTooltip text={tips.aliases ?? ''} size={11} /></label>
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
