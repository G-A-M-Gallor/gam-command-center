'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Maximize2, Minimize2, Network, Frame, History,
  Star, ExternalLink, Loader2, GripVertical,
  Plus, X, ChevronDown, FolderOpen, FileText,
  Layers, Puzzle, StickyNote, PenTool,
} from 'lucide-react';
import dynamic from 'next/dynamic';
const VCanvas = dynamic(
  () => import('@/components/vcanvas/VCanvas').then(m => ({ default: m.VCanvas })),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse rounded-lg bg-white/[0.03]" /> }
);
import { useRouter } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import type { I18nLabel } from '@/lib/entities/types';

// ─── Types ────────────────────────────────────────────

export interface CanvasBlock {
  id: string;
  type: 'folder' | 'field_group' | 'field' | 'plugin' | 'note';
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, unknown>;
}

interface RelationNode {
  id: string;
  title: string;
  entityType: string | null;
  icon: string;
}

interface HistoryEntry {
  id: string;
  noteId: string;
  title: string;
  entityType: string | null;
  visitedAt: string;
  bookmarked: boolean;
}

type ViewMode = 'frame' | 'graph' | 'history' | 'whiteboard';

interface Props {
  noteId: string;
  entityType: string;
  language: string;
  meta?: Record<string, unknown>;
  fields?: { meta_key: string; label: I18nLabel }[];
}

// ─── Storage helpers ─────────────────────────────────

const HISTORY_KEY = (noteId: string) => `cc-canvas-history-${noteId}`;

function loadHistory(noteId: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(noteId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistHistory(noteId: string, entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY(noteId), JSON.stringify(entries));
}

async function loadBlocksFromMeta(noteId: string): Promise<CanvasBlock[]> {
  const { data } = await supabase
    .from('vb_records')
    .select('meta')
    .eq('id', noteId)
    .single();
  const meta = (data?.meta as Record<string, unknown>) ?? {};
  return (meta.__canvas_blocks as CanvasBlock[]) ?? [];
}

async function saveBlocksToMeta(noteId: string, blocks: CanvasBlock[]): Promise<void> {
  const { data: current } = await supabase
    .from('vb_records')
    .select('meta')
    .eq('id', noteId)
    .single();
  const oldMeta = (current?.meta as Record<string, unknown>) ?? {};
  await supabase
    .from('vb_records')
    .update({ meta: { ...oldMeta, __canvas_blocks: blocks } })
    .eq('id', noteId);
}

// ─── Block Type Icons ────────────────────────────────

const BLOCK_TYPE_ICONS: Record<CanvasBlock['type'], React.ElementType> = {
  folder: FolderOpen,
  field: FileText,
  field_group: Layers,
  plugin: Puzzle,
  note: StickyNote,
};

// ─── Draggable Block ─────────────────────────────────

function DraggableBlock({
  block,
  onRemove,
  children,
}: {
  block: CanvasBlock;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: block.id });
  const Icon = BLOCK_TYPE_ICONS[block.type] ?? FileText;

  return (
    <div
      ref={setNodeRef}
      className={`absolute group rounded-lg border bg-slate-800/60 backdrop-blur-sm transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? 'border-purple-500/50 shadow-lg shadow-purple-500/10 z-50' : 'border-white/[0.08] hover:border-purple-500/30'
      }`}
      style={{
        left: block.x,
        top: block.y,
        width: block.w,
        height: block.h,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.8 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/[0.04]">
        <GripVertical size={10} className="text-slate-600 shrink-0" />
        <Icon size={11} className="text-slate-500 shrink-0" />
        <span className="text-[11px] text-slate-300 flex-1 truncate">{block.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all"
        >
          <X size={10} />
        </button>
      </div>
      <div className="p-2 overflow-auto" style={{ height: block.h - 30 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Block Content: Folder ───────────────────────────

function FolderBlockContent({ noteId, l }: { noteId: string; l: Record<string, string> }) {
  const [items, setItems] = useState<{ id: string; title: string; entityType: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('note_relations')
        .select('source_id, target_id')
        .or(`source_id.eq.${noteId},target_id.eq.${noteId}`);
      if (data && data.length > 0) {
        const ids = data.map(r => r.source_id === noteId ? r.target_id : r.source_id);
        const { data: notes } = await supabase
          .from('vb_records')
          .select('id, title, entity_type')
          .in('id', ids)
          .limit(20);
        setItems((notes || []).map(n => ({ id: n.id, title: n.title, entityType: n.entity_type })));
      } else {
        setItems([]);
      }
      setLoading(false);
    })();
  }, [noteId]);

  if (loading) return <Loader2 size={12} className="animate-spin text-slate-600" />;
  if (items.length === 0) return <span className="text-[10px] text-slate-600">{l.noLinked}</span>;
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <button
          key={item.id}
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/entities/${item.entityType || 'general'}/${item.id}`); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="block w-full text-start text-[10px] text-slate-400 hover:text-purple-300 truncate transition-colors"
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}

// ─── Block Content: Field ────────────────────────────

function FieldBlockContent({ config, meta }: { config: Record<string, unknown>; meta: Record<string, unknown> }) {
  const metaKey = config.metaKey as string | undefined;
  if (!metaKey) return <span className="text-[10px] text-slate-600 italic">—</span>;
  const value = meta[metaKey];
  if (value == null || value === '') return <span className="text-[10px] text-slate-600">—</span>;
  return <span className="text-[10px] text-slate-300">{String(value)}</span>;
}

// ─── Block Content Router ────────────────────────────

function BlockBody({
  block, noteId, meta, l,
}: {
  block: CanvasBlock;
  noteId: string;
  meta: Record<string, unknown>;
  l: Record<string, string>;
}) {
  switch (block.type) {
    case 'folder':
      return <FolderBlockContent noteId={noteId} l={l} />;
    case 'field':
      return <FieldBlockContent config={block.config} meta={meta} />;
    case 'field_group':
      return <span className="text-[10px] text-slate-600 italic">{l.fieldGroup}</span>;
    case 'plugin':
      return <span className="text-[10px] text-slate-600 italic">{l.comingSoon}</span>;
    case 'note':
      return <span className="text-[10px] text-slate-600 italic">{l.note}</span>;
    default:
      return null;
  }
}

// ─── Main Component ──────────────────────────────────

export function EntityCanvas({ noteId, entityType, language, meta = {}, fields = [] }: Props) {
  const router = useRouter();
  const { language: settingsLang } = useSettings();
  const lang: 'he' | 'en' | 'ru' = (language || settingsLang) === 'he' ? 'he' : (language || settingsLang) === 'ru' ? 'ru' : 'en';
  const t = getTranslations(lang);
  const l = t.entities.entityCanvas as Record<string, string>;
  const isRtl = lang === 'he';

  const [mode, setMode] = useState<ViewMode>('frame');
  const [expanded, setExpanded] = useState(false);
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [relations, setRelations] = useState<RelationNode[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const blockPickerRef = useRef<HTMLDivElement>(null);

  // Debounced save ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback((updated: CanvasBlock[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveBlocksToMeta(noteId, updated);
    }, 1000);
  }, [noteId]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Load blocks from Supabase
  useEffect(() => {
    setBlocksLoading(true);
    loadBlocksFromMeta(noteId).then(data => {
      setBlocks(data);
      setBlocksLoading(false);
    });
  }, [noteId]);

  // Load history from localStorage
  useEffect(() => {
    setHistory(loadHistory(noteId));
  }, [noteId]);

  // Load relations when switching to graph mode
  useEffect(() => {
    if (mode !== 'graph') return;
    (async () => {
      setLoadingGraph(true);
      const { data } = await supabase
        .from('note_relations')
        .select('id, source_id, target_id, relation_type')
        .or(`source_id.eq.${noteId},target_id.eq.${noteId}`);

      if (data && data.length > 0) {
        const relatedIds = data.map(r =>
          r.source_id === noteId ? r.target_id : r.source_id
        );
        const { data: notes } = await supabase
          .from('vb_records')
          .select('id, title, entity_type, meta')
          .in('id', relatedIds);

        setRelations((notes || []).map(n => ({
          id: n.id,
          title: n.title,
          entityType: n.entity_type,
          icon: (n.meta as Record<string, unknown>)?.__icon as string || '📄',
        })));
      } else {
        setRelations([]);
      }
      setLoadingGraph(false);
    })();
  }, [mode, noteId]);

  // Close block picker on outside click
  useEffect(() => {
    if (!showBlockPicker && !showFieldPicker) return;
    const handler = (e: MouseEvent) => {
      if (blockPickerRef.current && !blockPickerRef.current.contains(e.target as Node)) {
        setShowBlockPicker(false);
        setShowFieldPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBlockPicker, showFieldPicker]);

  // DnD handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const blockId = active.id as string;
    setBlocks(prev => {
      const updated = prev.map(b =>
        b.id === blockId
          ? { ...b, x: Math.max(0, b.x + delta.x), y: Math.max(0, b.y + delta.y) }
          : b
      );
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // Add block
  const addBlock = useCallback((type: CanvasBlock['type'], label: string, config: Record<string, unknown> = {}) => {
    const newBlock: CanvasBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      x: 20 + blocks.length * 20,
      y: 20 + blocks.length * 20,
      w: 200,
      h: 120,
      config,
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    debouncedSave(updated);
    setShowBlockPicker(false);
    setShowFieldPicker(false);
  }, [blocks, debouncedSave]);

  const removeBlock = useCallback((blockId: string) => {
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    debouncedSave(updated);
  }, [blocks, debouncedSave]);

  // Navigate to a related entity and log it
  const navigateTo = useCallback((node: RelationNode) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      noteId: node.id,
      title: node.title,
      entityType: node.entityType,
      visitedAt: new Date().toISOString(),
      bookmarked: false,
    };
    const updated = [entry, ...history].slice(0, 100);
    setHistory(updated);
    persistHistory(noteId, updated);
    router.push(`/dashboard/entities/${node.entityType || entityType}/${node.id}`);
  }, [history, noteId, entityType, router]);

  const toggleBookmark = useCallback((entryId: string) => {
    const updated = history.map(h =>
      h.id === entryId ? { ...h, bookmarked: !h.bookmarked } : h
    );
    setHistory(updated);
    persistHistory(noteId, updated);
  }, [history, noteId]);

  const containerHeight = expanded ? 'h-[600px]' : 'h-[320px]';

  const BLOCK_TYPES: { key: CanvasBlock['type']; icon: React.ElementType }[] = [
    { key: 'folder', icon: FolderOpen },
    { key: 'field', icon: FileText },
    { key: 'field_group', icon: Layers },
    { key: 'note', icon: StickyNote },
    { key: 'plugin', icon: Puzzle },
  ];

  const modeButtons: { key: ViewMode; icon: React.ElementType; label: string }[] = [
    { key: 'frame', icon: Frame, label: l.frame },
    { key: 'whiteboard', icon: PenTool, label: l.whiteboard },
    { key: 'graph', icon: Network, label: l.linkGraph },
    { key: 'history', icon: History, label: l.navLog },
  ];

  return (
    <div
      className="rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] bg-white/[0.02]">
        {modeButtons.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              mode === key
                ? 'bg-purple-600/20 text-purple-300'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}

        <div className="flex-1" />

        {mode === 'frame' && (
          <div className="relative" ref={blockPickerRef}>
            <button
              onClick={() => { setShowBlockPicker(p => !p); setShowFieldPicker(false); }}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-purple-400 hover:bg-purple-500/10 transition-colors"
            >
              <Plus size={12} />
              {l.addBlock}
              <ChevronDown size={10} />
            </button>

            {/* Block type picker */}
            {showBlockPicker && !showFieldPicker && (
              <div className="absolute top-full mt-1 end-0 z-50 w-44 rounded-lg border border-white/[0.08] bg-slate-800 p-1.5 shadow-xl">
                {BLOCK_TYPES.map(({ key, icon: BIcon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'field') {
                        setShowFieldPicker(true);
                      } else {
                        addBlock(key, l[key] || key);
                      }
                    }}
                    className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
                  >
                    <BIcon size={12} className="text-slate-500" />
                    {l[key] || key}
                  </button>
                ))}
              </div>
            )}

            {/* Field picker (for field blocks) */}
            {showFieldPicker && (
              <div className="absolute top-full mt-1 end-0 z-50 w-52 rounded-lg border border-white/[0.08] bg-slate-800 p-1.5 shadow-xl max-h-64 overflow-auto">
                <button
                  onClick={() => setShowFieldPicker(false)}
                  className="w-full flex items-center gap-1 rounded px-2 py-1 text-[10px] text-slate-500 hover:bg-white/[0.04] mb-1"
                >
                  ← {l.pickBlockType}
                </button>
                {fields.length === 0 ? (
                  <p className="px-2.5 py-2 text-[10px] text-slate-500">—</p>
                ) : (
                  fields.map(f => (
                    <button
                      key={f.meta_key}
                      onClick={() => addBlock('field', f.label[lang] || f.meta_key, { metaKey: f.meta_key })}
                      className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <FileText size={11} className="text-slate-500" />
                      {f.label[lang] || f.meta_key}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(e => !e)}
          className="rounded-md p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* ─── Frame View ─── */}
      {mode === 'frame' && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className={`relative ${containerHeight} overflow-auto bg-[radial-gradient(circle,_rgba(139,92,246,0.03)_1px,_transparent_1px)] bg-[length:24px_24px] transition-all duration-300`}
          >
            {blocksLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-slate-500" />
              </div>
            ) : blocks.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-slate-600 text-center max-w-xs">{l.emptyCanvas}</p>
              </div>
            ) : (
              blocks.map(block => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  onRemove={() => removeBlock(block.id)}
                >
                  <BlockBody block={block} noteId={noteId} meta={meta} l={l} />
                </DraggableBlock>
              ))
            )}
          </div>
        </DndContext>
      )}

      {/* ─── Graph View ─── */}
      {mode === 'graph' && (
        <div className={`relative ${containerHeight} overflow-auto transition-all duration-300`}>
          {loadingGraph ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-slate-500" />
            </div>
          ) : relations.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Network size={32} className="text-slate-700" />
              <p className="text-xs text-slate-600">{l.noRelations}</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-xl shadow-lg shadow-purple-500/10">
                  🎯
                </div>
                <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                  {relations.map(node => (
                    <button
                      key={node.id}
                      onClick={() => navigateTo(node)}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-slate-800/80 px-3 py-2 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                    >
                      <span className="text-sm">{node.icon}</span>
                      <div className="text-start min-w-0">
                        <p className="text-xs text-slate-300 truncate max-w-[140px]">{node.title}</p>
                        {node.entityType && (
                          <p className="text-[9px] text-slate-600">{node.entityType}</p>
                        )}
                      </div>
                      <ExternalLink size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Whiteboard View (Excalidraw) ─── */}
      {mode === 'whiteboard' && (
        <VCanvas
          persistenceKey={`entity_${noteId}`}
          context="entity"
          mode="vNote"
          language={lang as 'he' | 'en' | 'ru'}
          className={expanded ? 'h-[600px]' : 'h-[320px]'}
        />
      )}

      {/* ─── History View ─── */}
      {mode === 'history' && (
        <div className={`${containerHeight} overflow-auto transition-all duration-300`}>
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-slate-600">{l.emptyHistory}</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500">
                  <th className="px-3 py-2 text-start font-medium">⭐</th>
                  <th className="px-3 py-2 text-start font-medium">{l.title}</th>
                  <th className="px-3 py-2 text-start font-medium">{l.type}</th>
                  <th className="px-3 py-2 text-start font-medium">{l.time}</th>
                  <th className="px-3 py-2 text-start font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleBookmark(entry.id)}
                        className={`transition-colors ${entry.bookmarked ? 'text-amber-400' : 'text-slate-700 hover:text-slate-400'}`}
                      >
                        <Star size={12} fill={entry.bookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-slate-300 max-w-[200px] truncate">{entry.title}</td>
                    <td className="px-3 py-2 text-slate-500">{entry.entityType || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {new Date(entry.visitedAt).toLocaleTimeString(isRtl ? 'he-IL' : 'en-US', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => router.push(`/dashboard/entities/${entry.entityType || entityType}/${entry.noteId}`)}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
