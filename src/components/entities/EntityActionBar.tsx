'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Archive, ArchiveRestore, ArrowRightLeft, Download, Bot,
  Bell, Phone, MessageSquare, X, Pencil, UserPlus,
} from 'lucide-react';
import { resolveActions } from '@/lib/entities/resolveActions';
import { ACTION_HANDLERS } from '@/lib/entities/actionHandlers';
import { bulkUpdateMeta } from '@/lib/supabase/entityQueries';
import { useAuth } from '@/contexts/AuthContext';
import { getTranslations } from '@/lib/i18n';
import type { Language } from '@/contexts/SettingsContext';
import type { NoteRecord, TemplateConfig, GlobalField, ActionButton } from '@/lib/entities/types';
import { BulkFieldUpdateModal } from './BulkFieldUpdateModal';

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
  selectedIds: Set<string>;
  notes: NoteRecord[];
  entityType: string;
  templateConfig: TemplateConfig | null | undefined;
  language: string;
  fields: GlobalField[];
  onRefresh: () => void;
  onClearSelection: () => void;
}

export function EntityActionBar({
  selectedIds, notes, entityType, templateConfig, language, fields, onRefresh, onClearSelection,
}: Props) {
  const t = getTranslations(language as Language);
  const ta = t.entities.actions;
  const isHe = language === 'he';
  const { canPerformAction, user } = useAuth();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showBulkFieldUpdate, setShowBulkFieldUpdate] = useState(false);
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const hasBulk = selectedIds.size > 0;

  const globalActions = useMemo(
    () => resolveActions(templateConfig, { scope: 'global', canPerformAction }),
    [templateConfig, canPerformAction],
  );

  const bulkActions = useMemo(
    () => resolveActions(templateConfig, { scope: 'bulk', hasSelection: hasBulk, canPerformAction }),
    [templateConfig, hasBulk, canPerformAction],
  );

  const handleAction = useCallback(async (action: ActionButton) => {
    const handler = ACTION_HANDLERS[action.id];
    if (!handler) return;

    if (action.confirm && confirming !== action.id) {
      setConfirming(action.id);
      return;
    }
    setConfirming(null);

    const ids = action.scope === 'global' ? notes.map(n => n.id) : [...selectedIds];
    setLoading(action.id);
    const result = await handler(ids, entityType, {
      language, fields, notes, onRefresh,
    });
    setLoading(null);

    // Handle UI-driven modals
    if (result.message === 'bulk_field_update_modal') {
      setShowBulkFieldUpdate(true);
      return;
    }
    if (result.message === 'bulk_status_change_modal') {
      setShowBulkStatus(true);
      return;
    }
    if (result.message === 'bulk_assign_modal') {
      setShowBulkAssign(true);
      return;
    }

    if (result.success) {
      onRefresh();
      if (action.scope !== 'global') onClearSelection();
    }
  }, [selectedIds, notes, entityType, language, fields, onRefresh, onClearSelection, confirming]);

  // Status field for bulk status change
  const statusField = useMemo(
    () => fields.find(f => f.meta_key === 'status' || f.meta_key === 'pipeline_stage'),
    [fields],
  );

  const handleBulkStatusApply = useCallback(async (statusValue: string) => {
    const fieldKey = statusField?.meta_key ?? 'status';
    await bulkUpdateMeta([...selectedIds], { [fieldKey]: statusValue }, {
      trackActivity: true,
      actorId: user?.id ?? null,
    });
    setShowBulkStatus(false);
    onRefresh();
    onClearSelection();
  }, [selectedIds, statusField, user, onRefresh, onClearSelection]);

  const handleBulkAssignApply = useCallback(async (assignee: string) => {
    await bulkUpdateMeta([...selectedIds], { assignee }, {
      trackActivity: true,
      actorId: user?.id ?? null,
    });
    setShowBulkAssign(false);
    onRefresh();
    onClearSelection();
  }, [selectedIds, user, onRefresh, onClearSelection]);

  if (globalActions.length === 0 && bulkActions.length === 0) return null;

  return (
    <>
      <div
        data-cc-id="entity-action-bar"
        className="flex items-center gap-2 flex-wrap"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {/* Global actions */}
        {globalActions.map(action => {
          const Icon = ICON_MAP[action.icon] || Download;
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

        {/* Bulk bar — slides in when selection exists */}
        {hasBulk && (
          <div className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 animate-in slide-in-from-bottom-2">
            <span className="text-xs text-purple-300 font-medium">
              {selectedIds.size} {ta.bulkSelected}
            </span>
            <div className="h-4 w-px bg-purple-500/20" />

            {bulkActions.map(action => {
              const Icon = ICON_MAP[action.icon] || Archive;
              const isConfirming = confirming === action.id;

              if (isConfirming) {
                return (
                  <div key={action.id} className="flex items-center gap-1">
                    <span className="text-[10px] text-amber-400">{ta.confirmBulkDeactivate}</span>
                    <button
                      onClick={() => handleAction(action)}
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
                  onClick={() => handleAction(action)}
                  disabled={loading === action.id}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${VARIANT_CLASSES[action.variant] || VARIANT_CLASSES.default} ${loading === action.id ? 'opacity-50' : ''}`}
                >
                  <Icon size={12} />
                  {action.label[language as 'he' | 'en' | 'ru'] || action.label.en}
                </button>
              );
            })}

            <button
              onClick={onClearSelection}
              className="text-slate-500 hover:text-slate-300 ms-1"
              title={t.common.close}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Bulk Field Update Modal */}
      <BulkFieldUpdateModal
        open={showBulkFieldUpdate}
        onClose={() => setShowBulkFieldUpdate(false)}
        selectedIds={selectedIds}
        notes={notes}
        fields={fields}
        language={language}
        actorId={user?.id}
        onComplete={() => { onRefresh(); onClearSelection(); }}
      />

      {/* Bulk Status Change — inline picker */}
      {showBulkStatus && statusField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl border border-white/[0.08] bg-slate-900 p-4 shadow-2xl" dir={isHe ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100">{ta.bulkStatusChange}</h3>
              <button onClick={() => setShowBulkStatus(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <div className="space-y-1">
              {statusField.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleBulkStatusApply(opt.value)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.04] text-start"
                >
                  {opt.color && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                  {opt.label[language as 'he' | 'en' | 'ru'] || opt.label.en}
                </button>
              ))}
              {statusField.options.length === 0 && (
                <p className="py-2 text-xs text-slate-500 text-center">{ta.noStatusOptions}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign — inline input */}
      {showBulkAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl border border-white/[0.08] bg-slate-900 p-4 shadow-2xl" dir={isHe ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100">{ta.bulkAssignTitle}</h3>
              <button onClick={() => setShowBulkAssign(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('assignee') as HTMLInputElement;
              if (input.value) handleBulkAssignApply(input.value);
            }}>
              <input
                name="assignee"
                type="text"
                placeholder={ta.assigneePlaceholder}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500/40 mb-3"
                autoFocus
              />
              <button type="submit" className="w-full rounded-lg bg-purple-600 py-1.5 text-xs font-medium text-white hover:bg-purple-500">
                {ta.applyAssign}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
