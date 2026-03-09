'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search, GripVertical, ArrowRight, Link2 } from 'lucide-react';
import { PageHeader } from '@/components/command-center/PageHeader';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchEntityTypes, createEntityType, updateEntityType, deleteEntityType,
  fetchGlobalFields, fetchEntityConnections, createEntityConnection, deleteEntityConnection,
  fetchFieldGroups,
} from '@/lib/supabase/entityQueries';
import { BUILTIN_ENTITY_TYPES, BUILTIN_CONNECTIONS } from '@/lib/entities/builtinEntityTypes';
import { BUILTIN_FIELD_GROUPS } from '@/lib/entities/builtinFields';
import { ConnectionDiagram } from '@/components/entities/ConnectionDiagram';
import { TemplateEditor } from '@/components/entities/TemplateEditor';
import type { EntityType, EntityTypeInsert, EntityConnection, GlobalField, FieldGroup, ViewType, I18nLabel, TemplateConfig } from '@/lib/entities/types';

const VIEW_OPTIONS: ViewType[] = ['table', 'board', 'list', 'calendar', 'gantt', 'timeline'];
const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };

function newTypeDefaults(): EntityTypeInsert {
  return {
    slug: '',
    label: { ...EMPTY_LABEL },
    icon: '📄',
    color: '#94a3b8',
    field_refs: [],
    group_refs: [],
    default_view: 'table',
    sort_order: 0,
    template_config: null,
  };
}

export default function EntityTypesPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const te = t.entities;
  const lang = isHe ? 'he' : 'en';

  const [types, setTypes] = useState<EntityType[]>([]);
  const [connections, setConnections] = useState<EntityConnection[]>([]);
  const [fields, setFields] = useState<GlobalField[]>([]);
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EntityTypeInsert>(newTypeDefaults());
  const [showConnections, setShowConnections] = useState(false);
  const [connDraft, setConnDraft] = useState({ source: '', target: '', label: '', reverse: '' });
  const [editTab, setEditTab] = useState<'general' | 'template'>('general');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [typesData, connsData, fieldsData, groupsData] = await Promise.all([
      fetchEntityTypes(),
      fetchEntityConnections(),
      fetchGlobalFields(),
      fetchFieldGroups(),
    ]);

    // Seed if empty
    if (typesData.length === 0) {
      for (const et of BUILTIN_ENTITY_TYPES) await createEntityType(et);
      for (const conn of BUILTIN_CONNECTIONS) await createEntityConnection(conn);
      for (const g of BUILTIN_FIELD_GROUPS) {
        const { createFieldGroup } = await import('@/lib/supabase/entityQueries');
        await createFieldGroup(g);
      }
      const [t2, c2, g2] = await Promise.all([fetchEntityTypes(), fetchEntityConnections(), fetchFieldGroups()]);
      setTypes(t2);
      setConnections(c2);
      setGroups(g2);
    } else {
      setTypes(typesData);
      setConnections(connsData);
      setGroups(groupsData);
    }
    setFields(fieldsData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!search) return types;
    const q = search.toLowerCase();
    return types.filter(t => t.slug.includes(q) || (t.label[lang] ?? '').toLowerCase().includes(q));
  }, [types, search, lang]);

  const handleSave = async () => {
    if (!draft.slug.trim()) return;
    if (editingId) {
      await updateEntityType(editingId, draft);
    } else {
      await createEntityType(draft);
    }
    setShowCreate(false);
    setEditingId(null);
    setDraft(newTypeDefaults());
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteEntityType(id);
    await loadData();
  };

  const startEdit = (et: EntityType) => {
    setEditingId(et.id);
    setDraft({
      slug: et.slug,
      label: { ...et.label },
      icon: et.icon,
      color: et.color,
      field_refs: [...et.field_refs],
      group_refs: [...et.group_refs],
      default_view: et.default_view,
      template_config: et.template_config ?? null,
      sort_order: et.sort_order,
    });
    setEditTab('general');
    setShowCreate(true);
  };

  const toggleFieldRef = (metaKey: string) => {
    setDraft(d => ({
      ...d,
      field_refs: d.field_refs.includes(metaKey)
        ? d.field_refs.filter(k => k !== metaKey)
        : [...d.field_refs, metaKey],
    }));
  };

  const toggleGroupRef = (metaKey: string) => {
    setDraft(d => ({
      ...d,
      group_refs: d.group_refs.includes(metaKey)
        ? d.group_refs.filter(k => k !== metaKey)
        : [...d.group_refs, metaKey],
    }));
  };

  const handleAddConnection = async () => {
    if (!connDraft.source || !connDraft.target) return;
    await createEntityConnection({
      source_type: connDraft.source,
      target_type: connDraft.target,
      relation_label: { he: connDraft.label, en: connDraft.label, ru: connDraft.label },
      reverse_label: { he: connDraft.reverse, en: connDraft.reverse, ru: connDraft.reverse },
      relation_kind: 'many-to-many',
    });
    setConnDraft({ source: '', target: '', label: '', reverse: '' });
    await loadData();
  };

  return (
    <div className="space-y-6" dir={isHe ? 'rtl' : 'ltr'}>
      <PageHeader pageKey="entityTypes" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={te.searchTypes}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] ps-9 pe-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowConnections(c => !c)}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
        >
          <Link2 size={14} />
          {te.connections}
        </button>

        <button
          onClick={() => { setShowCreate(true); setEditingId(null); setDraft(newTypeDefaults()); }}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          <Plus size={14} />
          {te.newType}
        </button>
      </div>

      {/* Connection Diagram */}
      {showConnections && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <ConnectionDiagram
            types={types}
            connections={connections}
            language={language}
          />

          {/* Add connection */}
          <div className="mt-4 flex flex-wrap gap-2 items-center border-t border-white/[0.06] pt-3">
            <select
              value={connDraft.source}
              onChange={e => setConnDraft(d => ({ ...d, source: e.target.value }))}
              className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
            >
              <option value="">{te.sourceType}</option>
              {types.map(t => <option key={t.slug} value={t.slug}>{t.label[lang] || t.slug}</option>)}
            </select>
            <ArrowRight size={14} className="text-slate-500" />
            <select
              value={connDraft.target}
              onChange={e => setConnDraft(d => ({ ...d, target: e.target.value }))}
              className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
            >
              <option value="">{te.targetType}</option>
              {types.map(t => <option key={t.slug} value={t.slug}>{t.label[lang] || t.slug}</option>)}
            </select>
            <input
              type="text"
              value={connDraft.label}
              onChange={e => setConnDraft(d => ({ ...d, label: e.target.value }))}
              placeholder={te.relationLabel}
              className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 w-24"
            />
            <button
              onClick={handleAddConnection}
              disabled={!connDraft.source || !connDraft.target}
              className="rounded bg-purple-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-40"
            >
              {te.add}
            </button>
          </div>
        </div>
      )}

      {/* Entity Type List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/[0.03]" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(et => {
            const typeConns = connections.filter(c => c.source_type === et.slug || c.target_type === et.slug);
            return (
              <div
                key={et.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{et.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200">
                        {et.label[lang] || et.slug}
                      </span>
                      <code className="text-[10px] text-slate-500 bg-white/[0.04] px-1.5 rounded">
                        {et.slug}
                      </code>
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: et.color ?? '#94a3b8' }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {et.field_refs.map(ref => (
                        <span key={ref} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                          {ref}
                        </span>
                      ))}
                      {et.group_refs.map(ref => (
                        <span key={ref} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                          ↻ {ref}
                        </span>
                      ))}
                    </div>
                    {typeConns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {typeConns.map(c => (
                          <span key={c.id} className="text-[10px] text-slate-500">
                            {c.source_type === et.slug ? `→ ${c.target_type}` : `← ${c.source_type}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`/dashboard/entities/${et.slug}`}
                      className="rounded p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                      title={te.viewNotes}
                    >
                      <ArrowRight size={13} />
                    </a>
                    <button
                      onClick={() => startEdit(et)}
                      className="rounded p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(et.id)}
                      className="rounded p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/[0.06]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto" dir={isHe ? 'rtl' : 'ltr'}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              {editingId ? te.editType : te.newType}
            </h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-white/[0.06] pb-2">
              <button
                onClick={() => setEditTab('general')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  editTab === 'general'
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isHe ? 'כללי' : language === 'ru' ? 'Общее' : 'General'}
              </button>
              <button
                onClick={() => setEditTab('template')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  editTab === 'template'
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isHe ? 'תבנית' : language === 'ru' ? 'Шаблон' : 'Template'}
              </button>
            </div>

            {editTab === 'general' ? (
              <div className="space-y-4">
                {/* Slug */}
                <div>
                  <label className="text-xs font-medium text-slate-400">{te.slug}</label>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={e => setDraft(d => ({ ...d, slug: e.target.value.replace(/[^a-z0-9_-]/g, '') }))}
                    placeholder="task, client, project..."
                    disabled={!!editingId}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                    dir="ltr"
                  />
                </div>

                {/* Labels */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400">{te.labelHe}</label>
                    <input
                      type="text" value={draft.label.he}
                      onChange={e => setDraft(d => ({ ...d, label: { ...d.label, he: e.target.value } }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200" dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">{te.labelEn}</label>
                    <input
                      type="text" value={draft.label.en}
                      onChange={e => setDraft(d => ({ ...d, label: { ...d.label, en: e.target.value } }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200" dir="ltr"
                    />
                  </div>
                </div>

                {/* Icon + Color + View */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-slate-400">{te.icon}</label>
                    <input
                      type="text" value={draft.icon}
                      onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">{te.color}</label>
                    <input
                      type="color" value={draft.color ?? '#94a3b8'}
                      onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                      className="mt-1 h-9 w-12 rounded border-0 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-slate-400">{te.defaultView}</label>
                    <select
                      value={draft.default_view}
                      onChange={e => setDraft(d => ({ ...d, default_view: e.target.value as ViewType }))}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                    >
                      {VIEW_OPTIONS.map(v => <option key={v} value={v}>{te.views?.[v] ?? v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Field selection */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">{te.selectFields}</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    {fields.map(f => (
                      <label key={f.meta_key} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.04] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.field_refs.includes(f.meta_key)}
                          onChange={() => toggleFieldRef(f.meta_key)}
                          className="rounded border-white/20"
                        />
                        <span className="text-xs text-slate-300">{f.label[lang] || f.meta_key}</span>
                        <code className="text-[9px] text-slate-500">{f.meta_key}</code>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group selection */}
                {groups.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">{te.selectGroups}</label>
                    <div className="space-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                      {groups.map(g => (
                        <label key={g.meta_key} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.04] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.group_refs.includes(g.meta_key)}
                            onChange={() => toggleGroupRef(g.meta_key)}
                            className="rounded border-white/20"
                          />
                          <span className="text-xs text-slate-300">{g.label[lang] || g.meta_key}</span>
                          <span className="text-[9px] text-slate-500">({g.field_refs.join(', ')})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Template tab */
              <TemplateEditor
                config={draft.template_config}
                fieldRefs={draft.field_refs}
                fields={fields}
                language={language}
                onChange={(tc: TemplateConfig) => setDraft(d => ({ ...d, template_config: tc }))}
              />
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreate(false); setEditingId(null); }}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:bg-white/[0.04]"
              >
                {te.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!draft.slug.trim()}
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
