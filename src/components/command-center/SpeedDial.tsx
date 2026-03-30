'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { _Plus, _X, Check, CircleDashed } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import { widgetRegistry } from './widgets/WidgetRegistry';
import { BUILTIN_ENTITY_TYPES } from '@/lib/entities/builtinEntityTypes';
import { ShortcutPicker } from './ShortcutPicker';
import { NAV_GROUPS } from './Sidebar';

// ─── Types ─────────────────────────────────────────

export type SpeedDialSlot = {
  type: 'widget' | 'entity' | 'action' | 'page';
  id: string;
};

const SPEED_DIAL_KEY = 'cc-speed-dial-slots';
const LONG_PRESS_MS = 3000;

const DEFAULT_SLOTS: SpeedDialSlot[] = [
  { type: 'action', id: 'quick-create' },
  { type: 'widget', id: 'ai-assistant' },
  { type: 'widget', id: 'search' },
  { type: 'action', id: 'new-note' },
  { type: 'widget', id: 'timer' },
];

// ─── Built-in action definitions ───────────────────

const ACTION_DEFS: Record<string, { labelKey: string; handler: (_router: ReturnType<typeof useRouter>) => void }> = {
  'quick-create': {
    labelKey: 'quickCreate',
    handler: () => window.dispatchEvent(new CustomEvent('cc-open-quick-create')),
  },
  'new-note': {
    labelKey: 'newNote',
    handler: (_router) => router.push('/dashboard/entities/note'),
  },
};

// ─── Slot → icon/label resolution ──────────────────

function resolveSlot(slot: SpeedDialSlot, language: 'he' | 'en' | 'ru', sd: Record<string, string>) {
  if (slot.type === 'widget') {
    const w = widgetRegistry.find(r => r.id === slot.id);
    if (w) {
      const Icon = w.icon;
      return { Icon, label: w.label[language] };
    }
  }

  if (slot.type === 'entity') {
    const e = BUILTIN_ENTITY_TYPES.find(r => r.slug === slot.id);
    if (e) {
      return { emoji: e.icon, label: e.label[language] };
    }
  }

  if (slot.type === 'page') {
    for (const group of NAV_GROUPS) {
      for (const entry of group.items) {
        if ('type' in entry && entry.type === 'folder') {
          if (entry.key === slot.id) return { Icon: entry.icon, label: sd[slot.id as keyof typeof sd] ?? slot.id };
          for (const child of entry.children) {
            if (child.key === slot.id) return { Icon: child.icon, label: sd[slot.id as keyof typeof sd] ?? slot.id };
          }
        } else if (entry.key === slot.id) {
          return { Icon: entry.icon, label: sd[slot.id as keyof typeof sd] ?? slot.id };
        }
      }
    }
  }

  if (slot.type === 'action') {
    const def = ACTION_DEFS[slot.id];
    if (def) {
      const labelKey = def.labelKey as keyof typeof sd;
      // Action icons: use widget icon if matches, else Plus
      if (slot.id === 'quick-create') {
        const w = widgetRegistry.find(r => r.id === 'quick-create');
        return { Icon: w?.icon ?? _Plus, label: sd[labelKey] ?? slot.id };
      }
      if (slot.id === 'new-note') {
        // StickyNote from the note entity
        return { emoji: '📝', label: sd[labelKey] ?? slot.id };
      }
      return { Icon: _Plus, label: sd[labelKey] ?? slot.id };
    }
  }

  return { Icon: CircleDashed, label: slot.id };
}

// ─── Slot click handler ────────────────────────────

function handleSlotClick(slot: SpeedDialSlot, _router: ReturnType<typeof useRouter>) {
  if (slot.type === 'action') {
    const def = ACTION_DEFS[slot.id];
    if (def) def.handler(_router);
    return;
  }

  if (slot.type === 'widget') {
    // Dispatch cc-open-{widgetId} for known widgets, else generic event
    const eventMap: Record<string, string> = {
      'search': 'cc-open-search',
      'ai-assistant': 'cc-open-ai',
      'quick-create': 'cc-open-quick-create',
      'keyboard-shortcuts': 'cc-open-shortcuts',
      'notifications': 'cc-open-notifications',
    };
    const eventName = eventMap[slot.id] || `cc-open-widget-${slot.id}`;
    window.dispatchEvent(new CustomEvent(eventName));
    return;
  }

  if (slot.type === 'entity') {
    router.push(`/dashboard/entities/${slot.id}`);
    return;
  }

  if (slot.type === 'page') {
    // Find the nav item href
    for (const group of NAV_GROUPS) {
      for (const entry of group.items) {
        if ('type' in entry && entry.type === 'folder') {
          if (entry.key === slot.id) { router.push(entry.href); return; }
          for (const child of entry.children) {
            if (child.key === slot.id) { router.push(child.href); return; }
          }
        } else if (entry.key === slot.id) {
          router.push(entry.href); return;
        }
      }
    }
  }
}

// ─── Fan layout helper ─────────────────────────────

function fanPosition(i: number, n: number) {
  const angleDeg = 180 - i * (180 / (n - 1));
  const angleRad = (angleDeg * Math.PI) / 180;
  const radius = 96;
  return {
    x: Math.cos(angleRad) * radius,
    y: -Math.sin(angleRad) * radius,
  };
}

// ─── Load / Save ───────────────────────────────────

function loadSlots(): SpeedDialSlot[] {
  try {
    const raw = localStorage.getItem(SPEED_DIAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 5) return parsed;
    }
  } catch { /* use defaults */ }
  return DEFAULT_SLOTS;
}

function saveSlots(slots: SpeedDialSlot[]) {
  localStorage.setItem(SPEED_DIAL_KEY, JSON.stringify(slots));
}

// ─── Component ─────────────────────────────────────

export function SpeedDial() {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [slots, setSlots] = useState<SpeedDialSlot[]>(DEFAULT_SLOTS);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const { language } = useSettings();
  const _t = getTranslations(language);
  const sd = t.speedDial;
  const _router = useRouter();

  // Long-press state (main button)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<number>(0);
  // Long-press state (individual slot buttons)
  const slotPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load slots from localStorage on mount
  useEffect(() => {
    setSlots(loadSlots());
  }, []);

  const toggle = useCallback(() => {
    if (editMode) return; // Don't toggle while editing
    setOpen(prev => !prev);
  }, [editMode]);

  const close = useCallback(() => {
    if (editMode) return;
    setOpen(false);
  }, [editMode]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerIndex !== null) {
          setPickerIndex(null);
        } else if (editMode) {
          setEditMode(false);
          setOpen(false);
        } else {
          close();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close, editMode, pickerIndex]);

  // ── Long press handlers ───────────────────────────

  const onPointerDown = useCallback(() => {
    pressStartRef.current = Date.now();
    pressTimerRef.current = setTimeout(() => {
      setOpen(true);
      setEditMode(true);
    }, LONG_PRESS_MS);
  }, []);

  const onPointerUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    // If the press was shorter than LONG_PRESS_MS, do normal toggle
    const elapsed = Date.now() - pressStartRef.current;
    if (elapsed < LONG_PRESS_MS) {
      toggle();
    }
  }, [toggle]);

  const onPointerCancel = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  // ── Slot update ───────────────────────────────────

  const updateSlot = useCallback((index: number, newSlot: SpeedDialSlot) => {
    setSlots(prev => {
      const next = [...prev];
      next[index] = newSlot;
      saveSlots(next);
      return next;
    });
  }, []);

  const clearSlot = useCallback((index: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[index] = DEFAULT_SLOTS[index] ?? { type: 'action', id: 'quick-create' };
      saveSlots(next);
      return next;
    });
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setPickerIndex(null);
    setOpen(false);
  }, []);

  // ── Slot long-press handlers ────────────────────────
  const onSlotPointerDown = useCallback((index: number) => {
    if (editMode) return;
    slotPressTimerRef.current = setTimeout(() => {
      setEditMode(true);
      setPickerIndex(index);
    }, LONG_PRESS_MS);
  }, [editMode]);

  const onSlotPointerUp = useCallback(() => {
    if (slotPressTimerRef.current) {
      clearTimeout(slotPressTimerRef.current);
      slotPressTimerRef.current = null;
    }
  }, []);

  // ── Long-press progress indicator ─────────────────
  const [pressProgress, setPressProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPressProgress = useCallback(() => {
    setPressProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setPressProgress(prev => {
        if (prev >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 100;
        }
        return prev + (100 / (LONG_PRESS_MS / 50));
      });
    }, 50);
  }, []);

  const stopPressProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setPressProgress(0);
  }, []);

  // Wire progress to pointer events
  const handlePointerDown = useCallback(() => {
    onPointerDown();
    startPressProgress();
  }, [onPointerDown, startPressProgress]);

  const handlePointerUp = useCallback(() => {
    onPointerUp();
    stopPressProgress();
  }, [onPointerUp, stopPressProgress]);

  const handlePointerCancel = useCallback(() => {
    onPointerCancel();
    stopPressProgress();
  }, [onPointerCancel, stopPressProgress]);

  return (
    <>
      {/* Backdrop */}
      {open && !editMode && (
        <button
          type="button"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          aria-label="Close speed dial"
        />
      )}

      {/* Edit mode backdrop — blocks interaction but shows dashboard dimmed */}
      {editMode && (
        <div className="fixed inset-0 z-40 bg-black/30" />
      )}

      {/* Container — centered at bottom */}
      <div className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2">
        {/* Fan action buttons */}
        {open && slots.map((slot, i) => {
          const resolved = resolveSlot(slot, language, sd);
          const pos = fanPosition(i, slots.length);

          return (
            <div
              key={`${slot.type}-${slot.id}-${i}`}
              className="group absolute left-1/2 bottom-[14px]"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                animation: 'sd-fan-out 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                animationDelay: `${i * 50}ms`,
              }}
            >
              {/* Tooltip (normal mode only) */}
              {!editMode && (
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  {resolved.label}
                </span>
              )}

              {/* Edit mode: X button to reset slot */}
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearSlot(i); }}
                  className="absolute -top-2 -right-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-400 transition-colors"
                  title={sd.removeSlot}
                >
                  <X size={10} />
                </button>
              )}

              {/* Action button */}
              <button
                onClick={() => {
                  if (editMode) {
                    setPickerIndex(i);
                  } else {
                    onSlotPointerUp(); // Cancel any pending long-press
                    handleSlotClick(slot, _router);
                    setOpen(false);
                  }
                }}
                onPointerDown={() => onSlotPointerDown(i)}
                onPointerUp={onSlotPointerUp}
                onPointerLeave={onSlotPointerUp}
                onPointerCancel={onSlotPointerUp}
                className={`flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md transition-all duration-150 hover:scale-110 hover:shadow-lg ${
                  editMode
                    ? 'bg-slate-600 ring-2 ring-dashed ring-[var(--cc-accent-400)]/50'
                    : 'bg-slate-700'
                }`}
                style={{
                  '--tw-shadow-color': 'var(--cc-accent-500-30)',
                } as React.CSSProperties}
                onMouseEnter={e => {
                  if (!editMode) {
                    e.currentTarget.style.backgroundColor = 'var(--cc-accent-500)';
                  }
                }}
                onMouseLeave={e => {
                  if (!editMode) {
                    e.currentTarget.style.backgroundColor = '';
                  }
                }}
              >
                {'Icon' in resolved && resolved.Icon ? (
                  <resolved.Icon size={18} />
                ) : (
                  <span className="text-sm leading-none">{resolved.emoji}</span>
                )}
              </button>
            </div>
          );
        })}

        {/* Done editing button */}
        {editMode && (
          <button
            type="button"
            onClick={exitEditMode}
            className="absolute left-1/2 bottom-[36px] -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-emerald-500 transition-colors"
            style={{
              transform: 'translateX(-50%) translateY(120px)',
              animation: 'sd-fan-out 0.3s ease-out 0.2s both',
            }}
          >
            <Check size={14} />
            {sd.doneEditing}
          </button>
        )}

        {/* Half-ellipse trigger */}
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerCancel}
          onPointerCancel={handlePointerCancel}
          className="relative flex items-center justify-center transition-all duration-200 focus:outline-none select-none touch-none"
          style={{
            width: 80,
            height: 28,
            borderRadius: '40px 40px 0 0',
            backgroundColor: editMode
              ? 'var(--cc-accent-600)'
              : open
                ? 'var(--cc-accent-500)'
                : 'rgb(30 41 59)',
            border: '1px solid',
            borderBottom: 'none',
            borderColor: editMode
              ? 'var(--cc-accent-300)'
              : open
                ? 'var(--cc-accent-400)'
                : 'rgba(51 65 85 / 0.6)',
            boxShadow: editMode
              ? '0 0 20px var(--cc-accent-500-50), 0 -4px 24px var(--cc-accent-600-30)'
              : open
                ? '0 0 16px var(--cc-accent-500-50), 0 -4px 20px var(--cc-accent-600-30)'
                : '0 0 8px var(--cc-accent-500-15), 0 -2px 6px rgba(0,0,0,0.3)',
            animation: editMode
              ? 'sd-edit-pulse 1.5s ease-in-out infinite'
              : open
                ? 'sd-glow-pulse 2s ease-in-out infinite'
                : 'none',
          }}
          onMouseEnter={e => {
            if (!open && !editMode) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 14px var(--cc-accent-500-30), 0 -3px 10px rgba(0,0,0,0.3)';
            }
          }}
          onMouseLeave={e => {
            if (!open && !editMode) {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 0 8px var(--cc-accent-500-15), 0 -2px 6px rgba(0,0,0,0.3)';
            }
          }}
          aria-label="Speed dial"
        >
          {/* Long-press progress ring */}
          {pressProgress > 0 && pressProgress < 100 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              viewBox="0 0 80 28"
              style={{ overflow: 'visible' }}
            >
              <rect
                x={0}
                y={0}
                width={80}
                height={28}
                rx={40}
                fill="none"
                stroke="var(--cc-accent-400)"
                strokeWidth={2}
                strokeDasharray={`${(pressProgress / 100) * 216} 216`}
                opacity={0.7}
              />
            </svg>
          )}

          <Plus
            size={18}
            className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
            style={{ color: open || editMode ? 'white' : 'rgb(148 163 184)' }}
          />
        </button>
      </div>

      {/* ShortcutPicker */}
      {pickerIndex !== null && (
        <ShortcutPicker
          language={language}
          translations={{
            pickShortcut: sd.pickShortcut,
            searchShortcuts: sd.searchShortcuts,
            pages: sd.pages,
            widgets: sd.widgets,
            entities: sd.entities,
          }}
          onSelect={(newSlot) => {
            updateSlot(pickerIndex, newSlot);
            setPickerIndex(null);
          }}
          onClose={() => setPickerIndex(null)}
        />
      )}

    </>
  );
}
