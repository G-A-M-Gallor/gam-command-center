'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, ChevronDown, ChevronRight,
  Hash, Type, Calendar as CalendarIcon, CheckSquare, List, Link as LinkIcon,
  Mail, Phone, Users, Tag, Combine, Lock, GitMerge, X, GripVertical, LayoutGrid,
  Info, Eye, Palette, Shield, Table2, CreditCard,
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
import { FieldEditorModal } from '@/components/entities/FieldEditorModal';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import type { GlobalField, GlobalFieldInsert, FieldType, FieldCategory, I18nLabel } from '@/lib/entities/types';

type ViewMode = 'list' | 'cards' | 'compact';
type FieldTab = 'library' | 'system';

const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
  text: Type, number: Hash, select: List, 'multi-select': Tag,
  date: CalendarIcon, person: Users, url: LinkIcon, email: Mail,
  phone: Phone, checkbox: CheckSquare, composite: Combine,
  relation: LinkIcon, formula: Hash,
};

const FIELD_TYPE_LABELS: Record<string, { he: string; en: string; ru: string }> = {
  text: { he: 'טקסט', en: 'Text', ru: 'Текст' },
  number: { he: 'מספר', en: 'Number', ru: 'Число' },
  select: { he: 'בחירה', en: 'Select', ru: 'Выбор' },
  'multi-select': { he: 'בחירה מרובה', en: 'Multi-select', ru: 'Мультивыбор' },
  date: { he: 'תאריך', en: 'Date', ru: 'Дата' },
  person: { he: 'אדם', en: 'Person', ru: 'Контакт' },
  url: { he: 'קישור', en: 'URL', ru: 'Ссылка' },
  email: { he: 'אימייל', en: 'Email', ru: 'Email' },
  phone: { he: 'טלפון', en: 'Phone', ru: 'Телефон' },
  checkbox: { he: 'תיבת סימון', en: 'Checkbox', ru: 'Чекбокс' },
  composite: { he: 'מורכב', en: 'Composite', ru: 'Составной' },
  relation: { he: 'קשר', en: 'Relation', ru: 'Связь' },
  formula: { he: 'נוסחה', en: 'Formula', ru: 'Формула' },
};

const CATEGORIES: FieldCategory[] = ['system', 'general', 'contact', 'business', 'project', 'hr', 'finance', 'construction'];
const CATEGORY_LABELS: Record<string, { he: string; en: string; ru: string }> = {
  system: { he: 'מערכת', en: 'System', ru: 'Система' },
  general: { he: 'כללי', en: 'General', ru: 'Общее' },
  contact: { he: 'יצירת קשר', en: 'Contact', ru: 'Контакт' },
  business: { he: 'עסקי', en: 'Business', ru: 'Бизнес' },
  project: { he: 'פרויקט', en: 'Project', ru: 'Проект' },
  hr: { he: 'משאבי אנוש', en: 'HR', ru: 'Кадры' },
  finance: { he: 'פיננסי', en: 'Finance', ru: 'Финансы' },
  construction: { he: 'בנייה', en: 'Construction', ru: 'Строительство' },
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
    aliases: [],
    sort_order: 0,
    read_only: false,
    visibility_rules: [],
    color_rules: [],
  };
}

/* ─── Field row content (shared between sortable and plain) ──── */

type FieldRowProps = {
  field: GlobalField;
  lang: 'he' | 'en' | 'ru';
  te: Record<string, unknown>;
  usageMap: Record<string, string[]>;
  onEdit: (f: GlobalField) => void;
  onDelete: (f: GlobalField) => void;
  onMerge: (id: string) => void;
};

function FieldRowContent({ field, lang, te, usageMap, onEdit, onDelete, onMerge, dragHandle }: FieldRowProps & { dragHandle?: React.ReactNode }) {
  const Icon = FIELD_TYPE_ICONS[field.field_type] ?? Type;
  const usage = usageMap[field.meta_key] ?? [];
  const isSystem = field.category === 'system';

  return (
    <>
      {dragHandle}
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
    </>
  );
}

/* ─── Sortable field row (only used inside DndContext) ────────── */

function SortableFieldRow(props: FieldRowProps & { dragEnabled: boolean }) {
  const { field, dragEnabled } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id, disabled: !dragEnabled });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isSystem = field.category === 'system';

  const dragHandle = dragEnabled && !isSystem ? (
    <button {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity touch-none" title={(props.te as { dragToReorder: string }).dragToReorder}>
      <GripVertical size={14} className="text-slate-500" />
    </button>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-white/[0.04] transition-colors group ${
        isSystem ? 'border-purple-500/15 bg-purple-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <FieldRowContent {...props} dragHandle={dragHandle} />
    </div>
  );
}

/* ─── Plain field row (used in grouped view — no DndContext) ─── */

function PlainFieldRow(props: FieldRowProps) {
  const isSystem = props.field.category === 'system';
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-white/[0.04] transition-colors group ${
      isSystem ? 'border-purple-500/15 bg-purple-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
    }`}>
      <FieldRowContent {...props} />
    </div>
  );
}

/* ─── Field Card (cards view) ─────────────────────────────────── */

function FieldCard({
  field, lang, te, usageMap, onEdit, onDelete,
}: {
  field: GlobalField;
  lang: 'he' | 'en' | 'ru';
  te: Record<string, unknown>;
  usageMap: Record<string, string[]>;
  onEdit: (f: GlobalField) => void;
  onDelete: (f: GlobalField) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const Icon = FIELD_TYPE_ICONS[field.field_type] ?? Type;
  const usage = usageMap[field.meta_key] ?? [];
  const isSystem = field.category === 'system';
  const desc = field.description[lang] || (te as { noDescription: string }).noDescription;
  const hasOpts = field.options.length > 0;
  const hasVal = field.validation && Object.keys(field.validation).length > 0;
  const hasCR = (field.color_rules ?? []).length > 0;
  const hasVR = (field.visibility_rules ?? []).length > 0;

  return (
    <div className={`relative rounded-xl border p-4 transition-colors hover:bg-white/[0.04] group ${
      isSystem ? 'border-purple-500/15 bg-purple-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
    }`}>
      {/* Top row: icon + name + actions */}
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
          isSystem ? 'bg-amber-500/10' : 'bg-purple-500/10'
        }`}>
          <Icon size={18} className={isSystem ? 'text-amber-400' : 'text-purple-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200 truncate">
              {field.label[lang] || field.meta_key}
            </span>
            {isSystem && <Lock size={10} className="text-amber-400 shrink-0" />}
            {field.read_only && <Shield size={10} className="text-blue-400 shrink-0" />}
          </div>
          <code className="text-[10px] text-slate-500">{field.meta_key}</code>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setShowInfo(!showInfo)} className="rounded p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]">
            <Info size={13} />
          </button>
          {!isSystem && (
            <>
              <button onClick={() => onEdit(field)} className="rounded p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]">
                <Edit3 size={13} />
              </button>
              <button onClick={() => onDelete(field)} className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-white/[0.06]">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-slate-400/80 mt-2 line-clamp-2">{desc}</p>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
          {FIELD_TYPE_LABELS[field.field_type]?.[lang] ?? field.field_type}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
          {CATEGORY_LABELS[field.category]?.[lang] ?? field.category}
        </span>
        {hasOpts && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300">
            {field.options.length} {(te as { optionsCount: string }).optionsCount}
          </span>
        )}
        {hasCR && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300"><Palette size={9} className="inline -mt-px" /> {(te as { hasColorRules: string }).hasColorRules}</span>}
        {hasVR && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-300"><Eye size={9} className="inline -mt-px" /> {(te as { hasVisibilityRules: string }).hasVisibilityRules}</span>}
        {field.read_only && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">{(te as { isReadOnly: string }).isReadOnly}</span>}
      </div>

      {/* Usage */}
      {usage.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          <span className="text-[9px] text-slate-600">{(te as { usedIn: string }).usedIn}:</span>
          {usage.map(slug => (
            <Link key={slug} href={`/dashboard/entities/${slug}`}
              className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">
              {slug}
            </Link>
          ))}
        </div>
      )}

      {/* Expanded info panel */}
      {showInfo && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 animate-in fade-in duration-200">
          <div>
            <span className="text-[10px] font-medium text-slate-500">{(te as { fieldPurpose: string }).fieldPurpose}</span>
            <p className="text-[11px] text-slate-300 mt-0.5">{field.description[lang] || field.description.en || field.description.he || '—'}</p>
          </div>
          {hasVal && (
            <div>
              <span className="text-[10px] font-medium text-slate-500">{(te as { hasValidation: string }).hasValidation}</span>
              <div className="flex gap-2 mt-0.5">
                {field.validation.required && <span className="text-[10px] text-emerald-400">required</span>}
                {field.validation.unique && <span className="text-[10px] text-blue-400">unique</span>}
                {field.validation.pattern && <span className="text-[10px] text-amber-400">/{field.validation.pattern}/</span>}
                {field.validation.min != null && <span className="text-[10px] text-slate-400">min: {field.validation.min}</span>}
                {field.validation.max != null && <span className="text-[10px] text-slate-400">max: {field.validation.max}</span>}
              </div>
            </div>
          )}
          {hasOpts && (
            <div>
              <span className="text-[10px] font-medium text-slate-500">{(te as { optionsCount: string }).optionsCount} ({field.options.length})</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {field.options.slice(0, 8).map((opt, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${opt.color}20`, color: opt.color }}>
                    {opt.label[lang] || opt.value}
                  </span>
                ))}
                {field.options.length > 8 && <span className="text-[10px] text-slate-500">+{field.options.length - 8}</span>}
              </div>
            </div>
          )}
          {field.aliases.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-slate-500">{(te as { aliases: string }).aliases}</span>
              <div className="flex gap-1 mt-0.5">
                {field.aliases.map(a => <code key={a} className="text-[10px] px-1 rounded bg-white/[0.04] text-slate-400">{a}</code>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

export default function FieldLibraryPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === 'he';
  const te = t.entities;

  const [activeTab, setActiveTab] = useState<FieldTab>('library');
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
  const [deletingField, setDeletingField] = useState<GlobalField | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('cc-fields-view') as ViewMode) || 'list';
    return 'list';
  });
  const [groupByCategory, setGroupByCategory] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('cc-fields-grouped') === 'true';
    return false;
  });
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [_newAlias, setNewAlias] = useState('');

  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';

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
      // Auto-seed any missing built-in fields (system + all categories)
      const existingKeys = new Set(data.map(f => f.meta_key));
      const missingFields = BUILTIN_FIELDS.filter(f => !existingKeys.has(f.meta_key));
      if (missingFields.length > 0) {
        for (const f of missingFields) await createGlobalField(f);
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

  // Split fields by tab
  const systemFields = useMemo(() => fields.filter(f => f.category === 'system'), [fields]);
  const libraryFields = useMemo(() => fields.filter(f => f.category !== 'system'), [fields]);

  const filtered = useMemo(() => {
    const base = activeTab === 'system' ? systemFields : libraryFields;
    return base.filter(f => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (typeFilter !== 'all' && f.field_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const label = (f.label.he?.toLowerCase() ?? '') + ' ' + (f.label.en?.toLowerCase() ?? '') + ' ' + (f.label.ru?.toLowerCase() ?? '');
        const desc = (f.description.he?.toLowerCase() ?? '') + ' ' + (f.description.en?.toLowerCase() ?? '');
        const catLabel = (CATEGORY_LABELS[f.category]?.he ?? '') + ' ' + (CATEGORY_LABELS[f.category]?.en ?? '');
        const typeLabel = (FIELD_TYPE_LABELS[f.field_type]?.he ?? '') + ' ' + (FIELD_TYPE_LABELS[f.field_type]?.en ?? '');
        const searchIndex = `${f.meta_key} ${label} ${desc} ${catLabel} ${typeLabel} ${(f.aliases ?? []).join(' ')}`.toLowerCase();
        if (!searchIndex.includes(q)) return false;
      }
      return true;
    });
  }, [fields, search, categoryFilter, typeFilter, activeTab, systemFields, libraryFields]);

  // Drag is only active when viewing unfiltered, ungrouped list view
  const isDragEnabled = viewMode === 'list' && !search && categoryFilter === 'all' && typeFilter === 'all' && !groupByCategory;

  const handleSave = async () => {
    const finalDraft = { ...draft };
    if (!editingId) {
      const label = draft.label?.en || draft.label?.he || '';
      if (!label.trim()) return;
      finalDraft.meta_key = generateMetaKey(label);
    }
    if (!finalDraft.meta_key?.trim()) return;
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
      label: { he: field.label?.he ?? '', en: field.label?.en ?? '', ru: field.label?.ru ?? '' },
      description: { he: field.description?.he ?? '', en: field.description?.en ?? '', ru: field.description?.ru ?? '' },
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
      read_only: field.read_only ?? false,
      visibility_rules: [...(field.visibility_rules ?? [])],
      color_rules: [...(field.color_rules ?? [])],
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

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('cc-fields-view', mode);
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

  // Build CustomSelect options — exclude 'system' in library tab
  const activeCats = activeTab === 'system' ? ['system'] : CATEGORIES.filter(c => c !== 'system');
  const categoryOptions = [
    { value: 'all', label: te.allCategories },
    ...activeCats.map(c => ({ value: c, label: CATEGORY_LABELS[c]?.[lang] ?? c })),
  ];

  const typeOptions = [
    { value: 'all', label: te.allTypes },
    ...Object.keys(FIELD_TYPE_LABELS).map(ft => ({ value: ft, label: FIELD_TYPE_LABELS[ft]?.[lang] ?? ft })),
  ];

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
  const fieldRowProps = (field: GlobalField): FieldRowProps => ({
    field,
    lang,
    te: te as unknown as Record<string, unknown>,
    usageMap,
    onEdit: startEdit,
    onDelete: setDeletingField,
    onMerge: setMergeSourceId,
  });

  // Sortable row — only used inside DndContext (flat list view)
  const renderSortableRow = (field: GlobalField) => (
    <SortableFieldRow
      key={field.id}
      {...fieldRowProps(field)}
      dragEnabled={isDragEnabled}
    />
  );

  // Plain row — used in grouped view (no DndContext)
  const renderPlainRow = (field: GlobalField) => (
    <PlainFieldRow key={field.id} {...fieldRowProps(field)} />
  );

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader pageKey="entityFields" />

      {/* Tab switcher: System vs Library */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {([
          { tab: 'library' as FieldTab, label: (te as unknown as Record<string, string>).tabLibrary ?? 'Field Library', count: libraryFields.length, color: 'purple' },
          { tab: 'system' as FieldTab, label: (te as unknown as Record<string, string>).tabSystem ?? 'System Fields', count: systemFields.length, color: 'amber' },
        ]).map(({ tab, label, count, color }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCategoryFilter('all'); setSearch(''); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? `bg-${color}-500/15 text-${color}-300 shadow-sm`
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            {tab === 'system' && <Lock size={13} />}
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? `bg-${color}-500/20 text-${color}-300` : 'bg-white/[0.06] text-slate-500'
            }`}>{count}</span>
          </button>
        ))}
        <InfoTooltip
          text={activeTab === 'system'
            ? ((te as unknown as Record<string, string>).systemFieldsInfo ?? 'System fields are built-in and auto-applied to all entities.')
            : ((te as unknown as Record<string, string>).libraryFieldsInfo ?? 'Create and manage fields for your entity types.')}
          size={14}
          className="ms-1"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={(te as unknown as Record<string, string>).searchByAll ?? te.searchFields}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] ps-9 pe-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <CustomSelect
          value={categoryFilter}
          options={categoryOptions}
          onChange={v => setCategoryFilter(v as FieldCategory | 'all')}
          className="min-w-[140px]"
        />

        {/* Type filter */}
        <CustomSelect
          value={typeFilter}
          options={typeOptions}
          onChange={v => setTypeFilter(v as FieldType | 'all')}
          className="min-w-[130px]"
        />

        {/* View mode switcher */}
        <div className="flex items-center rounded-lg border border-white/[0.08] overflow-hidden">
          {([
            { mode: 'list' as ViewMode, icon: List, label: te.viewList },
            { mode: 'cards' as ViewMode, icon: CreditCard, label: te.viewCards },
            { mode: 'compact' as ViewMode, icon: Table2, label: te.viewCompact },
          ]).map(({ mode, icon: ModeIcon, label }) => (
            <button
              key={mode}
              onClick={() => changeViewMode(mode)}
              className={`flex items-center gap-1 px-2.5 py-2 text-xs transition-colors ${
                viewMode === mode
                  ? 'bg-purple-500/15 text-purple-300'
                  : 'bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
              title={label as string}
            >
              <ModeIcon size={13} />
            </button>
          ))}
        </div>

        {/* Group toggle (only in list view + library tab) */}
        {viewMode === 'list' && activeTab === 'library' && (
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
        )}

        {/* New field button — only in library tab */}
        {activeTab === 'library' && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); setDraft(newFieldDefaults()); }}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
          >
            <Plus size={14} />
            {te.newField}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span>{filtered.length}/{fields.length} {te.fields}</span>
        <span>{fields.filter(f => f.is_composite).length} {te.composite}</span>
        {search && <span className="text-purple-400">&quot;{search}&quot;</span>}
      </div>

      {/* Field List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.03]" />
          ))}
        </div>
      ) : fields.length === 0 ? (
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
        <div className="py-16 text-center">
          <Search size={36} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-400">{te.noFieldsFound}</p>
          <p className="text-xs text-slate-600 mt-1">{te.tryDifferentSearch}</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── Cards view ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(field => (
            <FieldCard
              key={field.id}
              field={field}
              lang={lang}
              te={te as unknown as Record<string, unknown>}
              usageMap={usageMap}
              onEdit={startEdit}
              onDelete={setDeletingField}
            />
          ))}
        </div>
      ) : viewMode === 'compact' ? (
        /* ── Compact table view ── */
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white/[0.03] text-slate-500 border-b border-white/[0.06]">
                <th className="text-start px-3 py-2 font-medium">{te.label}</th>
                <th className="text-start px-3 py-2 font-medium">{te.metaKey}</th>
                <th className="text-start px-3 py-2 font-medium">{te.fieldType}</th>
                <th className="text-start px-3 py-2 font-medium">{te.category}</th>
                <th className="text-start px-3 py-2 font-medium">{te.options}</th>
                <th className="text-start px-3 py-2 font-medium">{te.fieldSettings}</th>
                <th className="text-start px-3 py-2 font-medium">{te.usedIn}</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(field => {
                const Icon = FIELD_TYPE_ICONS[field.field_type] ?? Type;
                const usage = usageMap[field.meta_key] ?? [];
                const isSystem = field.category === 'system';
                return (
                  <tr key={field.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon size={12} className={isSystem ? 'text-amber-400' : 'text-purple-400'} />
                        <span className="text-slate-200 font-medium">{field.label[lang] || field.meta_key}</span>
                        {isSystem && <Lock size={9} className="text-amber-400" />}
                      </div>
                    </td>
                    <td className="px-3 py-2"><code className="text-slate-500">{field.meta_key}</code></td>
                    <td className="px-3 py-2 text-slate-400">{FIELD_TYPE_LABELS[field.field_type]?.[lang] ?? field.field_type}</td>
                    <td className="px-3 py-2 text-slate-400">{CATEGORY_LABELS[field.category]?.[lang] ?? field.category}</td>
                    <td className="px-3 py-2 text-slate-500">{field.options.length > 0 ? field.options.length : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {field.validation?.required && <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400">req</span>}
                        {field.validation?.unique && <span className="text-[9px] px-1 rounded bg-blue-500/10 text-blue-400">uniq</span>}
                        {(field.color_rules ?? []).length > 0 && <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-300"><Palette size={8} className="inline" /></span>}
                        {(field.visibility_rules ?? []).length > 0 && <span className="text-[9px] px-1 rounded bg-green-500/10 text-green-300"><Eye size={8} className="inline" /></span>}
                        {field.read_only && <span className="text-[9px] px-1 rounded bg-red-500/10 text-red-300"><Shield size={8} className="inline" /></span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {usage.map(slug => (
                          <Link key={slug} href={`/dashboard/entities/${slug}`} className="text-[9px] px-1 rounded bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">{slug}</Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {!isSystem && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(field)} className="rounded p-1 text-slate-500 hover:text-slate-300"><Edit3 size={12} /></button>
                          <button onClick={() => setDeletingField(field)} className="rounded p-1 text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'list' && groupByCategory && groupedFields ? (
        /* ── List view — grouped ── */
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
                    {catFields.map(renderPlainRow)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List view — flat with DnD ── */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-2">
              {filtered.map(renderSortableRow)}
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
        <FieldEditorModal
          draft={draft}
          editingId={editingId}
          onDraftChange={setDraft}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setEditingId(null); }}
          allFieldKeys={fields.map(f => f.meta_key)}
        />
      )}

      {/* Merge Modal */}
      {mergeSourceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
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
