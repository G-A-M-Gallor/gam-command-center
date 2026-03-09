'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, Table2, Kanban, List, Calendar as CalendarIcon,
  ArrowUpDown, SlidersHorizontal, ChevronDown, X,
  GanttChart, Clock, Eye, EyeOff, Bookmark, Save, Trash2,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchEntityTypes, fetchGlobalFields, fetchNotes, createNote,
  fetchFieldGroups, deactivateNote, reactivateNote,
} from '@/lib/supabase/entityQueries';
import { TableView } from '@/components/entities/views/TableView';
import { BoardView } from '@/components/entities/views/BoardView';
import { ListView } from '@/components/entities/views/ListView';
import { CalendarView } from '@/components/entities/views/CalendarView';
import { GanttView } from '@/components/entities/views/GanttView';
import { TimelineView } from '@/components/entities/views/TimelineView';
import { EntityActionBar } from '@/components/entities/EntityActionBar';
import { useToast } from '@/contexts/ToastContext';
import type { EntityType, GlobalField, NoteRecord, ViewType, ViewFilter, ViewSort, FieldGroup, SavedView } from '@/lib/entities/types';

const VIEW_ICONS: Record<ViewType, React.ElementType> = {
  table: Table2,
  board: Kanban,
  list: List,
  calendar: CalendarIcon,
  gantt: GanttChart,
  timeline: Clock,
};

const SAVED_VIEWS_KEY = 'cc-saved-views';

function loadSavedViews(entitySlug: string): SavedView[] {
  try {
    const raw = localStorage.getItem(`${SAVED_VIEWS_KEY}-${entitySlug}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistSavedViews(entitySlug: string, views: SavedView[]) {
  localStorage.setItem(`${SAVED_VIEWS_KEY}-${entitySlug}`, JSON.stringify(views));
}

export default function EntityViewPage() {
  const params = useParams();
  const router = useRouter();
  const entitySlug = params.type as string;

  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const te = t.entities;
  const lang = isHe ? 'he' : 'en';

  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [fields, setFields] = useState<GlobalField[]>([]);
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('table');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ViewFilter[]>([]);
  const [sort, setSort] = useState<ViewSort | undefined>();
  const [page, setPage] = useState(0);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [savingViewName, setSavingViewName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const pageSize = 50;

  // Load entity type + fields
  useEffect(() => {
    (async () => {
      const [types, allFields, allGroups] = await Promise.all([
        fetchEntityTypes(),
        fetchGlobalFields(),
        fetchFieldGroups(),
      ]);
      const et = types.find(t => t.slug === entitySlug);
      if (et) {
        setEntityType(et);
        setView(et.default_view);
        // Get only the fields this entity uses
        const etFields = allFields.filter(f => et.field_refs.includes(f.meta_key));
        setFields(etFields);
        const etGroups = allGroups.filter(g => et.group_refs.includes(g.meta_key));
        setGroups(etGroups);
      }
    })();
  }, [entitySlug]);

  // Load notes
  const loadNotes = useCallback(async () => {
    if (!entityType) return;
    setLoading(true);
    const result = await fetchNotes(entitySlug, filters, sort, page, pageSize);
    setNotes(result.data);
    setTotalCount(result.count);
    setLoading(false);
  }, [entitySlug, entityType, filters, sort, page]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Available views for this entity type
  const availableViews = useMemo(() => {
    if (entityType?.template_config?.available_views) {
      return entityType.template_config.available_views;
    }
    return ['table', 'board', 'list', 'calendar'] as ViewType[];
  }, [entityType]);

  // Close saved views dropdown on outside click
  const savedViewsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showSavedViews) return;
    const handler = (e: MouseEvent) => {
      if (savedViewsRef.current && !savedViewsRef.current.contains(e.target as Node)) {
        setShowSavedViews(false);
        setShowSaveInput(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSavedViews]);

  // Load saved views from localStorage
  useEffect(() => {
    setSavedViews(loadSavedViews(entitySlug));
    setActiveViewId(null);
  }, [entitySlug]);

  const handleSaveView = useCallback(() => {
    if (!savingViewName.trim()) return;
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name: savingViewName.trim(),
      view,
      filters,
      sort,
      showInactive,
    };
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    persistSavedViews(entitySlug, updated);
    setActiveViewId(newView.id);
    setSavingViewName('');
    setShowSaveInput(false);
    toast({ message: te.viewSaved, type: 'success' });
  }, [savingViewName, view, filters, sort, showInactive, savedViews, entitySlug, toast, te]);

  const handleLoadView = useCallback((sv: SavedView) => {
    setView(sv.view);
    setFilters(sv.filters);
    setSort(sv.sort);
    setShowInactive(sv.showInactive);
    setActiveViewId(sv.id);
    setShowSavedViews(false);
    setPage(0);
  }, []);

  const handleDeleteView = useCallback((id: string) => {
    const updated = savedViews.filter(v => v.id !== id);
    setSavedViews(updated);
    persistSavedViews(entitySlug, updated);
    if (activeViewId === id) setActiveViewId(null);
    toast({ message: te.viewDeleted, type: 'info' });
  }, [savedViews, entitySlug, activeViewId, toast, te]);

  // Clear active view when user changes filters/sort manually
  const activeView = savedViews.find(v => v.id === activeViewId);
  useEffect(() => {
    if (!activeView) return;
    const filtersMatch = JSON.stringify(activeView.filters) === JSON.stringify(filters);
    const sortMatch = JSON.stringify(activeView.sort) === JSON.stringify(sort);
    if (!filtersMatch || !sortMatch || activeView.view !== view || activeView.showInactive !== showInactive) {
      setActiveViewId(null);
    }
  }, [filters, sort, view, showInactive, activeView]);

  // Search + inactive filter
  const filteredNotes = useMemo(() => {
    let result = notes;
    // Filter inactive unless showInactive is on
    if (!showInactive) {
      result = result.filter(n => n.status !== 'inactive');
    }
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(n => {
      if (n.title.toLowerCase().includes(q)) return true;
      for (const v of Object.values(n.meta)) {
        if (typeof v === 'string' && v.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [notes, search, showInactive]);

  const handleCreateNote = async () => {
    if (!entityType) return;
    // Build default meta from field defaults
    const defaultMeta: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.default_value !== null && f.default_value !== undefined) {
        defaultMeta[f.meta_key] = f.default_value;
      }
    }
    const note = await createNote(
      isHe ? `${entityType.label.he} חדש` : `New ${entityType.label.en}`,
      entitySlug,
      defaultMeta,
    );
    if (note) {
      await loadNotes();
    }
  };

  const handleUpdateNote = useCallback(async () => {
    await loadNotes();
  }, [loadNotes]);

  const addFilter = (field: string) => {
    setFilters(f => [...f, { field, operator: 'eq', value: '' }]);
  };

  const removeFilter = (idx: number) => {
    setFilters(f => f.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx: number, patch: Partial<ViewFilter>) => {
    setFilters(f => f.map((fi, i) => i === idx ? { ...fi, ...patch } : fi));
  };

  if (!entityType) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-500">
        {loading ? te.loading : te.entityNotFound}
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{entityType.icon}</span>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              {entityType.label[lang] || entityType.slug}
            </h1>
            <p className="text-xs text-slate-500">
              {totalCount} {te.records}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
            {availableViews.map(v => {
              const Icon = VIEW_ICONS[v];
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-2 transition-colors ${view === v ? 'bg-purple-600/30 text-purple-300' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'}`}
                  title={te.views?.[v] ?? v}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>

          {/* Active/Inactive toggle */}
          <button
            onClick={() => setShowInactive(s => !s)}
            className={`p-2 rounded-lg border transition-colors ${showInactive ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-white/[0.08] text-slate-500 hover:text-slate-300'}`}
            title={showInactive ? (isHe ? 'הסתר לא פעילים' : 'Hide inactive') : (isHe ? 'הצג לא פעילים' : 'Show inactive')}
          >
            {showInactive ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>

          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
          >
            <Plus size={14} />
            {te.newNote}
          </button>
        </div>
      </div>

      {/* Search + Filters toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={te.searchNotes}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] ps-9 pe-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowFilterPanel(p => !p)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            filters.length > 0
              ? 'border-purple-500/40 text-purple-300 bg-purple-500/10'
              : 'border-white/[0.08] text-slate-400 hover:bg-white/[0.04]'
          }`}
        >
          <Filter size={14} />
          {te.filter}
          {filters.length > 0 && <span className="text-[10px]">({filters.length})</span>}
        </button>

        {/* Saved views dropdown */}
        <div className="relative" ref={savedViewsRef}>
          <button
            onClick={() => setShowSavedViews(p => !p)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              activeViewId
                ? 'border-purple-500/40 text-purple-300 bg-purple-500/10'
                : 'border-white/[0.08] text-slate-400 hover:bg-white/[0.04]'
            }`}
          >
            <Bookmark size={14} />
            {activeView ? activeView.name : te.savedViews}
            <ChevronDown size={12} />
          </button>
          {showSavedViews && (
            <div className="absolute top-full mt-1 end-0 z-50 w-64 rounded-lg border border-white/[0.08] bg-slate-800 p-2 shadow-xl">
              {/* All records (reset) */}
              <button
                onClick={() => {
                  setFilters([]);
                  setSort(undefined);
                  setShowInactive(false);
                  setActiveViewId(null);
                  setShowSavedViews(false);
                  if (entityType) setView(entityType.default_view);
                }}
                className={`w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors ${
                  !activeViewId ? 'bg-purple-600/20 text-purple-300' : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {te.allRecords}
              </button>

              {/* Saved views list */}
              {savedViews.map(sv => (
                <div key={sv.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleLoadView(sv)}
                    className={`flex-1 flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-start transition-colors ${
                      activeViewId === sv.id ? 'bg-purple-600/20 text-purple-300' : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Bookmark size={11} />
                    <span className="truncate">{sv.name}</span>
                    <span className="ms-auto text-[10px] text-slate-500">
                      {(te.views as Record<string, string>)?.[sv.view] ?? sv.view}
                      {sv.filters.length > 0 && ` +${sv.filters.length}`}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteView(sv.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title={te.deleteView}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              {savedViews.length === 0 && (
                <p className="px-2.5 py-1.5 text-[11px] text-slate-500">{te.noSavedViews}</p>
              )}

              {/* Save current view */}
              <div className="mt-1.5 border-t border-white/[0.06] pt-1.5">
                {showSaveInput ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={savingViewName}
                      onChange={e => setSavingViewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveView()}
                      placeholder={te.viewName}
                      className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveView}
                      disabled={!savingViewName.trim()}
                      className="rounded bg-purple-600 px-2 py-1 text-[11px] text-white hover:bg-purple-500 disabled:opacity-40"
                    >
                      <Save size={11} />
                    </button>
                    <button
                      onClick={() => { setShowSaveInput(false); setSavingViewName(''); }}
                      className="p-1 text-slate-500 hover:text-slate-300"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="w-full flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-white/[0.04]"
                  >
                    <Save size={12} />
                    {te.saveView}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {sort && (
          <button
            onClick={() => setSort(undefined)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2 py-1.5 text-xs text-slate-400 hover:bg-white/[0.04]"
          >
            <ArrowUpDown size={12} />
            {sort.field} {sort.direction}
            <X size={10} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={f.field}
                onChange={e => updateFilter(i, { field: e.target.value })}
                className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
              >
                {fields.map(fd => (
                  <option key={fd.meta_key} value={fd.meta_key}>{fd.label[lang] || fd.meta_key}</option>
                ))}
              </select>
              <select
                value={f.operator}
                onChange={e => updateFilter(i, { operator: e.target.value as ViewFilter['operator'] })}
                className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
              >
                <option value="eq">=</option>
                <option value="neq">≠</option>
                <option value="contains">{te.contains}</option>
                <option value="is_empty">{te.isEmpty}</option>
                <option value="is_not_empty">{te.isNotEmpty}</option>
              </select>
              {f.operator !== 'is_empty' && f.operator !== 'is_not_empty' && (
                <input
                  type="text"
                  value={String(f.value ?? '')}
                  onChange={e => updateFilter(i, { value: e.target.value })}
                  className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200"
                />
              )}
              <button onClick={() => removeFilter(i)} className="text-slate-500 hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => fields.length > 0 && addFilter(fields[0].meta_key)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            + {te.addFilter}
          </button>
        </div>
      )}

      {/* Action Bar */}
      {entityType?.template_config?.action_buttons && entityType.template_config.action_buttons.length > 0 && (
        <EntityActionBar
          selectedIds={selectedIds}
          notes={filteredNotes}
          entityType={entitySlug}
          templateConfig={entityType.template_config}
          language={language}
          fields={fields}
          onRefresh={loadNotes}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* View */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <>
          {view === 'table' && (
            <TableView
              notes={filteredNotes}
              fields={fields}
              groups={groups}
              sort={sort}
              onSort={setSort}
              onUpdate={handleUpdateNote}
              language={language}
              entityType={entitySlug}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
          {view === 'board' && (
            <BoardView
              notes={filteredNotes}
              fields={fields}
              onUpdate={handleUpdateNote}
              language={language}
              entityType={entitySlug}
            />
          )}
          {view === 'list' && (
            <ListView
              notes={filteredNotes}
              fields={fields}
              onUpdate={handleUpdateNote}
              language={language}
              entityType={entitySlug}
            />
          )}
          {view === 'calendar' && (
            <CalendarView
              notes={filteredNotes}
              fields={fields}
              language={language}
              entityType={entitySlug}
            />
          )}
          {view === 'gantt' && (
            <GanttView
              notes={filteredNotes}
              fields={fields}
              onUpdate={handleUpdateNote}
              language={language}
              ganttConfig={entityType?.template_config?.gantt_config}
            />
          )}
          {view === 'timeline' && (
            <TimelineView
              notes={filteredNotes}
              fields={fields}
              language={language}
              timelineConfig={entityType?.template_config?.timeline_config}
            />
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.04] disabled:opacity-30"
          >
            {te.prev}
          </button>
          <span className="text-xs text-slate-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.04] disabled:opacity-30"
          >
            {te.next}
          </button>
        </div>
      )}
    </div>
  );
}
