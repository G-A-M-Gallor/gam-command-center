'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Search,
  Maximize2,
  Minimize2,
  GripVertical,
  PanelLeftOpen,
  PanelRightOpen,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { Input } from '@/components/ui/Input';
import {
  fieldTypes,
  fieldCategories,
  getFieldsByCategory,
  getFieldType,
  type FieldTypeId,
  type FieldTypeDefinition,
} from './fieldTypes';
import {
  fetchFieldDefinitions,
  computeFieldUsage,
  type FieldDefinition,
  type FieldUsageInfo,
} from '@/lib/supabase/fieldQueries';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ───────────────────────────────────────────
type ViewMode = 'dropdown' | 'side-panel' | 'floating';
type CatalogTab = 'existing' | 'new';

interface FieldLibraryProps {
  onClose: () => void;
  sidebarPosition: 'left' | 'right';
  onFieldSelect?: (fieldType: FieldTypeId) => void;
  /** Anchor top position in px (default: 92 for EditToolbar context) */
  anchorTop?: number;
}

const STORAGE_KEY = 'cc-field-library-mode';
const FLOATING_POS_KEY = 'cc-field-library-float-pos';

// ─── Component ───────────────────────────────────────
export function FieldLibrary({ onClose, sidebarPosition, onFieldSelect, anchorTop = 92 }: FieldLibraryProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const fl = t.fieldLibrary;
  const [query, setQuery] = useState('');
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('existing');
  const [definitions, setDefinitions] = useState<FieldDefinition[]>([]);
  const [usageMap, setUsageMap] = useState<Map<string, FieldUsageInfo>>(new Map());
  const [loadingDefs, setLoadingDefs] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'dropdown';
    } catch {
      return 'dropdown';
    }
  });

  // Floating drag state
  const [floatPos, setFloatPos] = useState(() => {
    try {
      const raw = localStorage.getItem(FLOATING_POS_KEY);
      return raw ? JSON.parse(raw) : { x: 100, y: 140 };
    } catch {
      return { x: 100, y: 140 };
    }
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Load field definitions + usage on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingDefs(true);
      const defs = await fetchFieldDefinitions();
      if (cancelled) return;
      setDefinitions(defs);

      if (defs.length > 0) {
        const usage = await computeFieldUsage(defs.map((d) => d.id));
        if (cancelled) return;
        setUsageMap(usage);
      }
      setLoadingDefs(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Persist view mode
  const switchMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* */ }
  }, []);

  // Floating drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: floatPos.x, origY: floatPos.y };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const newPos = { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy };
      setFloatPos(newPos);
      try { localStorage.setItem(FLOATING_POS_KEY, JSON.stringify(newPos)); } catch { /* */ }
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [floatPos]);

  // Insert existing field directly (no config modal)
  const handleInsertExisting = useCallback((def: FieldDefinition) => {
    window.dispatchEvent(
      new CustomEvent('cc-insert-existing-field', {
        detail: {
          fieldId: def.id,
          fieldType: def.field_type,
          config: def.config,
          label: def.label,
        },
      })
    );
  }, []);

  // Edit field → dispatch cc-insert-field with existing config
  const handleEditField = useCallback((def: FieldDefinition) => {
    window.dispatchEvent(
      new CustomEvent('cc-edit-field', {
        detail: {
          fieldType: def.field_type,
          fieldId: def.id,
          config: def.config,
        },
      })
    );
  }, []);

  // Delete field (soft-delete)
  const handleDeleteField = useCallback(async (def: FieldDefinition) => {
    const usage = usageMap.get(def.id);
    const count = usage?.count || 0;
    const msg = fl.confirmDelete.replace('{count}', String(count));
    if (!confirm(msg)) return;

    await supabase
      .from('field_definitions')
      .update({ is_deleted: true })
      .eq('id', def.id);

    setDefinitions((prev) => prev.filter((d) => d.id !== def.id));
  }, [usageMap, fl.confirmDelete]);

  // Callback for when FieldConfigModal creates a new definition
  const handleDefinitionCreated = useCallback((newDef: {
    id: string;
    field_type: FieldTypeId;
    label: string;
    config: Record<string, unknown>;
    category: string;
  }) => {
    const full: FieldDefinition = {
      id: newDef.id,
      field_type: newDef.field_type,
      label: newDef.label,
      config: newDef.config,
      category: newDef.category,
      workspace_id: null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      last_edited_at: new Date().toISOString(),
    };
    setDefinitions((prev) => [full, ...prev]);
    // Switch to existing tab so user sees the new field
    setCatalogTab('existing');
  }, []);

  // Listen for new definitions created via FieldConfigModal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id && detail?.field_type) {
        handleDefinitionCreated(detail);
      }
    };
    window.addEventListener('cc-definition-created', handler);
    return () => window.removeEventListener('cc-definition-created', handler);
  }, [handleDefinitionCreated]);

  // Filter definitions by search query
  const filteredDefinitions = query.trim()
    ? definitions.filter((d) => {
        const q = query.toLowerCase();
        return d.label.toLowerCase().includes(q) || d.field_type.includes(q);
      })
    : definitions;

  // Filter field types for "new" tab
  const filteredTypes = query.trim()
    ? fieldTypes.filter((f) => {
        const q = query.toLowerCase();
        return (
          f.label.he.includes(q) ||
          f.label.en.toLowerCase().includes(q) ||
          f.description.he.includes(q) ||
          f.description.en.toLowerCase().includes(q) ||
          f.id.includes(q)
        );
      })
    : fieldTypes;

  // ── Tab bar ──────────────────────────────────────────
  const tabBar = (
    <div className="flex border-b border-slate-700/50">
      <button
        onClick={() => setCatalogTab('existing')}
        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
          catalogTab === 'existing'
            ? 'border-b-2 border-purple-500 text-purple-300'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {fl.existingFields}
        {definitions.length > 0 && (
          <span className="ms-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
            {definitions.length}
          </span>
        )}
      </button>
      <button
        onClick={() => setCatalogTab('new')}
        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
          catalogTab === 'new'
            ? 'border-b-2 border-purple-500 text-purple-300'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Plus className="mb-0.5 inline-block h-3 w-3" /> {fl.createNew}
      </button>
    </div>
  );

  // ── Existing fields tab content ──────────────────────
  const existingContent = (
    <div className="flex-1 overflow-y-auto">
      {loadingDefs ? (
        <div className="py-8 text-center text-xs text-slate-500">
          {language === 'he' ? '⏳ טוען...' : '⏳ Loading...'}
        </div>
      ) : filteredDefinitions.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-slate-500">
          {query.trim()
            ? (language === 'he' ? 'לא נמצאו שדות' : 'No fields found')
            : fl.noDefinitions}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 p-1">
          {filteredDefinitions.map((def) => {
            const typeDef = getFieldType(def.field_type);
            const Icon = typeDef?.icon;
            const usage = usageMap.get(def.id);
            const isExpanded = expandedRow === def.id;

            return (
              <div key={def.id} className="rounded-md hover:bg-slate-700/30">
                {/* Main row */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  {/* Click to insert */}
                  <button
                    onClick={() => handleInsertExisting(def)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-start"
                    title={fl.insertField}
                    dir="auto"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-700/50 text-slate-400">
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-slate-200">
                        {def.label}
                      </div>
                      <div className="truncate text-[10px] text-slate-500">
                        {typeDef?.label[language] || def.field_type}
                      </div>
                    </div>
                  </button>

                  {/* Usage count pill */}
                  {usage && usage.count > 0 && (
                    <button
                      onClick={() => setExpandedRow(isExpanded ? null : def.id)}
                      className="flex items-center gap-0.5 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400 hover:bg-purple-500/20"
                      title={fl.usageCount}
                    >
                      {usage.count}
                      {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                    </button>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => handleEditField(def)}
                    className="rounded p-1 text-slate-600 hover:bg-slate-700 hover:text-slate-300"
                    title={fl.editDefinition}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(def)}
                    className="rounded p-1 text-slate-600 hover:bg-slate-700 hover:text-red-400"
                    title={fl.deleteDefinition}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Expanded: usage details */}
                {isExpanded && usage && usage.documents.length > 0 && (
                  <div className="mx-2 mb-1.5 rounded-md bg-slate-800/80 px-3 py-2">
                    <div className="mb-1 text-[10px] font-medium text-slate-500">
                      {fl.usedIn}
                    </div>
                    {usage.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="truncate py-0.5 text-[11px] text-slate-400"
                        dir="auto"
                      >
                        {doc.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── New field tab content (original type picker) ─────
  const newFieldContent = (
    <div className="flex-1 overflow-y-auto px-1 pb-2">
      {query.trim() ? (
        <div className="flex flex-col gap-0.5 px-2">
          {filteredTypes.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              {language === 'he' ? 'לא נמצאו שדות' : 'No fields found'}
            </div>
          )}
          {filteredTypes.map((field) => (
            <FieldTypeRow key={field.id} field={field} language={language} onSelect={onFieldSelect} />
          ))}
        </div>
      ) : (
        fieldCategories.map((cat) => {
          const items = getFieldsByCategory(cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id} className="mb-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {cat.label[language]}
              </div>
              <div className="flex flex-col gap-0.5 px-2">
                {items.map((field) => (
                  <FieldTypeRow key={field.id} field={field} language={language} onSelect={onFieldSelect} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── Inner content (shared across modes) ────────────
  const panelContent = (
    <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
      {/* Tab bar */}
      {tabBar}

      {/* Search */}
      <div className="px-3 py-2">
        <Input
          inputSize="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'he' ? 'חיפוש שדה...' : 'Search fields...'}
          dir="auto"
          iconStart={<Search className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Tab content */}
      {catalogTab === 'existing' ? existingContent : newFieldContent}
    </div>
  );

  // ── Panel header (shared) ──────────────────────────
  const panelHeader = (
    <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2">
      <span className="text-xs font-semibold text-slate-200">
        {fl.title}
      </span>
      <div className="flex items-center gap-1">
        {viewMode !== 'side-panel' && (
          <button
            onClick={() => switchMode('side-panel')}
            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
            title={language === 'he' ? 'הצג במצב מלא' : 'Side panel'}
          >
            {sidebarPosition === 'right' ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {viewMode === 'side-panel' && (
          <button
            onClick={() => switchMode('dropdown')}
            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
            title={language === 'he' ? 'מצב קטן' : 'Dropdown'}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        )}
        {viewMode !== 'floating' && (
          <button
            onClick={() => switchMode('floating')}
            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
            title={language === 'he' ? 'חלון צף' : 'Floating'}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // ── Dropdown mode ──────────────────────────────────
  if (viewMode === 'dropdown') {
    return (
      <>
        <button
          onClick={onClose}
          className="fixed inset-0 z-30"
          aria-label="close"
        />
        <div
          className="fixed z-40 w-72 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl"
          style={{
            top: anchorTop,
            ...(sidebarPosition === 'right'
              ? { right: 260 }
              : { left: 260 }),
          }}
        >
          {panelHeader}
          <div style={{ maxHeight: 480 }}>{panelContent}</div>
          <button
            onClick={() => switchMode('side-panel')}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-700/50 py-2 text-[11px] text-purple-400 hover:bg-slate-800"
          >
            {sidebarPosition === 'right' ? (
              <PanelLeftOpen className="h-3 w-3" />
            ) : (
              <PanelRightOpen className="h-3 w-3" />
            )}
            {fl.expandPanel}
          </button>
        </div>
      </>
    );
  }

  // ── Side-panel mode ────────────────────────────────
  if (viewMode === 'side-panel') {
    const panelSide = sidebarPosition === 'right' ? 'left' : 'right';
    return (
      <div
        className="fixed bottom-0 z-30 w-72 border-slate-700 bg-slate-800 shadow-xl"
        style={{
          top: anchorTop,
          [panelSide]: 0,
          borderLeftWidth: panelSide === 'right' ? 1 : 0,
          borderRightWidth: panelSide === 'left' ? 1 : 0,
        }}
      >
        {panelHeader}
        <div className="h-[calc(100%-40px)] overflow-hidden">{panelContent}</div>
      </div>
    );
  }

  // ── Floating mode ──────────────────────────────────
  return (
    <div
      className="fixed z-50 w-72 overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-2xl"
      style={{ left: floatPos.x, top: floatPos.y }}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-slate-700/50 bg-slate-800 px-3 py-2 active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3 w-3 text-slate-600" />
          <span className="text-xs font-semibold text-slate-200">
            {fl.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => switchMode('dropdown')}
            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          >
            <Minimize2 className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div style={{ maxHeight: 480 }} className="overflow-hidden">
        {panelContent}
      </div>
    </div>
  );
}

// ─── Field Type Row (for "New Field" tab) ────────────
function FieldTypeRow({
  field,
  language,
  onSelect,
}: {
  field: FieldTypeDefinition;
  language: 'he' | 'en';
  onSelect?: (fieldType: FieldTypeId) => void;
}) {
  const Icon = field.icon;

  const handleClick = () => {
    if (onSelect) onSelect(field.id);
    window.dispatchEvent(
      new CustomEvent('cc-insert-field', { detail: { fieldType: field.id } })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-purple-500/10"
      dir="auto"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-700/50 text-slate-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-slate-200">
          {field.label[language]}
        </div>
        <div className="truncate text-[10px] text-slate-500">
          {field.description[language]}
        </div>
      </div>
    </button>
  );
}
