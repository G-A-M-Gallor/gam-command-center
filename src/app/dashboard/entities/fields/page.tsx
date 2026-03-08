'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, ChevronDown, ChevronRight,
  Hash, Type, Calendar as CalendarIcon, CheckSquare, List, Link as LinkIcon,
  Mail, Phone, Users, Tag, Combine, Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/command-center/PageHeader';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchGlobalFields, createGlobalField, updateGlobalField, deleteGlobalField,
  getFieldUsage,
} from '@/lib/supabase/entityQueries';
import { BUILTIN_FIELDS } from '@/lib/entities/builtinFields';
import type { GlobalField, GlobalFieldInsert, FieldType, FieldCategory, SubField, FieldOption, I18nLabel } from '@/lib/entities/types';

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
  'multi-select': { he: 'בחירה מרובה', en: 'Multi-select' },
  date: { he: 'תאריך', en: 'Date' },
  person: { he: 'אדם', en: 'Person' },
  url: { he: 'קישור', en: 'URL' },
  email: { he: 'אימייל', en: 'Email' },
  phone: { he: 'טלפון', en: 'Phone' },
  checkbox: { he: 'תיבת סימון', en: 'Checkbox' },
  composite: { he: 'מורכב', en: 'Composite' },
  relation: { he: 'קשר', en: 'Relation' },
  formula: { he: 'נוסחה', en: 'Formula' },
};

const CATEGORIES: FieldCategory[] = ['general', 'contact', 'business', 'project', 'hr', 'finance'];
const CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  general: { he: 'כללי', en: 'General' },
  contact: { he: 'יצירת קשר', en: 'Contact' },
  business: { he: 'עסקי', en: 'Business' },
  project: { he: 'פרויקט', en: 'Project' },
  hr: { he: 'משאבי אנוש', en: 'HR' },
  finance: { he: 'פיננסי', en: 'Finance' },
};

const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };

function newFieldDefaults(): GlobalFieldInsert {
  return {
    meta_key: '',
    label: { ...EMPTY_LABEL },
    description: { ...EMPTY_LABEL },
    field_type: 'text',
    is_composite: false,
    sub_fields: [],
    display_template: null,
    options: [],
    validation: {},
    default_value: null,
    icon: null,
    category: 'general',
    sort_order: 0,
  };
}

export default function FieldLibraryPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const te = t.entities;

  const [fields, setFields] = useState<GlobalField[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FieldCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FieldType | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GlobalFieldInsert>(newFieldDefaults());
  const [usageMap, setUsageMap] = useState<Record<string, string[]>>({});

  const loadFields = useCallback(async () => {
    setLoading(true);
    const data = await fetchGlobalFields();
    if (data.length === 0) {
      // Seed built-in fields if empty
      for (const f of BUILTIN_FIELDS) {
        await createGlobalField(f);
      }
      const seeded = await fetchGlobalFields();
      setFields(seeded);
    } else {
      setFields(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFields(); }, [loadFields]);

  // Load usage info
  useEffect(() => {
    (async () => {
      const map: Record<string, string[]> = {};
      for (const f of fields) {
        map[f.meta_key] = await getFieldUsage(f.meta_key);
      }
      setUsageMap(map);
    })();
  }, [fields]);

  const filtered = useMemo(() => {
    return fields.filter(f => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (typeFilter !== 'all' && f.field_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const label = f.label[isHe ? 'he' : 'en']?.toLowerCase() ?? '';
        if (!f.meta_key.includes(q) && !label.includes(q)) return false;
      }
      return true;
    });
  }, [fields, search, categoryFilter, typeFilter, isHe]);

  const handleSave = async () => {
    if (!draft.meta_key.trim()) return;
    if (editingId) {
      await updateGlobalField(editingId, draft);
    } else {
      await createGlobalField(draft);
    }
    setShowCreate(false);
    setEditingId(null);
    setDraft(newFieldDefaults());
    await loadFields();
  };

  const handleDelete = async (id: string) => {
    await deleteGlobalField(id);
    await loadFields();
  };

  const startEdit = (field: GlobalField) => {
    setEditingId(field.id);
    setDraft({
      meta_key: field.meta_key,
      label: { ...field.label },
      description: { ...field.description },
      field_type: field.field_type,
      is_composite: field.is_composite,
      sub_fields: [...field.sub_fields],
      display_template: field.display_template,
      options: [...field.options],
      validation: { ...field.validation },
      default_value: field.default_value,
      icon: field.icon,
      category: field.category as FieldCategory,
      sort_order: field.sort_order,
    });
    setShowCreate(true);
  };

  const addSubField = () => {
    setDraft(d => ({
      ...d,
      sub_fields: [...d.sub_fields, { meta_key: '', label: { ...EMPTY_LABEL }, field_type: 'text' as FieldType }],
    }));
  };

  const updateSubField = (idx: number, patch: Partial<SubField>) => {
    setDraft(d => ({
      ...d,
      sub_fields: d.sub_fields.map((sf, i) => i === idx ? { ...sf, ...patch } : sf),
    }));
  };

  const addOption = () => {
    setDraft(d => ({
      ...d,
      options: [...d.options, { value: '', label: { ...EMPTY_LABEL }, color: '#94a3b8' }],
    }));
  };

  const updateOption = (idx: number, patch: Partial<FieldOption>) => {
    setDraft(d => ({
      ...d,
      options: d.options.map((o, i) => i === idx ? { ...o, ...patch } : o),
    }));
  };

  const lang = isHe ? 'he' : 'en';

  return (
    <div className="space-y-6" dir={isHe ? 'rtl' : 'ltr'}>
      <PageHeader pageKey="entityFields" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={te.searchFields}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] ps-9 pe-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as FieldCategory | 'all')}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
        >
          <option value="all">{te.allCategories}</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]?.[lang] ?? c}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as FieldType | 'all')}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
        >
          <option value="all">{te.allTypes}</option>
          {Object.keys(FIELD_TYPE_LABELS).map(ft => (
            <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]?.[lang] ?? ft}</option>
          ))}
        </select>

        <button
          onClick={() => { setShowCreate(true); setEditingId(null); setDraft(newFieldDefaults()); }}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          <Plus size={14} />
          {te.newField}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span>{filtered.length} {te.fields}</span>
        <span>{fields.filter(f => f.is_composite).length} {te.composite}</span>
      </div>

      {/* Field List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(field => {
            const Icon = FIELD_TYPE_ICONS[field.field_type] ?? Type;
            const usage = usageMap[field.meta_key] ?? [];
            return (
              <div
                key={field.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06]">
                  <Icon size={15} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {field.label[lang] || field.meta_key}
                    </span>
                    <code className="text-[10px] text-slate-500 bg-white/[0.04] px-1.5 rounded">
                      {field.meta_key}
                    </code>
                    {field.is_composite && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        {te.composite}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">
                      {FIELD_TYPE_LABELS[field.field_type]?.[lang] ?? field.field_type}
                    </span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">
                      {CATEGORY_LABELS[field.category]?.[lang] ?? field.category}
                    </span>
                    {usage.length > 0 && (
                      <>
                        <span className="text-[10px] text-slate-600">·</span>
                        <span className="text-[10px] text-slate-500">
                          {te.usedIn}: {usage.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(field)}
                    className="rounded p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="rounded p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/[0.06]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              {te.noFieldsFound}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            dir={isHe ? 'rtl' : 'ltr'}
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              {editingId ? te.editField : te.newField}
            </h2>

            <div className="space-y-4">
              {/* meta_key */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.metaKey}</label>
                <input
                  type="text"
                  value={draft.meta_key}
                  onChange={e => setDraft(d => ({ ...d, meta_key: e.target.value.replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="phone, full_name, etc."
                  disabled={!!editingId}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                  dir="ltr"
                />
              </div>

              {/* Label HE */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.labelHe}</label>
                <input
                  type="text"
                  value={draft.label.he}
                  onChange={e => setDraft(d => ({ ...d, label: { ...d.label, he: e.target.value } }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  dir="rtl"
                />
              </div>

              {/* Label EN */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.labelEn}</label>
                <input
                  type="text"
                  value={draft.label.en}
                  onChange={e => setDraft(d => ({ ...d, label: { ...d.label, en: e.target.value } }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.fieldType}</label>
                <select
                  value={draft.field_type}
                  onChange={e => {
                    const ft = e.target.value as FieldType;
                    setDraft(d => ({
                      ...d,
                      field_type: ft,
                      is_composite: ft === 'composite',
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                >
                  {Object.keys(FIELD_TYPE_LABELS).map(ft => (
                    <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]?.[lang] ?? ft}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.category}</label>
                <select
                  value={draft.category}
                  onChange={e => setDraft(d => ({ ...d, category: e.target.value as FieldCategory }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]?.[lang] ?? c}</option>
                  ))}
                </select>
              </div>

              {/* Sub-fields for composite */}
              {draft.is_composite && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">{te.subFields}</label>
                    <button onClick={addSubField} className="text-xs text-purple-400 hover:text-purple-300">
                      + {te.addSubField}
                    </button>
                  </div>
                  {draft.sub_fields.map((sf, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={sf.meta_key}
                        onChange={e => updateSubField(i, { meta_key: e.target.value.replace(/[^a-z0-9_]/g, '') })}
                        placeholder="meta_key"
                        className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                        dir="ltr"
                      />
                      <input
                        type="text"
                        value={sf.label[lang] ?? ''}
                        onChange={e => updateSubField(i, { label: { ...sf.label, [lang]: e.target.value } })}
                        placeholder={te.label}
                        className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                      />
                      <select
                        value={sf.field_type}
                        onChange={e => updateSubField(i, { field_type: e.target.value as FieldType })}
                        className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                      >
                        {['text', 'number', 'date', 'email', 'phone'].map(ft => (
                          <option key={ft} value={ft}>{ft}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {/* Display template */}
                  <div>
                    <label className="text-xs font-medium text-slate-400">{te.displayTemplate}</label>
                    <input
                      type="text"
                      value={draft.display_template ?? ''}
                      onChange={e => setDraft(d => ({ ...d, display_template: e.target.value || null }))}
                      placeholder="{first_name} {last_name}"
                      className="mt-1 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* Options for select/multi-select */}
              {(draft.field_type === 'select' || draft.field_type === 'multi-select') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">{te.options}</label>
                    <button onClick={addOption} className="text-xs text-purple-400 hover:text-purple-300">
                      + {te.addOption}
                    </button>
                  </div>
                  {draft.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={opt.color ?? '#94a3b8'}
                        onChange={e => updateOption(i, { color: e.target.value })}
                        className="h-7 w-7 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt.value}
                        onChange={e => updateOption(i, { value: e.target.value })}
                        placeholder="value"
                        className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                        dir="ltr"
                      />
                      <input
                        type="text"
                        value={opt.label[lang] ?? ''}
                        onChange={e => updateOption(i, { label: { ...opt.label, [lang]: e.target.value } })}
                        placeholder={te.label}
                        className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreate(false); setEditingId(null); }}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:bg-white/[0.04]"
              >
                {te.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!draft.meta_key.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-40"
              >
                {editingId ? te.save : te.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
