'use client';

import { useState, useCallback } from 'react';
import {
  Archive, ArchiveRestore, ArrowRightLeft, Download, Bot,
  Bell, Phone, MessageSquare,
} from 'lucide-react';
import { resolveActions } from '@/lib/entities/resolveActions';
import { ACTION_HANDLERS } from '@/lib/entities/actionHandlers';
import { getTranslations } from '@/lib/i18n';
import type { Language } from '@/contexts/SettingsContext';
import type { NoteRecord, TemplateConfig, GlobalField } from '@/lib/entities/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Archive, ArchiveRestore, ArrowRightLeft, Download, Bot,
  Bell, Phone, MessageSquare,
};

const VARIANT_CLASSES: Record<string, string> = {
  default: 'text-slate-300 hover:text-purple-300 hover:bg-purple-500/10',
  destructive: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  outline: 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]',
  ghost: 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]',
};

interface Props {
  note: NoteRecord;
  entityType: string;
  templateConfig: TemplateConfig | null | undefined;
  language: string;
  fields: GlobalField[];
  allNotes: NoteRecord[];
  onRefresh: () => void;
}

export function NoteActions({ note, entityType, templateConfig, language, fields, allNotes, onRefresh }: Props) {
  const t = getTranslations(language as Language);
  const ta = t.entities.actions;
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const actions = resolveActions(templateConfig, { scope: 'single', note });

  const handleAction = useCallback(async (actionId: string) => {
    const handler = ACTION_HANDLERS[actionId];
    if (!handler) return;

    // Confirmation for destructive actions
    if (actions.find(a => a.id === actionId)?.confirm && confirming !== actionId) {
      setConfirming(actionId);
      return;
    }
    setConfirming(null);

    setLoading(actionId);
    const result = await handler([note.id], entityType, {
      language, fields, notes: allNotes, onRefresh,
    });
    setLoading(null);

    if (result.success) {
      onRefresh();
      if (result.message && result.message !== 'status_picker' && result.message !== 'call_log_form') {
        window.dispatchEvent(new CustomEvent('cc-notify', {
          detail: { title: result.message, type: 'success' },
        }));
      }
    }
  }, [note, entityType, language, fields, allNotes, onRefresh, actions, confirming]);

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap py-2 border-b border-white/[0.04]">
      {actions.map(action => {
        const Icon = ICON_MAP[action.icon] || Bot;
        const isConfirming = confirming === action.id;
        const isLoading = loading === action.id;

        if (isConfirming) {
          return (
            <div key={action.id} className="flex items-center gap-1">
              <span className="text-[10px] text-amber-400">{ta.confirmDeactivate}</span>
              <button
                onClick={() => handleAction(action.id)}
                className="rounded px-2 py-0.5 text-[10px] bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                {t.common.confirm}
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="rounded px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-300"
              >
                {t.common.cancel}
              </button>
            </div>
          );
        }

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            disabled={isLoading}
            className={`rounded-md p-1.5 transition-colors ${VARIANT_CLASSES[action.variant] || VARIANT_CLASSES.default} ${isLoading ? 'opacity-50' : ''}`}
            title={action.label[language as 'he' | 'en' | 'ru'] || action.label.en}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
