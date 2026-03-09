'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

export function SpeedDial() {
  const [open, setOpen] = useState(false);
  const { language, sidebarPosition } = useSettings();
  const t = getTranslations(language);
  const sd = t.speedDial;
  const isRtl = language === 'he';
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Position: bottom-right in LTR, bottom-left in RTL
  // But if sidebar is on the same side, flip
  const fabOnRight = isRtl ? false : true;
  const positionClass = fabOnRight ? 'right-5' : 'left-5';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <button
          type="button"
          onClick={close}
          className="fixed inset-0 z-40 bg-transparent"
          aria-label="Close speed dial"
        />
      )}

      <div
        ref={containerRef}
        className={`fixed bottom-5 ${positionClass} z-40 flex flex-col-reverse items-center gap-2`}
      >
        {/* Main FAB button */}
        <button
          onClick={toggle}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          aria-label="Speed dial"
        >
          <Plus
            size={22}
            className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          />
        </button>

        {/* Action items — expand upward */}
        {open && actions.map((action, i) => {
          const Icon = action.icon;
          const label = sd[action.labelKey];
          const delay = i * 40;

          return (
            <div
              key={action.id}
              className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              style={{
                animationDelay: `${delay}ms`,
                animationFillMode: 'backwards',
                flexDirection: fabOnRight ? 'row-reverse' : 'row',
              }}
            >
              {/* Label */}
              <span className="whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg">
                {label}
              </span>

              {/* Action button */}
              <button
                onClick={() => { action.handler(); close(); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-white shadow-md hover:bg-slate-600 transition-colors"
              >
                <Icon size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
