'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  X,
} from 'lucide-react';
import type { StoryCard as StoryCardType, SubStory } from '@/lib/supabase/storyCardQueries';

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

// ─── Props ──────────────────────────────────────────
interface StoryCardProps {
  card: StoryCardType;
  onUpdate: (id: string, updates: Partial<StoryCardType>) => void;
  onDelete: (id: string) => void;
  t: {
    storyPlaceholder: string;
    epicPlaceholder: string;
    deleteCard: string;
    subStories: string;
    addSub: string;
    subPlaceholder: string;
    colorPicker: string;
    noColor: string;
  };
}

// ─── Epic Card (column header, not draggable) ───────
export function EpicCard({ card, onUpdate, onDelete, t }: StoryCardProps) {
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
        >
          <div className={`h-3 w-3 rounded-full ${colorClasses?.dot ?? 'bg-slate-500'}`} />
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-red-400"
          title={t.deleteCard}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Color picker dropdown */}
      {showColor && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {/* No color option */}
          <button
            type="button"
            onClick={() => {
              onUpdate(card.id, { color: null });
              setShowColor(false);
            }}
            className={`h-4 w-4 rounded-full border border-slate-500 ${!card.color ? 'ring-2 ring-purple-400' : ''}`}
            title={t.noColor}
          >
            <X className="h-3 w-3 text-slate-500 mx-auto" />
          </button>
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onUpdate(card.id, { color: c.id });
                setShowColor(false);
              }}
              className={`h-4 w-4 rounded-full ${c.dot} ${card.color === c.id ? 'ring-2 ring-purple-400' : ''}`}
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
  };
}

export function FeatureCard({ card, onUpdate, onDelete, expanded, onToggle, t }: FeatureCardProps) {
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
      </div>

      {/* Hover actions */}
      <div className="absolute -top-2 end-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setShowColor((v) => !v)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200"
          title={t.colorPicker}
        >
          <div className={`h-3 w-3 rounded-full ${colorClasses?.dot ?? 'bg-slate-500'}`} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-red-400"
          title={t.deleteCard}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Color picker */}
      {showColor && (
        <div className="mt-1 flex flex-wrap gap-1 ps-6">
          <button
            type="button"
            onClick={() => {
              onUpdate(card.id, { color: null });
              setShowColor(false);
            }}
            className={`h-4 w-4 rounded-full border border-slate-500 ${!card.color ? 'ring-2 ring-purple-400' : ''}`}
            title={t.noColor}
          >
            <X className="h-3 w-3 text-slate-500 mx-auto" />
          </button>
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onUpdate(card.id, { color: c.id });
                setShowColor(false);
              }}
              className={`h-4 w-4 rounded-full ${c.dot} ${card.color === c.id ? 'ring-2 ring-purple-400' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Story Card (sortable/draggable) ────────────────
export function StoryCard({ card, onUpdate, onDelete, t }: StoryCardProps) {
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

  return (
    <div
      ref={setNodeRef}
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
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute -top-2 end-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setShowColor((v) => !v)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200"
          title={t.colorPicker}
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
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-red-400"
          title={t.deleteCard}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Color picker */}
      {showColor && (
        <div className="mt-1.5 flex flex-wrap gap-1 px-5">
          <button
            type="button"
            onClick={() => {
              onUpdate(card.id, { color: null });
              setShowColor(false);
            }}
            className={`h-4 w-4 rounded-full border border-slate-500 ${!card.color ? 'ring-2 ring-purple-400' : ''}`}
            title={t.noColor}
          >
            <X className="h-3 w-3 text-slate-500 mx-auto" />
          </button>
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onUpdate(card.id, { color: c.id });
                setShowColor(false);
              }}
              className={`h-4 w-4 rounded-full ${c.dot} ${card.color === c.id ? 'ring-2 ring-purple-400' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
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
