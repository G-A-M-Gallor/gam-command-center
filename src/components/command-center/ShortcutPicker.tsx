'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { widgetRegistry } from './widgets/WidgetRegistry';
import { BUILTIN_ENTITY_TYPES } from '@/lib/entities/builtinEntityTypes';
import { NAV_GROUPS } from './Sidebar';
import type { SpeedDialSlot } from './SpeedDial';
import { getTranslations } from '@/lib/i18n';

interface ShortcutPickerProps {
  onSelect: (slot: SpeedDialSlot) => void;
  onClose: () => void;
  language: 'he' | 'en' | 'ru';
  translations: {
    pickShortcut: string;
    searchShortcuts: string;
    widgets: string;
    entities: string;
    pages?: string;
  };
}

type Tab = 'pages' | 'widgets' | 'entities';

export function ShortcutPicker({ onSelect, onClose, language, translations }: ShortcutPickerProps) {
  const [tab, setTab] = useState<Tab>('pages');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = getTranslations(language);

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

  // Flatten all nav items (including folder children) into a flat list
  const pageItems = useMemo(() => {
    const items: { key: string; href: string; icon: React.ElementType; label: string }[] = [];
    const tabsT = t.tabs as Record<string, string>;
    for (const group of NAV_GROUPS) {
      for (const entry of group.items) {
        if ('type' in entry && entry.type === 'folder') {
          items.push({ key: entry.key, href: entry.href, icon: entry.icon, label: tabsT[entry.key] ?? entry.key });
          for (const child of entry.children) {
            items.push({ key: child.key, href: child.href, icon: child.icon, label: tabsT[child.key] ?? child.key });
          }
        } else {
          items.push({ key: entry.key, href: entry.href, icon: entry.icon, label: tabsT[entry.key] ?? entry.key });
        }
      }
    }
    if (!lowerQuery) return items;
    return items.filter(p =>
      p.label.toLowerCase().includes(lowerQuery) ||
      p.key.toLowerCase().includes(lowerQuery)
    );
  }, [lowerQuery, t.tabs]);

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
          {([
            { id: 'pages' as Tab, label: translations.pages || 'Pages' },
            { id: 'widgets' as Tab, label: translations.widgets },
            { id: 'entities' as Tab, label: translations.entities },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 text-[var(--cc-accent-400)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={tab === t.id ? { borderColor: 'var(--cc-accent-400)' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Items list */}
        <div className="max-h-52 overflow-y-auto p-1">
          {tab === 'pages' && pageItems.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onSelect({ type: 'page', id: p.key });
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm text-slate-300 hover:bg-slate-700/70 hover:text-white transition-colors"
              >
                <Icon size={16} className="shrink-0 text-slate-400" />
                <span>{p.label}</span>
              </button>
            );
          })}

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

          {((tab === 'pages' && pageItems.length === 0) ||
            (tab === 'widgets' && widgetItems.length === 0) ||
            (tab === 'entities' && entityItems.length === 0)) && (
            <div className="px-3 py-4 text-center text-xs text-slate-500">—</div>
          )}
        </div>
      </div>
    </>
  );
}
