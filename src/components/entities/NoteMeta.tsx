'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Link2, Plus, X, Loader2, Users } from 'lucide-react';
import { StakeholderPanel } from './StakeholderPanel';
import { ActivityFeed } from './ActivityFeed';
import { NoteActions } from './NoteActions';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchGlobalFields, fetchEntityTypes, updateNoteMeta,
  fetchNoteRelations, createNoteRelation, deleteNoteRelation,
  searchNotes, fetchFieldGroups,
} from '@/lib/supabase/entityQueries';
import type { GlobalField, EntityType, NoteRecord, NoteRelation, FieldGroup, I18nLabel, TemplateConfig, TemplateSection } from '@/lib/entities/types';

interface Props {
  noteId: string;
  entityType: string | null;
  meta: Record<string, unknown>;
  onMetaChange: (meta: Record<string, unknown>) => void;
}

// ─── Field Value Editor ──────────────────────────────
function FieldEditor({
  field, value, lang, onChange,
}: {
  field: GlobalField; value: unknown; lang: string;
  onChange: (val: unknown) => void;
}) {
  if (field.is_composite) {
    return (
      <div className="space-y-1.5">
        {field.sub_fields.map(sf => (
          <div key={sf.meta_key} className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 w-16 shrink-0">
              {sf.label[lang as keyof I18nLabel] || sf.meta_key}
            </label>
            <input
              type={sf.field_type === 'number' ? 'number' : sf.field_type === 'date' ? 'date' : 'text'}
              value={String((value as Record<string, unknown> | undefined)?.[sf.meta_key] ?? '')}
              onChange={e => {
                const current = (typeof value === 'object' && value) ? { ...value as Record<string, unknown> } : {};
                current[sf.meta_key] = e.target.value;
                onChange(current);
              }}
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
          onChange={e => onChange(e.target.value)}
          className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
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
          onChange={e => onChange(e.target.checked)}
          className="rounded border-white/20"
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={String(value ?? '')}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
        />
      );
    default:
      return (
        <input
          type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.label[lang as keyof I18nLabel] || field.meta_key}
          className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
        />
      );
  }
}

// ─── Repeating Group Editor ──────────────────────────
function GroupEditor({
  group, groupFields, values, lang, onChange,
}: {
  group: FieldGroup; groupFields: GlobalField[];
  values: Record<string, unknown>[]; lang: string;
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
            + {lang === 'he' ? 'הוסף שורה' : 'Add row'}
          </button>
        </div>
      )}
    </div>
  );
}

export function NoteMeta({ noteId, entityType, meta, onMetaChange }: Props) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const lang = isHe ? 'he' : 'en';
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

  // Load fields for this entity type
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
          setFields(allF.filter(f => et.field_refs.includes(f.meta_key)));
          setGroups(allGroups.filter(g => et.group_refs.includes(g.meta_key)));
        }
      }
    })();
  }, [entityType]);

  // Load relations
  useEffect(() => {
    (async () => {
      const rels = await fetchNoteRelations(noteId);
      setRelations(rels);
    })();
  }, [noteId]);

  const trackActivity = etInfo?.template_config?.track_activity ?? false;

  const handleFieldChange = useCallback(async (metaKey: string, value: unknown) => {
    const newMeta = { ...meta, [metaKey]: value };
    onMetaChange(newMeta);
    await updateNoteMeta(noteId, { [metaKey]: value }, { trackActivity });
  }, [noteId, meta, onMetaChange, trackActivity]);

  const handleGroupChange = useCallback(async (groupKey: string, values: Record<string, unknown>[]) => {
    const newMeta = { ...meta, [groupKey]: values };
    onMetaChange(newMeta);
    await updateNoteMeta(noteId, { [groupKey]: values });
  }, [noteId, meta, onMetaChange]);

  const handleLinkSearch = useCallback(async (q: string) => {
    setLinkQuery(q);
    if (q.length < 2) { setLinkResults([]); return; }
    const results = await searchNotes(q);
    setLinkResults(results.filter(r => r.id !== noteId));
  }, [noteId]);

  const handleLink = useCallback(async (targetId: string) => {
    await createNoteRelation(noteId, targetId);
    const rels = await fetchNoteRelations(noteId);
    setRelations(rels);
    setShowLinkSearch(false);
    setLinkQuery('');
    setLinkResults([]);
  }, [noteId]);

  const handleUnlink = useCallback(async (relationId: string) => {
    await deleteNoteRelation(relationId);
    const rels = await fetchNoteRelations(noteId);
    setRelations(rels);
  }, [noteId]);

  if (!entityType || fields.length === 0) return null;

  return (
    <div
      data-cc-id="note-meta"
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-4"
      dir={isHe ? 'rtl' : 'ltr'}
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
                source: '', is_deleted: false, created_at: '', last_edited_at: '',
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
                const cols = etInfo.template_config?.layout.meta_columns ?? 2;
                return (
                  <div key={section.key} className="pt-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {section.label[lang] || section.key}
                    </h4>
                    <div className={`grid gap-3 ${cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {sectionFields.map(field => (
                        <div key={field.meta_key}>
                          <label className="text-[10px] font-medium text-slate-400 mb-1 block">
                            {field.label[lang] || field.meta_key}
                          </label>
                          <FieldEditor
                            field={field}
                            value={meta[field.meta_key]}
                            lang={lang}
                            onChange={val => handleFieldChange(field.meta_key, val)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            // Flat grid (original behavior)
            <div className="grid grid-cols-2 gap-3 pt-3">
              {fields.map(field => (
                <div key={field.meta_key}>
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">
                    {field.label[lang] || field.meta_key}
                  </label>
                  <FieldEditor
                    field={field}
                    value={meta[field.meta_key]}
                    lang={lang}
                    onChange={val => handleFieldChange(field.meta_key, val)}
                  />
                </div>
              ))}
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
                  return (
                    <div key={rel.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.03] group">
                      <a
                        href={`/dashboard/editor/${linkedId}`}
                        className="text-xs text-purple-400 hover:text-purple-300 flex-1 truncate"
                      >
                        {linkedId}
                      </a>
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

          {/* Stakeholders */}
          <StakeholderPanel noteId={noteId} />

          {/* Activity Feed — only when template has tracking enabled */}
          {trackActivity && (
            <ActivityFeed noteId={noteId} language={language} />
          )}
        </div>
      )}
    </div>
  );
}
