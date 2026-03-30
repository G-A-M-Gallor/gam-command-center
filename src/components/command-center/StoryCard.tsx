'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  _Plus,
  Check,
  _X,
  StickyNote,
  GitBranch,
  FileText,
  Link2,
} from 'lucide-react';
import type { StoryCard as StoryCardType, SubStory, EnrichedEntityLink } from '@/lib/supabase/storyCardQueries';
import { StoryCardEntityLinker } from './StoryCardEntityLinker';

// ─── Color palette ──────────────────────────────────
const COLORS = [
  { id: 'slate', bg: 'bg-slate-600', dot: 'bg-slate-400' },
  { id: 'purple', bg: 'bg-purple-600', dot: 'bg-purple-400' },
  { id: 'blue', bg: 'bg-blue-600', dot: 'bg-blue-400' },
  { id: 'emerald', bg: 'bg-emerald-600', dot: 'bg-emerald-400' },
  { id: 'amber', bg: 'bg-amber-600', dot: 'bg-amber-400' },
  { id: 'red', bg: 'bg-red-600', dot: 'bg-red-400' },
  { id: 'cyan', bg: 'bg-cyan-600', dot: 'bg-cyan-400' },
  { id: 'rose', bg: 'bg-rose-600', dot: 'bg-rose-400' },
];

function getColorClasses(colorId: string | null) {
  return COLORS.find((c) => c.id === colorId) ?? null;
}

// ─── Estimation sizes ──────────────────────────────
const ESTIMATIONS = [
  { id: 'XS', bg: 'bg-emerald-500/20', text: 'text-emerald-400', points: 1 },
  { id: 'S', bg: 'bg-sky-500/20', text: 'text-sky-400', points: 2 },
  { id: 'M', bg: 'bg-amber-500/20', text: 'text-amber-400', points: 3 },
  { id: 'L', bg: 'bg-orange-500/20', text: 'text-orange-400', points: 5 },
  { id: 'XL', bg: 'bg-red-500/20', text: 'text-red-400', points: 8 },
] as const;

export { ESTIMATIONS };

function EstimationBadge({ estimation }: { estimation: string | null }) {
  if (!estimation) return null;
  const est = ESTIMATIONS.find((e) => e.id === estimation);
  if (!est) return null;
  return (
    <span className={`shrink-0 rounded px-1 py-px text-[9px] font-bold ${est.bg} ${est.text}`}>
      {est.id}
    </span>
  );
}

// ─── Props ──────────────────────────────────────────
interface StoryCardProps {
  card: StoryCardType;
  onUpdate: (id: string, updates: Partial<StoryCardType>) => void;
  onDelete: (id: string) => void;
  onOpenNote?: (card: StoryCardType) => void;
  linkedEntities?: EnrichedEntityLink[];
  onLinkEntity?: (storyCardId: string, entityNoteId: string) => void;
  onUnlinkEntity?: (linkId: string, storyCardId: string) => void;
  t: {
    storyPlaceholder: string;
    epicPlaceholder: string;
    deleteCard: string;
    subStories: string;
    addSub: string;
    subPlaceholder: string;
    colorPicker: string;
    noColor: string;
    notes: string;
    addNote: string;
    notePlaceholder: string;
    diagram: string;
    editDiagram: string;
    diagramPlaceholder: string;
    preview: string;
    save: string;
    estimation: string;
    noEstimation: string;
    openInEditor?: string;
    hasNote?: string;
    linkEntity?: string;
    linkedEntities?: string;
    searchEntity?: string;
    unlinkEntity?: string;
    noLinkedEntities?: string;
  };
}

// ─── Diagram Modal ──────────────────────────────────
function DiagramModal({
  initialDiagram,
  onSave,
  onCancel,
  _t,
}: {
  initialDiagram: string;
  onSave: (diagram: string) => void;
  onCancel: () => void;
  t: { editDiagram: string; diagramPlaceholder: string; preview: string; save: string };
}) {
  const [source, setSource] = useState(initialDiagram);
  const previewRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!source.trim()) {
      if (previewRef.current) previewRef.current.innerHTML = '';
      setRenderError(false);
      return;
    }

    let cancelled = false;
    const currentId = ++renderIdRef.current;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#7c3aed',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#6d28d9',
            lineColor: '#64748b',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
            background: '#0f172a',
            mainBkg: '#1e293b',
            nodeBorder: '#475569',
            clusterBkg: '#1e293b',
            clusterBorder: '#334155',
            titleColor: '#e2e8f0',
            edgeLabelBackground: '#1e293b',
          },
          securityLevel: 'strict',
          flowchart: { curve: 'basis', padding: 16 },
        });
        if (cancelled || currentId !== renderIdRef.current) return;
        const { svg } = await mermaid.render(`diagram-preview-${currentId}`, source);
        if (!cancelled && currentId === renderIdRef.current && previewRef.current) {
          previewRef.current.innerHTML = svg;
          setRenderError(false);
        }
      } catch {
        if (!cancelled && currentId === renderIdRef.current) {
          setRenderError(true);
          if (previewRef.current) previewRef.current.innerHTML = '';
        }
      }
    }

    const timer = setTimeout(render, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="mx-4 flex w-full max-w-3xl flex-col rounded-lg border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-medium text-slate-200">{t.editDiagram}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — split pane */}
        <div className="flex min-h-[320px] divide-x divide-slate-700">
          {/* Source editor */}
          <div className="flex w-1/2 flex-col">
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={t.diagramPlaceholder}
              className="flex-1 resize-none bg-transparent p-3 font-mono text-xs text-slate-300 outline-none placeholder:text-slate-600"
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          <div className="flex w-1/2 flex-col">
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {t.preview}
            </div>
            <div className="flex-1 overflow-auto p-3">
              {renderError ? (
                <div className="text-xs text-red-400/70">Invalid Mermaid syntax</div>
              ) : (
                <div ref={previewRef} className="flex justify-center [&_svg]:max-w-full" />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-700 px-4 py-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(source)}
            className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-500"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Epic Card (column header, not draggable) ───────
export function EpicCard({ card, onUpdate, onDelete, _t }: StoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [showColor, setShowColor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorClasses = getColorClasses(card.color);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== card.text) {
      onUpdate(card.id, { text: trimmed });
    } else {
      setText(card.text);
    }
  }, [text, card.id, card.text, onUpdate]);

  return (
    <div
      data-card-id={card.id}
      className={`group relative rounded-lg border px-3 py-2 ${
        colorClasses
          ? `${colorClasses.bg}/20 border-${colorClasses.id}-500/30`
          : 'border-slate-600/50 bg-slate-700/50'
      }`}
    >
      {/* Epic text */}
      {editing ? (
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') {
              setText(card.text);
              setEditing(false);
            }
          }}
          className="w-full rounded bg-slate-900/50 px-1 py-0.5 text-sm font-semibold text-slate-100 outline-none ring-1 ring-purple-500/50"
          placeholder={t.epicPlaceholder}
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className="cursor-text text-sm font-semibold text-slate-100"
        >
          {card.text}
        </div>
      )}

      {/* Actions — visible on hover */}
      <div className="absolute -top-2 end-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Color toggle */}
        <button
          type="button"
          onClick={() => setShowColor((v) => !v)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200"
          title={t.colorPicker}
          aria-label={t.colorPicker}
        >
          <div className={`h-3 w-3 rounded-full ${colorClasses?.dot ?? 'bg-slate-500'}`} />
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-red-400"
          title={t.deleteCard}
          aria-label={t.deleteCard}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Color picker dropdown */}
      {showColor && (
        <div className="mt-1.5 flex flex-wrap gap-1" role="listbox" aria-label={_t.colorPicker}>
          {/* No color option */}
          <button
            type="button"
            role="option"
            aria-selected={!card.color}
            onClick={() => {
              onUpdate(card.id, { color: null });
              setShowColor(false);
            }}
            className={`h-4 w-4 rounded-full border border-slate-500 ${!card.color ? 'ring-2 ring-purple-400' : ''}`}
            title={t.noColor}
            aria-label={t.noColor}
          >
            <X className="h-3 w-3 text-slate-500 mx-auto" />
          </button>
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={card.color === c.id}
              onClick={() => {
                onUpdate(card.id, { color: c.id });
                setShowColor(false);
              }}
              className={`h-4 w-4 rounded-full ${c.dot} ${card.color === c.id ? 'ring-2 ring-purple-400' : ''}`}
              aria-label={c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Feature Card (sortable, expandable B-layer) ────
interface FeatureCardProps {
  card: StoryCardType;
  onUpdate: (id: string, updates: Partial<StoryCardType>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
  t: {
    featurePlaceholder: string;
    deleteCard: string;
    colorPicker: string;
    noColor: string;
    estimation: string;
    noEstimation: string;
  };
}

export function FeatureCard({ card, onUpdate, onDelete, expanded, onToggle, _t }: FeatureCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [showColor, setShowColor] = useState(false);
  const [showEstimation, setShowEstimation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorClasses = getColorClasses(card.color);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== card.text) {
      onUpdate(card.id, { text: trimmed });
    } else {
      setText(card.text);
    }
  }, [text, card.id, card.text, onUpdate]);

  return (
    <div
      ref={setNodeRef}
      data-card-id={card.id}
      style={style}
      className={`group relative rounded-md border px-2 py-1.5 ${
        colorClasses
          ? `${colorClasses.bg}/15 border-${colorClasses.id}-500/25`
          : 'border-slate-600/40 bg-slate-700/40'
      } ${isDragging ? 'shadow-lg shadow-purple-500/10' : ''}`}
    >
      <div className="flex items-center gap-1">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 cursor-grab text-slate-600 hover:text-slate-400 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* Expand/collapse chevron */}
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-slate-500 transition-colors hover:text-slate-300"
          aria-label={expanded ? "Collapse" : "Expand"}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Color dot */}
        {colorClasses && (
          <div className={`h-2 w-2 shrink-0 rounded-full ${colorClasses.dot}`} />
        )}

        {/* Feature text */}
        {editing ? (
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') {
                setText(card.text);
                setEditing(false);
              }
            }}
            className="min-w-0 flex-1 rounded bg-slate-900/50 px-1 py-0.5 text-xs font-medium text-slate-100 outline-none ring-1 ring-purple-500/50"
            placeholder={t.featurePlaceholder}
          />
        ) : (
          <span
            onDoubleClick={() => setEditing(true)}
            className="flex-1 cursor-text truncate text-xs font-medium text-slate-200"
          >
            {card.text}
          </span>
        )}

        {/* Estimation badge */}
        <EstimationBadge estimation={card.estimation} />
      </div>

      {/* Hover actions */}
      <div className="absolute -top-2 end-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setShowEstimation((v) => !v)}
          className={`rounded bg-slate-700 px-1 py-0.5 text-[9px] font-bold ${
            card.estimation ? 'text-amber-400' : 'text-slate-400'
          } hover:text-slate-200`}
          title={t.estimation}
        >
          Est
        </button>
        <button
          type="button"
          onClick={() => setShowColor((v) => !v)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200"
          title={t.colorPicker}
          aria-label={t.colorPicker}
        >
          <div className={`h-3 w-3 rounded-full ${colorClasses?.dot ?? 'bg-slate-500'}`} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-red-400"
          title={t.deleteCard}
          aria-label={t.deleteCard}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Estimation picker */}
      {showEstimation && (
        <div className="mt-1 flex flex-wrap items-center gap-1 ps-6" role="listbox" aria-label={_t.estimation}>
          <button
            type="button"
            role="option"
            aria-selected={!card.estimation}
            onClick={() => {
              onUpdate(card.id, { estimation: null });
              setShowEstimation(false);
            }}
            className={`rounded px-1.5 py-0.5 text-[10px] ${!card.estimation ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            aria-label="Clear estimation"
          >
            <X className="inline h-2.5 w-2.5" />
          </button>
          {ESTIMATIONS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onUpdate(card.id, { estimation: e.id });
                setShowEstimation(false);
              }}
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                card.estimation === e.id
                  ? `${e.bg} ${e.text} ring-1 ring-current`
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {e.id}
            </button>
          ))}
        </div>
      )}

      {/* Color picker */}
      {showColor && (
        <div className="mt-1 flex flex-wrap gap-1 ps-6" role="listbox" aria-label={_t.colorPicker}>
          <button
            type="button"
            role="option"
            aria-selected={!card.color}
            onClick={() => {
              onUpdate(card.id, { color: null });
              setShowColor(false);
            }}
            className={`h-4 w-4 rounded-full border border-slate-500 ${!card.color ? 'ring-2 ring-purple-400' : ''}`}
            title={t.noColor}
            aria-label={t.noColor}
          >
            <X className="h-3 w-3 text-slate-500 mx-auto" />
          </button>
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={card.color === c.id}
              onClick={() => {
                onUpdate(card.id, { color: c.id });
                setShowColor(false);
              }}
              className={`h-4 w-4 rounded-full ${c.dot} ${card.color === c.id ? 'ring-2 ring-purple-400' : ''}`}
              aria-label={c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Story Card (sortable/draggable) ────────────────
export function StoryCard({ card, onUpdate, onDelete, onOpenNote, linkedEntities, onLinkEntity, onUnlinkEntity, _t }: StoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [showSubs, setShowSubs] = useState(false);
  const [newSub, setNewSub] = useState('');
  const [showColor, setShowColor] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showEstimation, setShowEstimation] = useState(false);
  const [notesText, setNotesText] = useState(card.notes || '');
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [showEntityLinker, setShowEntityLinker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorClasses = getColorClasses(card.color);
  const hasEntityLinks = (linkedEntities?.length ?? 0) > 0;

  // Sync notes text when card prop changes (realtime)
  useEffect(() => {
    setNotesText(card.notes || '');
  }, [card.notes]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== card.text) {
      onUpdate(card.id, { text: trimmed });
    } else {
      setText(card.text);
    }
  }, [text, card.id, card.text, onUpdate]);

  const toggleSub = useCallback(
    (subId: string) => {
      const updated = card.subs.map((s) =>
        s.id === subId ? { ...s, done: !s.done } : s
      );
      onUpdate(card.id, { subs: updated });
    },
    [card.id, card.subs, onUpdate]
  );

  const addSub = useCallback(() => {
    const trimmed = newSub.trim();
    if (!trimmed) return;
    const sub: SubStory = { id: crypto.randomUUID(), text: trimmed, done: false };
    onUpdate(card.id, { subs: [...card.subs, sub] });
    setNewSub('');
  }, [newSub, card.id, card.subs, onUpdate]);

  const deleteSub = useCallback(
    (subId: string) => {
      onUpdate(card.id, { subs: card.subs.filter((s) => s.id !== subId) });
    },
    [card.id, card.subs, onUpdate]
  );

  const commitNotes = useCallback(
    (value: string) => {
      if (value !== (card.notes || '')) {
        onUpdate(card.id, { notes: value });
      }
    },
    [card.id, card.notes, onUpdate]
  );

  const saveDiagram = useCallback(
    (diagram: string) => {
      onUpdate(card.id, { diagram });
      setShowDiagramModal(false);
    },
    [card.id, onUpdate]
  );

  const hasNotes = !!(card.notes && card.notes.trim());
  const hasDiagram = !!(card.diagram && card.diagram.trim());
  const hasEditorNote = !!card.note_id;

  return (
    <>
      <div
        ref={setNodeRef}
        data-card-id={card.id}
        style={style}
        className={`group relative rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 transition-colors hover:border-slate-600 hover:bg-slate-800/80 ${
          isDragging ? 'shadow-lg shadow-purple-500/10' : ''
        }`}
      >
        <div className="flex items-start gap-1.5">
          {/* Drag handle */}
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab text-slate-600 hover:text-slate-400 active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          {/* Card body */}
          <div className="min-w-0 flex-1">
            {/* Color dot + text */}
            <div className="flex items-center gap-1.5">
              {colorClasses && (
                <div className={`h-2 w-2 shrink-0 rounded-full ${colorClasses.dot}`} />
              )}
              {editing ? (
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') {
                      setText(card.text);
                      setEditing(false);
                    }
                  }}
                  className="w-full rounded bg-slate-900/50 px-1 py-0.5 text-xs text-slate-100 outline-none ring-1 ring-purple-500/50"
                  placeholder={t.storyPlaceholder}
                />
              ) : (
                <span
                  onDoubleClick={() => setEditing(true)}
                  className="cursor-text text-xs text-slate-200"
                >
                  {card.text}
                </span>
              )}

              {/* Estimation badge */}
              <EstimationBadge estimation={card.estimation} />

              {/* Indicators for notes/diagram/editor note/entity links */}
              {(hasNotes || hasDiagram || hasEditorNote || hasEntityLinks) && (
                <div className="flex shrink-0 items-center gap-0.5">
                  {hasEditorNote && (
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400" title={_t.hasNote || 'Note'} />
                  )}
                  {hasEntityLinks && (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" title={_t.linkedEntities || 'Linked entities'} />
                  )}
                  {hasNotes && (
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" title={_t.notes} />
                  )}
                  {hasDiagram && (
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" title={_t.diagram} />
                  )}
                </div>
              )}
            </div>

            {/* Sub-stories toggle */}
            {(card.subs.length > 0 || showSubs) && (
              <button
                type="button"
                onClick={() => setShowSubs((v) => !v)}
                className="mt-1 flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300"
              >
                {showSubs ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {t.subStories} ({card.subs.filter((s) => s.done).length}/{card.subs.length})
              </button>
            )}

            {/* Sub-stories list */}
            {showSubs && (
              <div className="mt-1 space-y-0.5">
                {card.subs.map((sub) => (
                  <div key={sub.id} className="group/sub flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => toggleSub(sub.id)}
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                        sub.done
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-slate-600 text-transparent hover:border-slate-500'
                      }`}
                      aria-label={sub.done ? "Mark incomplete" : "Mark complete"}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </button>
                    <span className={sub.done ? 'text-slate-500 line-through' : 'text-slate-300'}>
                      {sub.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSub(sub.id)}
                      className="ms-auto text-transparent group-hover/sub:text-slate-500 hover:!text-red-400"
                      aria-label="Delete sub-story"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {/* Add sub input */}
                <div className="flex items-center gap-1 pt-0.5">
                  <input
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSub();
                    }}
                    placeholder={t.subPlaceholder}
                    className="min-w-0 flex-1 rounded bg-slate-900/30 px-1 py-0.5 text-[11px] text-slate-300 outline-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={addSub}
                    className="text-slate-500 hover:text-slate-300"
                    aria-label={t.addSub}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Notes section */}
            {showNotes && (
              <div className="mt-1.5">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  onBlur={() => commitNotes(notesText)}
                  placeholder={t.notePlaceholder}
                  rows={3}
                  className="w-full resize-none rounded bg-slate-900/40 px-1.5 py-1 text-[11px] text-slate-300 outline-none ring-1 ring-slate-600/50 placeholder:text-slate-600 focus:ring-purple-500/40"
                />
              </div>
            )}

            {/* Diagram indicator */}
            {hasDiagram && !showDiagramModal && (
              <button
                type="button"
                onClick={() => setShowDiagramModal(true)}
                className="mt-1 flex items-center gap-1 text-[10px] text-purple-400/70 hover:text-purple-300"
              >
                <GitBranch className="h-3 w-3" />
                {t.diagram}
              </button>
            )}

            {/* Entity link badges */}
            {hasEntityLinks && !showEntityLinker && (
              <div className="mt-1 flex flex-wrap gap-1">
                {linkedEntities!.slice(0, 3).map((link) => (
                  <a
                    key={link.id}
                    href={`/dashboard/entities/${link.entity_type ?? 'document'}/${link.entity_note_id}`}
                    className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    title={link.entity_title}
                  >
                    <Link2 className="h-2 w-2" />
                    <span className="max-w-[60px] truncate">{link.entity_title}</span>
                  </a>
                ))}
                {linkedEntities!.length > 3 && (
                  <span className="text-[9px] text-slate-500">+{linkedEntities!.length - 3}</span>
                )}
              </div>
            )}

            {/* Entity linker panel */}
            {showEntityLinker && onLinkEntity && onUnlinkEntity && (
              <StoryCardEntityLinker
                storyCardId={card.id}
                linkedEntities={linkedEntities ?? []}
                onLink={onLinkEntity}
                onUnlink={onUnlinkEntity}
                _t={_t}
              />
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute -top-2 end-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setShowEstimation((v) => !v)}
            className={`rounded bg-slate-700 px-1 py-0.5 text-[9px] font-bold ${
              card.estimation ? 'text-amber-400' : 'text-slate-400'
            } hover:text-slate-200`}
            title={t.estimation}
          >
            Est
          </button>
          <button
            type="button"
            onClick={() => setShowColor((v) => !v)}
            className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200"
            title={t.colorPicker}
            aria-label={t.colorPicker}
          >
            <div className={`h-3 w-3 rounded-full ${colorClasses?.dot ?? 'bg-slate-500'}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!showSubs) setShowSubs(true);
            }}
            className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200"
            title={t.addSub}
            aria-label={t.addSub}
          >
            <Plus className="h-3 w-3" />
          </button>
          {/* Note toggle */}
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className={`rounded bg-slate-700 p-0.5 hover:text-slate-200 ${
              hasNotes ? 'text-amber-400' : 'text-slate-400'
            }`}
            title={showNotes ? t.notes : t.addNote}
            aria-label={showNotes ? t.notes : t.addNote}
          >
            <StickyNote className="h-3 w-3" />
          </button>
          {/* Open in editor */}
          {onOpenNote && (
            <button
              type="button"
              onClick={() => onOpenNote(card)}
              className={`rounded bg-slate-700 p-0.5 hover:text-slate-200 ${
                hasEditorNote ? 'text-blue-400' : 'text-slate-400'
              }`}
              title={t.openInEditor || 'Open in Editor'}
              aria-label={t.openInEditor || 'Open in Editor'}
            >
              <FileText className="h-3 w-3" />
            </button>
          )}
          {/* Diagram toggle */}
          <button
            type="button"
            onClick={() => setShowDiagramModal(true)}
            className={`rounded bg-slate-700 p-0.5 hover:text-slate-200 ${
              hasDiagram ? 'text-purple-400' : 'text-slate-400'
            }`}
            title={t.editDiagram}
            aria-label={t.editDiagram}
          >
            <GitBranch className="h-3 w-3" />
          </button>
          {/* Entity link toggle */}
          {onLinkEntity && (
            <button
              type="button"
              onClick={() => setShowEntityLinker((v) => !v)}
              className={`rounded bg-slate-700 p-0.5 hover:text-slate-200 ${
                hasEntityLinks ? 'text-emerald-400' : 'text-slate-400'
              }`}
              title={t.linkEntity || 'Link entity'}
              aria-label={t.linkEntity || 'Link entity'}
            >
              <Link2 className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-red-400"
            title={t.deleteCard}
            aria-label={t.deleteCard}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Color picker */}
        {showColor && (
          <div className="mt-1.5 flex flex-wrap gap-1 px-5" role="listbox" aria-label={_t.colorPicker}>
            <button
              type="button"
              role="option"
              aria-selected={!card.color}
              onClick={() => {
                onUpdate(card.id, { color: null });
                setShowColor(false);
              }}
              className={`h-4 w-4 rounded-full border border-slate-500 ${!card.color ? 'ring-2 ring-purple-400' : ''}`}
              title={t.noColor}
              aria-label={t.noColor}
            >
              <X className="h-3 w-3 text-slate-500 mx-auto" />
            </button>
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={card.color === c.id}
                onClick={() => {
                  onUpdate(card.id, { color: c.id });
                  setShowColor(false);
                }}
                className={`h-4 w-4 rounded-full ${c.dot} ${card.color === c.id ? 'ring-2 ring-purple-400' : ''}`}
                aria-label={c.id}
              />
            ))}
          </div>
        )}

        {/* Estimation picker */}
        {showEstimation && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1 px-5" role="listbox" aria-label={_t.estimation}>
            <button
              type="button"
              role="option"
              aria-selected={!card.estimation}
              onClick={() => {
                onUpdate(card.id, { estimation: null });
                setShowEstimation(false);
              }}
              className={`rounded px-1.5 py-0.5 text-[10px] ${!card.estimation ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              aria-label="Clear estimation"
            >
              <X className="inline h-2.5 w-2.5" />
            </button>
            {ESTIMATIONS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onUpdate(card.id, { estimation: e.id });
                  setShowEstimation(false);
                }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  card.estimation === e.id
                    ? `${e.bg} ${e.text} ring-1 ring-current`
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {e.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Diagram modal — rendered via portal outside card to avoid z-index issues */}
      {showDiagramModal && (
        <DiagramModal
          initialDiagram={card.diagram || ''}
          onSave={saveDiagram}
          onCancel={() => setShowDiagramModal(false)}
          t={_t}
        />
      )}
    </>
  );
}

// ─── Drag Overlay ghost card ────────────────────────
export function StoryCardOverlay({ card }: { card: StoryCardType }) {
  const colorClasses = getColorClasses(card.color);

  if (card.type === 'epic') {
    return (
      <div
        className={`rounded-lg border px-3 py-2 shadow-xl ${
          colorClasses
            ? `${colorClasses.bg}/20 border-${colorClasses.id}-500/30`
            : 'border-slate-600/50 bg-slate-700/50'
        }`}
      >
        <div className="text-sm font-semibold text-slate-100">{card.text}</div>
      </div>
    );
  }

  if (card.type === 'feature') {
    return (
      <div
        className={`rounded-md border px-2 py-1.5 shadow-xl ${
          colorClasses
            ? `${colorClasses.bg}/15 border-${colorClasses.id}-500/25`
            : 'border-slate-600/40 bg-slate-700/40'
        }`}
      >
        <div className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 text-slate-500" />
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          {colorClasses && (
            <div className={`h-2 w-2 rounded-full ${colorClasses.dot}`} />
          )}
          <span className="text-xs font-medium text-slate-200">{card.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-purple-500/30 bg-slate-800 p-2 shadow-xl shadow-purple-500/10">
      <div className="flex items-center gap-1.5">
        <GripVertical className="h-3.5 w-3.5 text-slate-500" />
        {colorClasses && (
          <div className={`h-2 w-2 rounded-full ${colorClasses.dot}`} />
        )}
        <span className="text-xs text-slate-200">{card.text}</span>
      </div>
    </div>
  );
}
