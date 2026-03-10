'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Archive, ArchiveRestore, ArrowRightLeft, Download, Bot,
  Bell, Phone, MessageSquare, Pencil, UserPlus,
} from 'lucide-react';
import { resolveActions } from '@/lib/entities/resolveActions';
import { ACTION_HANDLERS } from '@/lib/entities/actionHandlers';
import { useAuth } from '@/contexts/AuthContext';
import { getTranslations } from '@/lib/i18n';
import type { Language } from '@/contexts/SettingsContext';
import type { NoteRecord, TemplateConfig, GlobalField, ActionButton } from '@/lib/entities/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Archive, ArchiveRestore, ArrowRightLeft, Download, Bot,
  Bell, Phone, MessageSquare, Pencil, UserPlus,
};

const VARIANT_CLASSES: Record<string, string> = {
  default: 'border-purple-500/30 text-purple-300 hover:bg-purple-500/15',
  destructive: 'border-red-500/30 text-red-400 hover:bg-red-500/15',
  outline: 'border-white/[0.1] text-slate-300 hover:bg-white/[0.06]',
  ghost: 'border-transparent text-slate-400 hover:bg-white/[0.04]',
};

interface Props {
  note: NoteRecord;
  entityType: string;
  templateConfig: TemplateConfig | null | undefined;
  language: string;
  fields: GlobalField[];
  onRefresh: () => void;
}

export function NoteActionBar({
  note, entityType, templateConfig, language, fields, onRefresh,
}: Props) {
  const t = getTranslations(language as Language);
  const isRtl = language === 'he';
  const { canPerformAction } = useAuth();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const actions = useMemo(
    () => resolveActions(templateConfig, { scope: 'single', note, canPerformAction }),
    [templateConfig, note, canPerformAction],
  );

  const handleAction = useCallback(async (action: ActionButton) => {
    const handler = ACTION_HANDLERS[action.id];
    if (!handler) return;

    if (action.confirm && confirming !== action.id) {
      setConfirming(action.id);
      return;
    }
    setConfirming(null);

    setLoading(action.id);
    const result = await handler([note.id], entityType, {
      language, fields, notes: [note], onRefresh,
    });
    setLoading(null);

    if (result.success) onRefresh();
  }, [note, entityType, language, fields, onRefresh, confirming]);

  if (actions.length === 0) return null;

  return (
    <div
      data-cc-id="note-action-bar"
      className="flex items-center gap-2 flex-wrap"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {actions.map(action => {
        const Icon = ICON_MAP[action.icon] || Download;
        const isConfirming = confirming === action.id;

        if (isConfirming) {
          return (
            <div key={action.id} className="flex items-center gap-1.5">
              <span className="text-[11px] text-amber-400">
                {action.label[language as 'he' | 'en' | 'ru'] || action.label.en}?
              </span>
              <button
                onClick={() => handleAction(action)}
                className="rounded px-2 py-0.5 text-[11px] bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                {t.common.confirm}
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-300"
              >
                {t.common.cancel}
              </button>
            </div>
          );
        }

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            disabled={loading === action.id}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${VARIANT_CLASSES[action.variant] || VARIANT_CLASSES.outline} ${loading === action.id ? 'opacity-50' : ''}`}
          >
            <Icon size={13} />
            {action.label[language as 'he' | 'en' | 'ru'] || action.label.en}
          </button>
        );
      })}
    </div>
  );
}
