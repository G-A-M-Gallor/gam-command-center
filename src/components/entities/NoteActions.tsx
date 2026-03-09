'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Archive, ArchiveRestore, ArrowRightLeft, Download, Bot,
  Bell, Phone, MessageSquare, Loader2, X, Check,
} from 'lucide-react';
import { resolveActions } from '@/lib/entities/resolveActions';
import { ACTION_HANDLERS } from '@/lib/entities/actionHandlers';
import { updateNoteMeta, addCallLogEntry } from '@/lib/supabase/entityQueries';
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

type InlineUI = 'status_picker' | 'call_log_form' | null;

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
  const lang = language as 'he' | 'en' | 'ru';
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeUI, setActiveUI] = useState<InlineUI>(null);
  const [callSummary, setCallSummary] = useState('');
  const [uiSaving, setUiSaving] = useState(false);
  const callInputRef = useRef<HTMLInputElement>(null);

  const actions = resolveActions(templateConfig, { scope: 'single', note });

  // Find the status select field for the status picker
  const statusField = fields.find(
    f => f.meta_key === 'status' && (f.field_type === 'select' || f.field_type === 'multi-select'),
  ) ?? fields.find(
    f => f.field_type === 'select' && f.options.length > 0,
  );

  // Auto-focus call log input
  useEffect(() => {
    if (activeUI === 'call_log_form') callInputRef.current?.focus();
  }, [activeUI]);

  const handleAction = useCallback(async (actionId: string) => {
    const handler = ACTION_HANDLERS[actionId];
    if (!handler) return;

    // Intercept status_picker / call_log_form — open inline UI instead
    if (actionId === 'change_status') {
      setActiveUI(prev => prev === 'status_picker' ? null : 'status_picker');
      setConfirming(null);
      return;
    }
    if (actionId === 'call_log') {
      setActiveUI(prev => prev === 'call_log_form' ? null : 'call_log_form');
      setCallSummary('');
      setConfirming(null);
      return;
    }

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
      if (result.message) {
        window.dispatchEvent(new CustomEvent('cc-notify', {
          detail: { title: result.message, type: 'success' },
        }));
      }
    }
  }, [note, entityType, language, fields, allNotes, onRefresh, actions, confirming]);

  const handleStatusChange = async (newStatus: string) => {
    setUiSaving(true);
    await updateNoteMeta(note.id, { status: newStatus }, { trackActivity: true });
    setUiSaving(false);
    setActiveUI(null);
    onRefresh();
  };

  const handleCallLogSubmit = async () => {
    if (!callSummary.trim()) return;
    setUiSaving(true);
    await addCallLogEntry(note.id, callSummary.trim());
    setUiSaving(false);
    setCallSummary('');
    setActiveUI(null);
    onRefresh();
  };

  if (actions.length === 0) return null;

  const currentStatus = (note.meta.status as string) ?? note.status;

  return (
    <div className="space-y-2 py-2 border-b border-white/[0.04]">
      {/* Action buttons row */}
      <div className="flex items-center gap-1 flex-wrap">
        {actions.map(action => {
          const Icon = ICON_MAP[action.icon] || Bot;
          const isConfirming = confirming === action.id;
          const isLoading = loading === action.id;
          const isActive =
            (action.id === 'change_status' && activeUI === 'status_picker') ||
            (action.id === 'call_log' && activeUI === 'call_log_form');

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
              className={`rounded-md p-1.5 transition-colors ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                  : (VARIANT_CLASSES[action.variant] || VARIANT_CLASSES.default)
              } ${isLoading ? 'opacity-50' : ''}`}
              title={action.label[lang] || action.label.en}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Status Picker inline UI */}
      {activeUI === 'status_picker' && statusField && (
        <div className="flex items-center gap-1.5 flex-wrap rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
          <span className="text-[10px] text-slate-500 me-1">
            {statusField.label[lang] || statusField.label.en}:
          </span>
          {statusField.options.map(opt => {
            const isCurrentStatus = opt.value === currentStatus;
            return (
              <button
                key={opt.value}
                onClick={() => !isCurrentStatus && handleStatusChange(opt.value)}
                disabled={uiSaving || isCurrentStatus}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  isCurrentStatus
                    ? 'ring-1 ring-purple-500/40 bg-purple-500/15 text-purple-300'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                } disabled:opacity-50`}
                style={opt.color && !isCurrentStatus ? { backgroundColor: `${opt.color}15`, color: opt.color } : undefined}
              >
                {opt.label[lang] || opt.label.en || opt.value}
              </button>
            );
          })}
          {uiSaving && <Loader2 size={12} className="animate-spin text-slate-500" />}
          <button
            onClick={() => setActiveUI(null)}
            className="ms-auto rounded p-0.5 text-slate-600 hover:text-slate-400"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Status Picker fallback when no status field exists */}
      {activeUI === 'status_picker' && !statusField && (
        <p className="text-[10px] text-slate-500 px-2">
          {lang === 'he' ? 'לא נמצא שדה סטטוס' : 'No status field found'}
        </p>
      )}

      {/* Call Log inline form */}
      {activeUI === 'call_log_form' && (
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
          <Phone size={12} className="shrink-0 text-slate-500" />
          <input
            ref={callInputRef}
            type="text"
            value={callSummary}
            onChange={e => setCallSummary(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCallLogSubmit();
              if (e.key === 'Escape') setActiveUI(null);
            }}
            placeholder={lang === 'he' ? 'תקציר שיחה...' : 'Call summary...'}
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none"
          />
          <button
            onClick={handleCallLogSubmit}
            disabled={!callSummary.trim() || uiSaving}
            className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            {uiSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button
            onClick={() => setActiveUI(null)}
            className="rounded p-1 text-slate-600 hover:text-slate-400"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
