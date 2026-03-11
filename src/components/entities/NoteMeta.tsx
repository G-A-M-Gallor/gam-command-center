'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Link2, Plus, X, Loader2, Users, Lock, Paperclip, Star } from 'lucide-react';
import { StakeholderPanel } from './StakeholderPanel';
import { ActivityFeed } from './ActivityFeed';
import { NoteActions } from './NoteActions';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchGlobalFields, fetchEntityTypes, updateNoteMeta,
  fetchNoteRelations, createNoteRelation, deleteNoteRelation,
  searchNotes, fetchFieldGroups, fetchNoteInfoBatch,
  fetchStakeholders,
} from '@/lib/supabase/entityQueries';
import type { GlobalField, EntityType, NoteRecord, NoteRelation, FieldGroup, I18nLabel, TemplateConfig, TemplateSection, VisibilityRule, ColorRule } from '@/lib/entities/types';
import { UNIVERSAL_FIELD_KEYS } from '@/lib/entities/builtinFields';

interface Props {
  noteId: string;
  entityType: string | null;
  meta: Record<string, unknown>;
  onMetaChange: (meta: Record<string, unknown>) => void;
  /** When true, hides StakeholderPanel + ActivityFeed (detail page renders them in its own sidebar) */
  hideSidebar?: boolean;
  /** Number of columns for field grid (default: 2) */
  columns?: 1 | 2 | 3 | 4;
}

// ─── Formula Evaluator ───────────────────────────────
function evaluateFormula(formula: string, meta: Record<string, unknown>): string {
  // Replace {field_key} placeholders with numeric meta values
  const expr = formula.replace(/\{([^}]+)\}/g, (_, key) => {
    const val = meta[key];
    const num = Number(val);
    return isNaN(num) ? '0' : String(num);
  });
  // Evaluate simple math: only digits, +, -, *, /, ., (, ), spaces
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return '—';
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expr});`)();
    return typeof result === 'number' && isFinite(result) ? String(Math.round(result * 100) / 100) : '—';
  } catch {
    return '—';
  }
}

// ─── Field Value Editor ──────────────────────────────
function FieldEditor({
  field, value, lang, onChange, readOnly, fieldColor, meta,
}: {
  field: GlobalField; value: unknown; lang: string;
  onChange: (val: unknown) => void;
  readOnly?: boolean;
  fieldColor?: string | null;
  meta?: Record<string, unknown>;
}) {
  const colorStyle = fieldColor ? { borderColor: fieldColor, boxShadow: `0 0 0 1px ${fieldColor}20` } : {};
  const readOnlyClass = readOnly ? 'opacity-60 pointer-events-none' : '';
  if (field.is_composite) {
    return (
      <div className={`space-y-1.5 ${readOnlyClass}`}>
        {field.sub_fields.map(sf => (
          <div key={sf.meta_key} className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 w-16 shrink-0">
              {sf.label[lang as keyof I18nLabel] || sf.meta_key}
            </label>
            <input
              type={sf.field_type === 'number' ? 'number' : sf.field_type === 'date' ? 'date' : 'text'}
              value={String((value as Record<string, unknown> | undefined)?.[sf.meta_key] ?? '')}
              readOnly={readOnly}
              onChange={e => {
                if (readOnly) return;
                const current = (typeof value === 'object' && value) ? { ...value as Record<string, unknown> } : {};
                current[sf.meta_key] = e.target.value;
                onChange(current);
              }}
              style={colorStyle}
              className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
            />
          </div>
        ))}
      </div>
    );
  }

  switch (field.field_type) {
    case 'select':
      return (
        <select
          value={String(value ?? '')}
          disabled={readOnly}
          onChange={e => onChange(e.target.value)}
          style={colorStyle}
          className={`w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300 ${readOnlyClass}`}
        >
          <option value="">—</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label[lang as keyof I18nLabel] || o.value}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={!!value}
          disabled={readOnly}
          onChange={e => onChange(e.target.checked)}
          className={`rounded border-white/20 ${readOnlyClass}`}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={String(value ?? '')}
          readOnly={readOnly}
          onChange={e => onChange(e.target.value)}
          style={colorStyle}
          className={`w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none ${readOnlyClass}`}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={String(value ?? '')}
          readOnly={readOnly}
          onChange={e => onChange(Number(e.target.value))}
          style={colorStyle}
          className={`w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none ${readOnlyClass}`}
        />
      );
    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={String(value ?? '')}
          readOnly={readOnly}
          onChange={e => onChange(e.target.value)}
          style={colorStyle}
          className={`w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none ${readOnlyClass}`}
        />
      );
    case 'currency':
      return (
        <div className={`flex items-center gap-1 ${readOnlyClass}`}>
          <span className="text-xs text-slate-500 shrink-0">₪</span>
          <input
            type="number"
            value={String(value ?? '')}
            readOnly={readOnly}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            style={colorStyle}
            className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
          />
        </div>
      );
    case 'rating': {
      const ratingVal = typeof value === 'number' ? value : 0;
      return (
        <div className={`flex items-center gap-0.5 ${readOnlyClass}`}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(ratingVal === n ? 0 : n)}
              className="p-0.5 transition-colors"
            >
              <Star
                size={16}
                className={n <= ratingVal ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
              />
            </button>
          ))}
        </div>
      );
    }
    case 'rich_text':
      return (
        <textarea
          rows={4}
          value={String(value ?? '')}
          readOnly={readOnly}
          onChange={e => onChange(e.target.value)}
          placeholder={field.label[lang as keyof I18nLabel] || field.meta_key}
          style={colorStyle}
          className={`w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none resize-y ${readOnlyClass}`}
        />
      );
    case 'file':
      return (
        <div className={`flex items-center gap-1 ${readOnlyClass}`}>
          <Paperclip size={12} className="text-slate-500 shrink-0" />
          <input
            type="url"
            value={String(value ?? '')}
            readOnly={readOnly}
            onChange={e => onChange(e.target.value)}
            placeholder="https://..."
            style={colorStyle}
            className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
          />
        </div>
      );
    case 'formula': {
      const formulaStr = field.default_value != null ? String(field.default_value) : '';
      const result = meta ? evaluateFormula(formulaStr, meta) : '—';
      return (
        <div className="rounded border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-xs text-slate-300 opacity-70">
          {result}
        </div>
      );
    }
    default:
      return (
        <input
          type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
          value={String(value ?? '')}
          readOnly={readOnly}
          onChange={e => onChange(e.target.value)}
          placeholder={field.label[lang as keyof I18nLabel] || field.meta_key}
          style={colorStyle}
          className={`w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none ${readOnlyClass}`}
        />
      );
  }
}

// ─── Repeating Group Editor ──────────────────────────
function GroupEditor({
  group, groupFields, values, lang, addRowLabel, onChange,
}: {
  group: FieldGroup; groupFields: GlobalField[];
  values: Record<string, unknown>[]; lang: string;
  addRowLabel: string;
  onChange: (vals: Record<string, unknown>[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const addRow = () => {
    const empty: Record<string, unknown> = {};
    for (const ref of group.field_refs) empty[ref] = '';
    onChange([...values, empty]);
  };

  const updateRow = (idx: number, field: string, val: unknown) => {
    const updated = values.map((row, i) => i === idx ? { ...row, [field]: val } : row);
    onChange(updated);
  };

  const removeRow = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.03]"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {group.label[lang as keyof I18nLabel] || group.meta_key}
        <span className="text-[10px] text-slate-500 ms-1">({values.length})</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {values.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-start rounded bg-white/[0.02] p-2 relative group">
              <div className="flex-1 grid grid-cols-2 gap-2">
                {group.field_refs.map(ref => (
                  <div key={ref}>
                    <label className="text-[9px] text-slate-500">{ref}</label>
                    <input
                      type="text"
                      value={String(row[ref] ?? '')}
                      onChange={e => updateRow(idx, ref, e.target.value)}
                      className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-1 text-[11px] text-slate-200 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => removeRow(idx)}
                className="shrink-0 mt-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={addRow}
            className="text-[10px] text-purple-400 hover:text-purple-300"
          >
            + {addRowLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Visibility & Color Rule Evaluation ─────────────
function evaluateCondition(operator: string, fieldValue: unknown, ruleValue?: string): boolean {
  const strVal = fieldValue != null ? String(fieldValue) : '';
  switch (operator) {
    case 'empty': return !strVal;
    case 'not_empty': return !!strVal;
    case 'eq': return strVal === (ruleValue ?? '');
    case 'neq': return strVal !== (ruleValue ?? '');
    case 'contains': return strVal.includes(ruleValue ?? '');
    case 'gt': return Number(strVal) > Number(ruleValue ?? 0);
    case 'lt': return Number(strVal) < Number(ruleValue ?? 0);
    case 'length_lt': return strVal.length < Number(ruleValue ?? 0);
    case 'length_gt': return strVal.length > Number(ruleValue ?? 0);
    default: return true;
  }
}

function isFieldVisible(field: GlobalField, meta: Record<string, unknown>): boolean {
  const rules = field.visibility_rules;
  if (!rules || rules.length === 0) return true;
  return rules.every(rule => evaluateCondition(rule.operator, meta[rule.field_ref], rule.value));
}

function getFieldColor(field: GlobalField, value: unknown): string | null {
  const rules = field.color_rules;
  if (!rules || rules.length === 0) return null;
  for (const rule of rules) {
    if (evaluateCondition(rule.operator, value, rule.value)) return rule.color;
  }
  return null;
}

export function NoteMeta({ noteId, entityType, meta, onMetaChange, hideSidebar, columns = 2 }: Props) {
  const { language } = useSettings();
  const { user, permissions } = useAuth();
  const t = getTranslations(language);
  const isRtl = language === 'he';
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
  const te = t.entities;

  const [fields, setFields] = useState<GlobalField[]>([]);
  const [allFields, setAllFields] = useState<GlobalField[]>([]);
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [etInfo, setEtInfo] = useState<EntityType | null>(null);
  const [relations, setRelations] = useState<NoteRelation[]>([]);
  const [linkedNotes, setLinkedNotes] = useState<Record<string, NoteRecord>>({});
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<NoteRecord[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [visibleFieldKeys, setVisibleFieldKeys] = useState<Set<string> | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load fields for this entity type + check stakeholder visible_fields for RBAC
  useEffect(() => {
    (async () => {
      const [allF, types, allGroups] = await Promise.all([
        fetchGlobalFields(),
        fetchEntityTypes(),
        fetchFieldGroups(),
      ]);
      setAllFields(allF);
      if (entityType) {
        const et = types.find(t => t.slug === entityType);
        if (et) {
          setEtInfo(et);
          // Always include universal fields (status, assignee, priority) + type-specific fields
          const universalSet = new Set<string>(UNIVERSAL_FIELD_KEYS);
          let filteredFields = allF.filter(f => et.field_refs.includes(f.meta_key) || universalSet.has(f.meta_key));
          // Sort: universal fields first, then type-specific in original order
          filteredFields.sort((a, b) => {
            const aUniv = universalSet.has(a.meta_key) ? 0 : 1;
            const bUniv = universalSet.has(b.meta_key) ? 0 : 1;
            if (aUniv !== bUniv) return aUniv - bUniv;
            return 0; // preserve original order within each group
          });

          // RBAC: if user is external/viewer, check stakeholder visible_fields
          if (user && (permissions.role === 'external' || permissions.role === 'viewer')) {
            const stakeholders = await fetchStakeholders(noteId);
            const myStakeholder = stakeholders.find(s => s.contact_note_id === user.id);
            if (myStakeholder && myStakeholder.visible_fields.length > 0) {
              const allowed = new Set(myStakeholder.visible_fields);
              setVisibleFieldKeys(allowed);
              filteredFields = filteredFields.filter(f => allowed.has(f.meta_key));
            }
          }

          setFields(filteredFields);
          setGroups(allGroups.filter(g => et.group_refs.includes(g.meta_key)));
        }
      }
    })();
  }, [entityType, noteId, user, permissions.role]);

  // Load relations + linked note info
  const loadRelations = useCallback(async () => {
    const rels = await fetchNoteRelations(noteId);
    setRelations(rels);
    // Fetch linked note titles + entity_types
    const linkedIds = rels.map(r => r.source_id === noteId ? r.target_id : r.source_id);
    if (linkedIds.length > 0) {
      const info = await fetchNoteInfoBatch(linkedIds);
      const map: Record<string, NoteRecord> = {};
      for (const [id, val] of Object.entries(info)) {
        map[id] = { id, title: val.title, entity_type: val.entity_type, created_by: null } as NoteRecord;
      }
      setLinkedNotes(map);
    }
  }, [noteId]);

  useEffect(() => { loadRelations(); }, [loadRelations]);

  const trackActivity = etInfo?.template_config?.track_activity ?? false;

  const handleFieldChange = useCallback(async (metaKey: string, value: unknown) => {
    const newMeta = { ...meta, [metaKey]: value };
    onMetaChange(newMeta);
    setSavingField(metaKey);
    setSaveError(null);
    const ok = await updateNoteMeta(noteId, { [metaKey]: value }, { trackActivity });
    setSavingField(null);
    if (!ok) {
      setSaveError(metaKey);
      setTimeout(() => setSaveError(null), 3000);
    }
  }, [noteId, meta, onMetaChange, trackActivity]);

  const handleGroupChange = useCallback(async (groupKey: string, values: Record<string, unknown>[]) => {
    const newMeta = { ...meta, [groupKey]: values };
    onMetaChange(newMeta);
    setSavingField(groupKey);
    setSaveError(null);
    const ok = await updateNoteMeta(noteId, { [groupKey]: values });
    setSavingField(null);
    if (!ok) {
      setSaveError(groupKey);
      setTimeout(() => setSaveError(null), 3000);
    }
  }, [noteId, meta, onMetaChange]);

  const handleLinkSearch = useCallback(async (q: string) => {
    setLinkQuery(q);
    if (q.length < 2) { setLinkResults([]); return; }
    const results = await searchNotes(q);
    setLinkResults(results.filter(r => r.id !== noteId));
  }, [noteId]);

  const handleLink = useCallback(async (targetId: string) => {
    await createNoteRelation(noteId, targetId);
    await loadRelations();
    setShowLinkSearch(false);
    setLinkQuery('');
    setLinkResults([]);
  }, [noteId, loadRelations]);

  const handleUnlink = useCallback(async (relationId: string) => {
    await deleteNoteRelation(relationId);
    await loadRelations();
  }, [loadRelations]);

  if (!entityType || fields.length === 0) return null;

  return (
    <div
      data-cc-id="note-meta"
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.03] transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {etInfo && <span>{etInfo.icon}</span>}
        <span>{etInfo?.label[lang] || entityType}</span>
        <span className="text-[10px] text-slate-500 ms-auto">{fields.length} {te.fields}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04]">
          {/* Action buttons */}
          {etInfo?.template_config?.action_buttons && etInfo.template_config.action_buttons.length > 0 && (
            <NoteActions
              note={{
                id: noteId, title: '', content: null, record_type: '',
                entity_type: entityType, meta, status: (meta.status as string) ?? 'active',
                source: '', is_deleted: false, created_by: null, created_at: '', last_edited_at: '',
              }}
              entityType={entityType!}
              templateConfig={etInfo.template_config}
              language={language}
              fields={fields}
              allNotes={[]}
              onRefresh={() => onMetaChange({ ...meta })}
            />
          )}

          {/* Meta fields — template sections or flat grid */}
          {etInfo?.template_config?.layout.sections && etInfo.template_config.layout.sections.length > 0 ? (
            // Template-driven sectioned layout
            <>
              {etInfo.template_config.layout.sections.map(section => {
                const sectionFields = fields.filter(f => section.field_refs.includes(f.meta_key));
                if (sectionFields.length === 0) return null;
                const cols = columns ?? etInfo.template_config?.layout.meta_columns ?? 2;
                const gridClass = cols === 1 ? 'grid-cols-1'
                  : cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                  : 'grid-cols-1 md:grid-cols-2';
                return (
                  <div key={section.key} className="pt-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {section.label[lang] || section.key}
                    </h4>
                    <div className={`grid gap-3 ${gridClass}`}>
                      {sectionFields.filter(f => isFieldVisible(f, meta)).map(field => {
                        const fc = getFieldColor(field, meta[field.meta_key]);
                        return (
                          <div key={field.meta_key} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5" style={fc ? { borderColor: fc } : undefined}>
                            <label className="text-[10px] font-medium text-slate-400 mb-1.5 block flex items-center gap-1.5">
                              {field.label[lang] || field.meta_key}
                              {field.read_only && <Lock size={9} className="text-slate-600" />}
                              {savingField === field.meta_key && <Loader2 size={10} className="animate-spin text-slate-500" />}
                              {saveError === field.meta_key && <span className="text-[9px] text-red-400">{te.saveFailed}</span>}
                            </label>
                            <FieldEditor
                              field={field}
                              value={meta[field.meta_key]}
                              lang={lang}
                              onChange={val => handleFieldChange(field.meta_key, val)}
                              readOnly={field.read_only}
                              fieldColor={fc}
                              meta={meta}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            // Flat grid
            <div className={`grid gap-3 pt-3 ${
              columns === 1 ? 'grid-cols-1'
                : columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : columns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {fields.filter(f => isFieldVisible(f, meta)).map(field => {
                const fc = getFieldColor(field, meta[field.meta_key]);
                return (
                  <div key={field.meta_key} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5" style={fc ? { borderColor: fc } : undefined}>
                    <label className="text-[10px] font-medium text-slate-400 mb-1.5 block flex items-center gap-1.5">
                      {field.label[lang] || field.meta_key}
                      {field.read_only && <Lock size={9} className="text-slate-600" />}
                      {savingField === field.meta_key && <Loader2 size={10} className="animate-spin text-slate-500" />}
                      {saveError === field.meta_key && <span className="text-[9px] text-red-400">{te.saveFailed}</span>}
                    </label>
                    <FieldEditor
                      field={field}
                      value={meta[field.meta_key]}
                      lang={lang}
                      onChange={val => handleFieldChange(field.meta_key, val)}
                      readOnly={field.read_only}
                      fieldColor={fc}
                      meta={meta}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Repeating groups */}
          {groups.map(group => (
            <GroupEditor
              key={group.meta_key}
              group={group}
              groupFields={allFields.filter(f => group.field_refs.includes(f.meta_key))}
              values={Array.isArray(meta[group.meta_key]) ? meta[group.meta_key] as Record<string, unknown>[] : []}
              lang={lang}
              addRowLabel={te.addRow}
              onChange={vals => handleGroupChange(group.meta_key, vals)}
            />
          ))}

          {/* Relations */}
          <div className="border-t border-white/[0.04] pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                <Link2 size={10} />
                {te.linkedNotes} ({relations.length})
              </span>
              <button
                onClick={() => setShowLinkSearch(s => !s)}
                className="text-[10px] text-purple-400 hover:text-purple-300"
              >
                + {te.link}
              </button>
            </div>

            {showLinkSearch && (
              <div className="mb-2 space-y-1">
                <input
                  type="text"
                  value={linkQuery}
                  onChange={e => handleLinkSearch(e.target.value)}
                  placeholder={te.searchToLink}
                  className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  autoFocus
                />
                {linkResults.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded border border-white/[0.06] bg-slate-800">
                    {linkResults.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleLink(r.id)}
                        className="block w-full text-start px-2 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]"
                      >
                        {r.title}
                        {r.entity_type && (
                          <span className="text-[9px] text-slate-500 ms-1">({r.entity_type})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {relations.length > 0 && (
              <div className="space-y-1">
                {relations.map(rel => {
                  const linkedId = rel.source_id === noteId ? rel.target_id : rel.source_id;
                  const linked = linkedNotes[linkedId];
                  const linkedEt = linked?.entity_type;
                  const href = linkedEt
                    ? `/dashboard/entities/${linkedEt}/${linkedId}`
                    : `/dashboard/editor/${linkedId}`;
                  return (
                    <div key={rel.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.03] group">
                      <a
                        href={href}
                        className="text-xs text-purple-400 hover:text-purple-300 flex-1 truncate"
                      >
                        {linked?.title || linkedId}
                      </a>
                      {linkedEt && (
                        <span className="text-[9px] text-slate-600">{linkedEt}</span>
                      )}
                      <span className="text-[9px] text-slate-600">{rel.relation_type}</span>
                      <button
                        onClick={() => handleUnlink(rel.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stakeholders + Activity — hidden when detail page renders them in sidebar */}
          {!hideSidebar && (
            <>
              <StakeholderPanel noteId={noteId} />
              {trackActivity && (
                <ActivityFeed noteId={noteId} language={language} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
