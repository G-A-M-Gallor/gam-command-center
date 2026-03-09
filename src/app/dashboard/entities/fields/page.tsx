'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, ChevronDown, ChevronRight,
  Hash, Type, Calendar as CalendarIcon, CheckSquare, List, Link as LinkIcon,
  Mail, Phone, Users, Tag, Combine, Lock, GitMerge, X, GripVertical, LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageHeader } from '@/components/command-center/PageHeader';
import { ConfirmDialog } from '@/components/command-center/ConfirmDialog';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchGlobalFields, createGlobalField, updateGlobalField, deleteGlobalField,
  getFieldUsage, generateMetaKey, mergeField,
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

const CATEGORIES: FieldCategory[] = ['system', 'general', 'contact', 'business', 'project', 'hr', 'finance'];
const CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  system: { he: 'מערכת', en: 'System' },
  general: { he: 'כללי', en: 'General' },
  contact: { he: 'יצירת קשר', en: 'Contact' },
  business: { he: 'עסקי', en: 'Business' },
  project: { he: 'פרויקט', en: 'Project' },
  hr: { he: 'משאבי אנוש', en: 'HR' },
  finance: { he: 'פיננסי', en: 'Finance' },
};

const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };

// Validation UI: which controls show for which field types
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
    aliases: [],
    sort_order: 0,
  };
}

/* ─── Sortable field row ─────────────────────────────────────── */

function SortableFieldRow({
  field, lang, te, usageMap, onEdit, onDelete, onMerge, dragEnabled,
}: {
  field: GlobalField;
  lang: 'he' | 'en';
  te: Record<string, unknown>;
  usageMap: Record<string, string[]>;
  onEdit: (f: GlobalField) => void;
  onDelete: (f: GlobalField) => void;
  onMerge: (id: string) => void;
  dragEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id, disabled: !dragEnabled });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const Icon = FIELD_TYPE_ICONS[field.field_type] ?? Type;
  const usage = usageMap[field.meta_key] ?? [];
  const isSystem = field.category === 'system';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-white/[0.04] transition-colors group ${
        isSystem ? 'border-purple-500/15 bg-purple-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      {/* Drag handle */}
      {dragEnabled && !isSystem && (
        <button {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity touch-none" title={(te as { dragToReorder: string }).dragToReorder}>
          <GripVertical size={14} className="text-slate-500" />
        </button>
      )}
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06] shrink-0">
        <Icon size={15} className={isSystem ? 'text-amber-400' : 'text-purple-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">
            {field.label[lang] || field.meta_key}
          </span>
          <code className="text-[10px] text-slate-500 bg-white/[0.04] px-1.5 rounded">
            {field.meta_key}
          </code>
          {isSystem && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              <Lock size={9} />
              {(te as { systemField: string }).systemField}
            </span>
          )}
          {field.is_composite && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
              {(te as { composite: string }).composite}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
              <div className="flex items-center gap-1 flex-wrap">
                {usage.map(slug => (
                  <Link key={slug} href={`/dashboard/entities/${slug}`}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400
                               hover:bg-purple-500/15 hover:text-purple-300 transition-colors">
                    {slug}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Description preview */}
        {field.description[lang] && (
          <p className="text-[10px] text-slate-500/70 mt-0.5 line-clamp-1">
            {field.description[lang]}
          </p>
        )}
      </div>
      {field.aliases?.length > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300" title={field.aliases.join(', ')}>
          {field.aliases.length} {(te as { aliases: string }).aliases}
        </span>
      )}
      {!isSystem && (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onMerge(field.id)}
          className="rounded p-1.5 text-slate-500 hover:text-blue-400 hover:bg-white/[0.06]"
          title={(te as { mergeField: string }).mergeField}
        >
          <GitMerge size={13} />
        </button>
        <button
          onClick={() => onEdit(field)}
          className="rounded p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
        >
          <Edit3 size={13} />
        </button>
        <button
          onClick={() => onDelete(field)}
          className="rounded p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/[0.06]"
        >
          <Trash2 size={13} />
        </button>
      </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

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
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [deletingField, setDeletingField] = useState<GlobalField | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('cc-fields-grouped') === 'true';
    return false;
  });
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const lang = isHe ? 'he' : 'en';

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const loadFields = useCallback(async () => {
    setLoading(true);
    let data = await fetchGlobalFields();
    if (data.length === 0) {
      // Full seed — DB is empty
      let failCount = 0;
      for (const f of BUILTIN_FIELDS) {
        if (!(await createGlobalField(f))) failCount++;
      }
      if (failCount > 0) {
        window.dispatchEvent(new CustomEvent('cc-notify', {
          detail: { type: 'error', titleHe: `${failCount} שדות מובנים לא נוצרו`, titleEn: `${failCount} built-in fields failed to seed` },
        }));
      }
      data = await fetchGlobalFields();
    } else {
      // Auto-seed missing system fields only
      const existingKeys = new Set(data.map(f => f.meta_key));
      const missingSystem = BUILTIN_FIELDS.filter(f => f.category === 'system' && !existingKeys.has(f.meta_key));
      if (missingSystem.length > 0) {
        for (const f of missingSystem) await createGlobalField(f);
        data = await fetchGlobalFields();
      }
    }
    setFields(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadFields(); }, [loadFields]);

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

  // Drag is only active when viewing unfiltered, ungrouped full list
  const isDragEnabled = !search && categoryFilter === 'all' && typeFilter === 'all' && !groupByCategory;

  const handleSave = async () => {
    let finalDraft = { ...draft };
    if (!editingId) {
      const label = draft.label.en || draft.label.he;
      if (!label.trim()) return;
      finalDraft.meta_key = generateMetaKey(label);
    }
    if (!finalDraft.meta_key.trim()) return;
    let success: boolean;
    if (editingId) {
      success = await updateGlobalField(editingId, finalDraft);
    } else {
      success = (await createGlobalField(finalDraft)) !== null;
    }
    if (!success) {
      window.dispatchEvent(new CustomEvent('cc-notify', {
        detail: { type: 'error', titleHe: 'שגיאה בשמירת השדה', titleEn: 'Failed to save field' },
      }));
      return; // Don't close modal — draft preserved
    }
    setShowCreate(false);
    setEditingId(null);
    setDraft(newFieldDefaults());
    await loadFields();
  };

  const handleDelete = async (id: string) => {
    // Guard: cannot delete system fields
    const field = fields.find(f => f.id === id);
    if (field?.category === 'system') return;
    const ok = await deleteGlobalField(id);
    if (!ok) {
      window.dispatchEvent(new CustomEvent('cc-notify', {
        detail: { type: 'error', titleHe: 'שגיאה במחיקת השדה', titleEn: 'Failed to delete field' },
      }));
      return;
    }
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
      aliases: [...(field.aliases ?? [])],
      sort_order: field.sort_order,
    });
    setNewAlias('');
    setShowCreate(true);
  };

  const handleMerge = async (targetId: string) => {
    if (!mergeSourceId) return;
    await mergeField(mergeSourceId, targetId, fields);
    setMergeSourceId(null);
    await loadFields();
  };

  const addAlias = () => {
    const alias = newAlias.replace(/[^a-z0-9_]/g, '').trim();
    if (!alias || (draft.aliases ?? []).includes(alias)) return;
    setDraft(d => ({ ...d, aliases: [...(d.aliases ?? []), alias] }));
    setNewAlias('');
  };

  const removeAlias = (alias: string) => {
    setDraft(d => ({ ...d, aliases: (d.aliases ?? []).filter(a => a !== alias) }));
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

  const toggleGroupByCategory = () => {
    setGroupByCategory(prev => {
      const next = !prev;
      localStorage.setItem('cc-fields-grouped', String(next));
      return next;
    });
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  // DnD handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex(f => f.id === active.id);
    const newIndex = filtered.findIndex(f => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(filtered, oldIndex, newIndex);
    // Optimistically update local state
    setFields(reordered);
    // Persist new sort orders
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        await updateGlobalField(reordered[i].id, { sort_order: i });
      }
    }
  };

  // Build CustomSelect options
  const categoryOptions = [
    { value: 'all', label: te.allCategories },
    ...CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c]?.[lang] ?? c })),
  ];

  const typeOptions = [
    { value: 'all', label: te.allTypes },
    ...Object.keys(FIELD_TYPE_LABELS).map(ft => ({ value: ft, label: FIELD_TYPE_LABELS[ft]?.[lang] ?? ft })),
  ];

  const fieldTypeModalOptions = Object.keys(FIELD_TYPE_LABELS).map(ft => ({
    value: ft, label: FIELD_TYPE_LABELS[ft]?.[lang] ?? ft,
  }));

  const categoryModalOptions = CATEGORIES.map(c => ({
    value: c, label: CATEGORY_LABELS[c]?.[lang] ?? c,
  }));

  const subFieldTypeOptions = ['text', 'number', 'date', 'email', 'phone'].map(ft => ({
    value: ft, label: ft,
  }));

  // Group fields by category
  const groupedFields = useMemo(() => {
    if (!groupByCategory) return null;
    const groups: Record<string, GlobalField[]> = {};
    for (const f of filtered) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  }, [filtered, groupByCategory]);

  // Validation config for current field type
  const valConfig = VALIDATION_CONFIG[draft.field_type] ?? {};

  // Render field row (shared between flat + grouped)
  const renderFieldRow = (field: GlobalField) => (
    <SortableFieldRow
      key={field.id}
      field={field}
      lang={lang}
      te={te as unknown as Record<string, unknown>}
      usageMap={usageMap}
      onEdit={startEdit}
      onDelete={setDeletingField}
      onMerge={setMergeSourceId}
      dragEnabled={isDragEnabled}
    />
  );

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

        {/* 1. CustomSelect — category filter */}
        <CustomSelect
          value={categoryFilter}
          options={categoryOptions}
          onChange={v => setCategoryFilter(v as FieldCategory | 'all')}
          className="min-w-[140px]"
        />

        {/* 1. CustomSelect — type filter */}
        <CustomSelect
          value={typeFilter}
          options={typeOptions}
          onChange={v => setTypeFilter(v as FieldType | 'all')}
          className="min-w-[130px]"
        />

        {/* 2. Group toggle */}
        <button
          onClick={toggleGroupByCategory}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            groupByCategory
              ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-300'
          }`}
          title={groupByCategory ? te.flatList : te.groupByCategory}
        >
          {groupByCategory ? <List size={14} /> : <LayoutGrid size={14} />}
        </button>

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
      ) : fields.length === 0 ? (
        /* 9. Empty state — no fields at all */
        <div className="py-16 text-center">
          <Plus size={36} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-400">{te.noFieldsYet}</p>
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); setDraft(newFieldDefaults()); }}
            className="mt-3 text-xs text-purple-400 hover:text-purple-300"
          >
            + {te.createFirstField}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* 9. Empty state — search/filter with no results */
        <div className="py-16 text-center">
          <Search size={36} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-400">{te.noFieldsFound}</p>
          <p className="text-xs text-slate-600 mt-1">{te.tryDifferentSearch}</p>
        </div>
      ) : groupByCategory && groupedFields ? (
        /* 2. Grouped by category */
        <div className="space-y-4">
          {CATEGORIES.filter(cat => groupedFields[cat]?.length).map(cat => {
            const catFields = groupedFields[cat];
            const collapsed = collapsedCategories.has(cat);
            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCategoryCollapse(cat)}
                  className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span>{CATEGORY_LABELS[cat]?.[lang] ?? cat}</span>
                  <span className="text-slate-600">({catFields.length})</span>
                </button>
                {!collapsed && (
                  <div className="grid gap-2">
                    {catFields.map(renderFieldRow)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat list with DnD */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-2">
              {filtered.map(renderFieldRow)}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 3. Confirm delete dialog */}
      <ConfirmDialog
        open={!!deletingField}
        variant="danger"
        title={te.confirmDeleteField}
        message={
          deletingField
            ? `${deletingField.label[lang] || deletingField.meta_key}${
                (usageMap[deletingField.meta_key]?.length ?? 0) > 0
                  ? ` — ${te.fieldUsedWarning}`
                  : ''
              }`
            : ''
        }
        onConfirm={() => {
          if (deletingField) handleDelete(deletingField.id);
          setDeletingField(null);
        }}
        onCancel={() => setDeletingField(null)}
      />

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
              {/* meta_key — auto-generated, locked */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.metaKey}</label>
                {editingId ? (
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <Lock size={12} className="text-slate-500 shrink-0" />
                    <code className="text-sm text-slate-300">{draft.meta_key}</code>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <Lock size={12} className="text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-500">{te.autoGenerated}</span>
                  </div>
                )}
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

              {/* Description HE */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.descriptionHe}</label>
                <input
                  type="text"
                  value={draft.description.he}
                  onChange={e => setDraft(d => ({ ...d, description: { ...d.description, he: e.target.value } }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  dir="rtl"
                />
              </div>

              {/* Description EN */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.descriptionEn}</label>
                <input
                  type="text"
                  value={draft.description.en}
                  onChange={e => setDraft(d => ({ ...d, description: { ...d.description, en: e.target.value } }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* 1. Field Type — CustomSelect */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.fieldType}</label>
                <CustomSelect
                  value={draft.field_type}
                  options={fieldTypeModalOptions}
                  onChange={v => {
                    const ft = v as FieldType;
                    setDraft(d => ({ ...d, field_type: ft, is_composite: ft === 'composite' }));
                  }}
                  className="mt-1"
                />
              </div>

              {/* 1. Category — CustomSelect */}
              <div>
                <label className="text-xs font-medium text-slate-400">{te.category}</label>
                <CustomSelect
                  value={draft.category}
                  options={categoryModalOptions}
                  onChange={v => setDraft(d => ({ ...d, category: v as FieldCategory }))}
                  className="mt-1"
                />
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
                      {/* 1. Sub-field type — CustomSelect */}
                      <CustomSelect
                        value={sf.field_type}
                        options={subFieldTypeOptions}
                        onChange={v => updateSubField(i, { field_type: v as FieldType })}
                        className="min-w-[100px]"
                      />
                    </div>
                  ))}
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

              {/* 7. Validation Rules */}
              {(valConfig.required || valConfig.minMax || valConfig.pattern || valConfig.unique) && (
                <div className="space-y-3 border-t border-white/[0.06] pt-4">
                  <label className="text-xs font-semibold text-slate-400">{te.validation}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {valConfig.required && (
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.validation.required ?? false}
                          onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, required: e.target.checked || undefined } }))}
                          className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                        />
                        {te.required}
                      </label>
                    )}
                    {valConfig.unique && (
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.validation.unique ?? false}
                          onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, unique: e.target.checked || undefined } }))}
                          className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                        />
                        {te.uniqueValue}
                      </label>
                    )}
                  </div>
                  {valConfig.minMax && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500">Min</label>
                        <input
                          type="number"
                          value={draft.validation.min ?? ''}
                          onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, min: e.target.value ? Number(e.target.value) : undefined } }))}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500">Max</label>
                        <input
                          type="number"
                          value={draft.validation.max ?? ''}
                          onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, max: e.target.value ? Number(e.target.value) : undefined } }))}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  )}
                  {valConfig.pattern && (
                    <div>
                      <label className="text-[10px] text-slate-500">{te.patternRegex}</label>
                      <input
                        type="text"
                        value={draft.validation.pattern ?? ''}
                        onChange={e => setDraft(d => ({ ...d, validation: { ...d.validation, pattern: e.target.value || undefined } }))}
                        placeholder="^[A-Z].*"
                        className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 8. Default Value */}
              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">{te.defaultValue}</label>
                  {draft.default_value != null && (
                    <button
                      onClick={() => setDraft(d => ({ ...d, default_value: null }))}
                      className="text-[10px] text-slate-500 hover:text-red-400"
                    >
                      <X size={12} className="inline" /> {te.noDefault}
                    </button>
                  )}
                </div>
                {draft.field_type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.default_value === true}
                      onChange={e => setDraft(d => ({ ...d, default_value: e.target.checked }))}
                      className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                    />
                    {te.defaultValue}
                  </label>
                ) : draft.field_type === 'select' ? (
                  <CustomSelect
                    value={String(draft.default_value ?? '')}
                    options={[
                      { value: '', label: te.noDefault },
                      ...draft.options.map(o => ({ value: o.value, label: o.label[lang] || o.value })),
                    ]}
                    onChange={v => setDraft(d => ({ ...d, default_value: v || null }))}
                  />
                ) : draft.field_type === 'multi-select' ? (
                  <div className="space-y-1">
                    {draft.options.map(o => {
                      const selected = Array.isArray(draft.default_value) ? (draft.default_value as string[]).includes(o.value) : false;
                      return (
                        <label key={o.value} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={e => {
                              const curr = Array.isArray(draft.default_value) ? [...(draft.default_value as string[])] : [];
                              if (e.target.checked) curr.push(o.value);
                              else curr.splice(curr.indexOf(o.value), 1);
                              setDraft(d => ({ ...d, default_value: curr.length ? curr : null }));
                            }}
                            className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                          />
                          {o.label[lang] || o.value}
                        </label>
                      );
                    })}
                  </div>
                ) : draft.field_type === 'number' ? (
                  <input
                    type="number"
                    value={draft.default_value != null ? String(draft.default_value) : ''}
                    onChange={e => setDraft(d => ({ ...d, default_value: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                  />
                ) : draft.field_type === 'date' ? (
                  <input
                    type="date"
                    value={draft.default_value != null ? String(draft.default_value) : ''}
                    onChange={e => setDraft(d => ({ ...d, default_value: e.target.value || null }))}
                    className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                  />
                ) : (
                  <input
                    type="text"
                    value={draft.default_value != null ? String(draft.default_value) : ''}
                    onChange={e => setDraft(d => ({ ...d, default_value: e.target.value || null }))}
                    placeholder={te.noDefault}
                    className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                  />
                )}
              </div>
            </div>

            {/* Aliases */}
            {editingId && (
              <div className="space-y-2 mt-4">
                <label className="text-xs font-medium text-slate-400">{te.aliases}</label>
                {(draft.aliases ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(draft.aliases ?? []).map(alias => (
                      <span key={alias} className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-1 text-xs text-blue-300">
                        <LinkIcon size={10} />
                        <code>{alias}</code>
                        <button onClick={() => removeAlias(alias)} className="text-blue-400 hover:text-red-400 ms-0.5">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600">{te.noAliases}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={e => setNewAlias(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                    placeholder="alias_key"
                    className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                    dir="ltr"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlias(); } }}
                  />
                  <button onClick={addAlias} className="text-xs text-purple-400 hover:text-purple-300 px-2">
                    + {te.addAlias}
                  </button>
                </div>
              </div>
            )}

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
                disabled={editingId ? !draft.meta_key.trim() : !(draft.label.en.trim() || draft.label.he.trim())}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-40"
              >
                {editingId ? te.save : te.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeSourceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl" dir={isHe ? 'rtl' : 'ltr'}>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">{te.mergeField}</h2>
            <p className="text-xs text-amber-400 mb-4">{te.mergeWarning}</p>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {fields
                .filter(f => f.id !== mergeSourceId)
                .map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleMerge(f.id)}
                    className="w-full flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-start hover:bg-white/[0.06] transition-colors"
                  >
                    <GitMerge size={13} className="text-blue-400 shrink-0" />
                    <span className="text-sm text-slate-200">{f.label[lang] || f.meta_key}</span>
                    <code className="text-[10px] text-slate-500 ms-auto">{f.meta_key}</code>
                  </button>
                ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setMergeSourceId(null)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:bg-white/[0.04]"
              >
                {te.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
