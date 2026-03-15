'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  RefreshCw, Trash2, PowerOff, Edit3, ChevronDown, X, Check,
} from 'lucide-react';
import { getTranslations } from '@/lib/i18n';
import { bulkUpdateMeta, deactivateNote, deleteNote } from '@/lib/supabase/entityQueries';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { Language } from '@/contexts/SettingsContext';
import type { GlobalField } from '@/lib/entities/types';

interface BulkActionBarProps {
  selectedIds: Set<string>;
  entityType: string;
  fields: GlobalField[];
  language: string;
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkActionBar({
  selectedIds,
  fields,
  language,
  onClearSelection,
  onRefresh,
}: BulkActionBarProps) {
  const t = getTranslations(language as Language);
  const tb = t.entities.bulkBar;
  const isRtl = language === 'he';
  const lang = language as 'he' | 'en' | 'ru';
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'deactivate' | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFieldPopover, setShowFieldPopover] = useState(false);

  // Field update popover state
  const [selectedFieldKey, setSelectedFieldKey] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const fieldPopoverRef = useRef<HTMLDivElement>(null);

  const count = selectedIds.size;
  const isVisible = count > 0;

  // Find the first select field as "status" field
  const statusField = useMemo(() => {
    return fields.find(f => f.field_type === 'select');
  }, [fields]);

  // Editable fields (exclude read-only)
  const editableFields = useMemo(() => {
    return fields.filter(f => !f.read_only);
  }, [fields]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showStatusDropdown && !showFieldPopover) return;
    const handler = (e: MouseEvent) => {
      if (showStatusDropdown && statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (showFieldPopover && fieldPopoverRef.current && !fieldPopoverRef.current.contains(e.target as Node)) {
        setShowFieldPopover(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusDropdown, showFieldPopover]);

  // Reset confirm state on selection change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setConfirmAction(null);
  }, [count]);

  // ─── Handlers ──────────────────────────────────────

  const handleStatusUpdate = useCallback(async (statusValue: string) => {
    if (!statusField) return;
    setLoading(true);
    setShowStatusDropdown(false);
    await bulkUpdateMeta([...selectedIds], { [statusField.meta_key]: statusValue }, {
      trackActivity: true,
      actorId: user?.id ?? null,
    });
    setLoading(false);
    toast({ message: tb.success, type: 'success' });
    onRefresh();
    onClearSelection();
  }, [selectedIds, statusField, user, onRefresh, onClearSelection, toast, tb]);

  const handleFieldUpdate = useCallback(async () => {
    if (!selectedFieldKey || !fieldValue) return;
    setLoading(true);
    setShowFieldPopover(false);
    await bulkUpdateMeta([...selectedIds], { [selectedFieldKey]: fieldValue }, {
      trackActivity: true,
      actorId: user?.id ?? null,
    });
    setLoading(false);
    setSelectedFieldKey('');
    setFieldValue('');
    toast({ message: tb.success, type: 'success' });
    onRefresh();
    onClearSelection();
  }, [selectedIds, selectedFieldKey, fieldValue, user, onRefresh, onClearSelection, toast, tb]);

  const handleDeactivate = useCallback(async () => {
    if (confirmAction !== 'deactivate') {
      setConfirmAction('deactivate');
      return;
    }
    setLoading(true);
    setConfirmAction(null);
    const ids = [...selectedIds];
    for (const id of ids) {
      await deactivateNote(id, user?.id ?? null);
    }
    setLoading(false);
    toast({ message: tb.success, type: 'success' });
    onRefresh();
    onClearSelection();
  }, [confirmAction, selectedIds, user, onRefresh, onClearSelection, toast, tb]);

  const handleDelete = useCallback(async () => {
    if (confirmAction !== 'delete') {
      setConfirmAction('delete');
      return;
    }
    setLoading(true);
    setConfirmAction(null);
    const ids = [...selectedIds];
    for (const id of ids) {
      await deleteNote(id);
    }
    setLoading(false);
    toast({ message: tb.success, type: 'success' });
    onRefresh();
    onClearSelection();
  }, [confirmAction, selectedIds, onRefresh, onClearSelection, toast, tb]);

  // ─── Render ────────────────────────────────────────

  return (
    <div
      data-cc-id="bulk-action-bar"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-2 bg-slate-800/95 backdrop-blur-md border border-white/[0.08] rounded-2xl shadow-2xl px-4 py-3">
        {/* Selection count */}
        <span className="text-sm font-medium text-purple-300 whitespace-nowrap">
          {count} {tb.nSelected}
        </span>

        <div className="h-5 w-px bg-white/[0.08] mx-1" />

        {/* Update Status */}
        {statusField && statusField.options.length > 0 && (
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => { setShowStatusDropdown(s => !s); setShowFieldPopover(false); setConfirmAction(null); }}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-2.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/15 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} />
              {tb.updateStatus}
              <ChevronDown size={11} />
            </button>
            {showStatusDropdown && (
              <div className="absolute bottom-full mb-2 start-0 z-50 w-48 rounded-lg border border-white/[0.08] bg-slate-800 p-1.5 shadow-xl">
                {statusField.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusUpdate(opt.value)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] text-start transition-colors"
                  >
                    {opt.color && (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    {opt.label[lang] || opt.label.en}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Update Field */}
        <div className="relative" ref={fieldPopoverRef}>
          <button
            onClick={() => { setShowFieldPopover(s => !s); setShowStatusDropdown(false); setConfirmAction(null); }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-2.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/15 transition-colors disabled:opacity-50"
          >
            <Edit3 size={13} />
            {tb.updateField}
          </button>
          {showFieldPopover && (
            <div className="absolute bottom-full mb-2 start-0 z-50 w-64 rounded-lg border border-white/[0.08] bg-slate-800 p-3 shadow-xl space-y-2">
              <select
                value={selectedFieldKey}
                onChange={e => { setSelectedFieldKey(e.target.value); setFieldValue(''); }}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
              >
                <option value="">{tb.selectField}</option>
                {editableFields.map(f => (
                  <option key={f.meta_key} value={f.meta_key}>
                    {f.label[lang] || f.label.en}
                  </option>
                ))}
              </select>

              {selectedFieldKey && (() => {
                const selectedField = fields.find(f => f.meta_key === selectedFieldKey);
                if (selectedField && selectedField.field_type === 'select' && selectedField.options.length > 0) {
                  return (
                    <select
                      value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">{tb.enterValue}</option>
                      {selectedField.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label[lang] || opt.label.en}
                        </option>
                      ))}
                    </select>
                  );
                }
                return (
                  <input
                    type={selectedField?.field_type === 'number' ? 'number' : selectedField?.field_type === 'date' ? 'date' : 'text'}
                    value={fieldValue}
                    onChange={e => setFieldValue(e.target.value)}
                    placeholder={tb.enterValue}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                    autoFocus
                  />
                );
              })()}

              <button
                onClick={handleFieldUpdate}
                disabled={!selectedFieldKey || !fieldValue}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={12} />
                {tb.apply}
              </button>
            </div>
          )}
        </div>

        {/* Deactivate */}
        {confirmAction === 'deactivate' ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5">
            <span className="text-[11px] text-amber-300 whitespace-nowrap">{tb.confirmDeactivate}</span>
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="rounded px-2 py-0.5 text-[11px] bg-amber-600/30 text-amber-200 hover:bg-amber-600/50 transition-colors disabled:opacity-50"
            >
              {t.common.confirm}
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/15 transition-colors disabled:opacity-50"
          >
            <PowerOff size={13} />
            {tb.deactivate}
          </button>
        )}

        {/* Delete */}
        {confirmAction === 'delete' ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5">
            <span className="text-[11px] text-red-300 whitespace-nowrap">{tb.confirmDelete}</span>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded px-2 py-0.5 text-[11px] bg-red-600/30 text-red-200 hover:bg-red-600/50 transition-colors disabled:opacity-50"
            >
              {t.common.confirm}
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
            {tb.delete}
          </button>
        )}

        <div className="h-5 w-px bg-white/[0.08] mx-1" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title={t.common.close}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
