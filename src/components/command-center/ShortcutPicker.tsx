'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { widgetRegistry } from './widgets/WidgetRegistry';
import { BUILTIN_ENTITY_TYPES } from '@/lib/entities/builtinEntityTypes';
import type { SpeedDialSlot } from './SpeedDial';

interface ShortcutPickerProps {
  onSelect: (slot: SpeedDialSlot) => void;
  onClose: () => void;
  language: 'he' | 'en' | 'ru';
  translations: {
    pickShortcut: string;
    searchShortcuts: string;
    widgets: string;
    entities: string;
  };
}

type Tab = 'widgets' | 'entities';

export function ShortcutPicker({ onSelect, onClose, language, translations }: ShortcutPickerProps) {
  const [tab, setTab] = useState<Tab>('widgets');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const lowerQuery = query.toLowerCase();

  const widgetItems = useMemo(() => {
    return widgetRegistry
      .filter(w => w.status === 'active')
      .filter(w => {
        if (!lowerQuery) return true;
        return (
          w.label.he.toLowerCase().includes(lowerQuery) ||
          w.label.en.toLowerCase().includes(lowerQuery) ||
          w.label.ru.toLowerCase().includes(lowerQuery) ||
          w.id.toLowerCase().includes(lowerQuery)
        );
      });
  }, [lowerQuery]);

  const entityItems = useMemo(() => {
    return BUILTIN_ENTITY_TYPES.filter(e => {
      if (!lowerQuery) return true;
      return (
        e.label.he.toLowerCase().includes(lowerQuery) ||
        e.label.en.toLowerCase().includes(lowerQuery) ||
        e.label.ru.toLowerCase().includes(lowerQuery) ||
        e.slug.toLowerCase().includes(lowerQuery)
      );
    });
  }, [lowerQuery]);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/30"
        aria-label="Close picker"
      />

      {/* Picker panel */}
      <div className="fixed left-1/2 bottom-36 z-[60] w-72 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
        style={{ animation: 'sd-fan-out 0.2s ease-out both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
          <span className="text-sm font-medium text-slate-200">{translations.pickShortcut}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={translations.searchShortcuts}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-3">
          <button
            type="button"
            onClick={() => setTab('widgets')}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              tab === 'widgets'
                ? 'border-b-2 text-[var(--cc-accent-400)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={tab === 'widgets' ? { borderColor: 'var(--cc-accent-400)' } : undefined}
          >
            {translations.widgets}
          </button>
          <button
            type="button"
            onClick={() => setTab('entities')}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              tab === 'entities'
                ? 'border-b-2 text-[var(--cc-accent-400)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={tab === 'entities' ? { borderColor: 'var(--cc-accent-400)' } : undefined}
          >
            {translations.entities}
          </button>
        </div>

        {/* Items list */}
        <div className="max-h-52 overflow-y-auto p-1">
          {tab === 'widgets' && widgetItems.map(w => {
            const Icon = w.icon;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  onSelect({ type: 'widget', id: w.id });
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm text-slate-300 hover:bg-slate-700/70 hover:text-white transition-colors"
              >
                <Icon size={16} className="shrink-0 text-slate-400" />
                <span>{w.label[language]}</span>
              </button>
            );
          })}

          {tab === 'entities' && entityItems.map(e => (
            <button
              key={e.slug}
              type="button"
              onClick={() => {
                onSelect({ type: 'entity', id: e.slug });
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm text-slate-300 hover:bg-slate-700/70 hover:text-white transition-colors"
            >
              <span className="shrink-0 text-base">{e.icon}</span>
              <span>{e.label[language]}</span>
            </button>
          ))}

          {((tab === 'widgets' && widgetItems.length === 0) ||
            (tab === 'entities' && entityItems.length === 0)) && (
            <div className="px-3 py-4 text-center text-xs text-slate-500">—</div>
          )}
        </div>
      </div>
    </>
  );
}
