'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bot, Search, StickyNote, Clock } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';

interface SpeedAction {
  id: string;
  icon: React.ElementType;
  labelKey: keyof typeof LABEL_KEYS;
  handler: () => void;
}

const LABEL_KEYS = {
  quickCreate: 'quickCreate',
  aiAssistant: 'aiAssistant',
  search: 'search',
  newNote: 'newNote',
  timer: 'timer',
} as const;

/** Compute fan position for item i of n along a 180° arc */
function fanPosition(i: number, n: number) {
  const angleDeg = 180 - i * (180 / (n - 1));
  const angleRad = (angleDeg * Math.PI) / 180;
  const radius = 96;
  return {
    x: Math.cos(angleRad) * radius,
    y: -Math.sin(angleRad) * radius,
  };
}

export function SpeedDial() {
  const [open, setOpen] = useState(false);
  const { language } = useSettings();
  const t = getTranslations(language);
  const sd = t.speedDial;
  const router = useRouter();

  const actions: SpeedAction[] = [
    {
      id: 'quick-create',
      icon: Plus,
      labelKey: 'quickCreate',
      handler: () => window.dispatchEvent(new CustomEvent('cc-open-quick-create')),
    },
    {
      id: 'ai-assistant',
      icon: Bot,
      labelKey: 'aiAssistant',
      handler: () => window.dispatchEvent(new CustomEvent('cc-open-ai')),
    },
    {
      id: 'search',
      icon: Search,
      labelKey: 'search',
      handler: () => window.dispatchEvent(new CustomEvent('cc-open-search')),
    },
    {
      id: 'new-note',
      icon: StickyNote,
      labelKey: 'newNote',
      handler: () => router.push('/dashboard/entities/note'),
    },
    {
      id: 'timer',
      icon: Clock,
      labelKey: 'timer',
      handler: () => window.dispatchEvent(new CustomEvent('timer-state-change')),
    },
  ];

  const toggle = useCallback(() => setOpen(prev => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <button
          type="button"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          aria-label="Close speed dial"
        />
      )}

      {/* Container — centered at bottom */}
      <div className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2">
        {/* Fan action buttons */}
        {open && actions.map((action, i) => {
          const Icon = action.icon;
          const label = sd[action.labelKey];
          const pos = fanPosition(i, actions.length);

          return (
            <div
              key={action.id}
              className="group absolute left-1/2 bottom-[14px]"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                animation: `sd-fan-out 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                animationDelay: `${i * 50}ms`,
              }}
            >
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
              {/* Action button */}
              <button
                onClick={() => { action.handler(); close(); }}
                className="flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-700 text-white shadow-md transition-all duration-150 hover:scale-110 hover:shadow-lg"
                style={{
                  '--tw-shadow-color': 'var(--cc-accent-500-30)',
                } as React.CSSProperties}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--cc-accent-500)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <Icon size={18} />
              </button>
            </div>
          );
        })}

        {/* Half-ellipse trigger */}
        <button
          onClick={toggle}
          className="flex items-center justify-center transition-all duration-200 focus:outline-none"
          style={{
            width: 80,
            height: 28,
            borderRadius: '40px 40px 0 0',
            backgroundColor: open ? 'var(--cc-accent-500)' : 'rgb(30 41 59)', // slate-800
            border: '1px solid',
            borderBottom: 'none',
            borderColor: open ? 'var(--cc-accent-400)' : 'rgba(51 65 85 / 0.6)', // slate-700/60
            boxShadow: open
              ? '0 0 16px var(--cc-accent-500-50), 0 -4px 20px var(--cc-accent-600-30)'
              : `0 0 8px var(--cc-accent-500-15), 0 -2px 6px rgba(0,0,0,0.3)`,
            animation: open ? 'sd-glow-pulse 2s ease-in-out infinite' : 'none',
            transform: open ? undefined : undefined,
          }}
          onMouseEnter={e => {
            if (!open) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 14px var(--cc-accent-500-30), 0 -3px 10px rgba(0,0,0,0.3)';
            }
          }}
          onMouseLeave={e => {
            if (!open) {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 0 8px var(--cc-accent-500-15), 0 -2px 6px rgba(0,0,0,0.3)';
            }
          }}
          aria-label="Speed dial"
        >
          <Plus
            size={18}
            className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
            style={{ color: open ? 'white' : 'rgb(148 163 184)' }} // slate-400
          />
        </button>
      </div>
    </>
  );
}
