'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, ChevronRight, Loader2,
  Power, PowerOff, Trash2,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchNote, fetchEntityTypes, updateNoteTitle,
  deactivateNote, reactivateNote, deleteNote,
} from '@/lib/supabase/entityQueries';
import { NoteMeta } from '@/components/entities/NoteMeta';
import { StakeholderPanel } from '@/components/entities/StakeholderPanel';
import { ActivityFeed } from '@/components/entities/ActivityFeed';
import { TemplatePicker } from '@/components/entities/TemplatePicker';
import type { NoteRecord, EntityType } from '@/lib/entities/types';

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const te = t.entities;
  const isHe = language === 'he';
  const lang = isHe ? 'he' : 'en';

  const entityTypeSlug = params.type as string;
  const noteId = params.id as string;

  const [note, setNote] = useState<NoteRecord | null>(null);
  const [etInfo, setEtInfo] = useState<EntityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Load note + entity type
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [noteData, types] = await Promise.all([
        fetchNote(noteId),
        fetchEntityTypes(),
      ]);
      if (noteData) {
        setNote(noteData);
        setTitle(noteData.title);
      }
      const et = types.find(t => t.slug === entityTypeSlug);
      if (et) setEtInfo(et);
      setLoading(false);
    })();
  }, [noteId, entityTypeSlug]);

  const handleTitleBlur = useCallback(async () => {
    if (!note || title === note.title) return;
    if (!title.trim()) { setTitle(note.title); return; }
    setSaving(true);
    await updateNoteTitle(noteId, title.trim());
    setNote(prev => prev ? { ...prev, title: title.trim(), last_edited_at: new Date().toISOString() } : prev);
    setSaving(false);
  }, [noteId, note, title]);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') titleRef.current?.blur();
    if (e.key === 'Escape') {
      setTitle(note?.title ?? '');
      titleRef.current?.blur();
    }
  };

  const handleMetaChange = useCallback((meta: Record<string, unknown>) => {
    setNote(prev => prev ? { ...prev, meta } : prev);
  }, []);

  const handleDeactivate = async () => {
    if (!note) return;
    if (note.status === 'inactive') {
      await reactivateNote(noteId);
    } else {
      await deactivateNote(noteId);
    }
    const updated = await fetchNote(noteId);
    if (updated) setNote(updated);
    setConfirmAction(null);
  };

  const handleDelete = async () => {
    await deleteNote(noteId);
    router.push(`/dashboard/entities/${entityTypeSlug}`);
  };

  const backHref = `/dashboard/entities/${entityTypeSlug}`;
  const BackArrow = isHe ? ArrowRight : ArrowLeft;
  const trackActivity = etInfo?.template_config?.track_activity ?? false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-slate-500" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-slate-400">{te.entityNotFound}</p>
        <a href={backHref} className="text-xs text-purple-400 hover:text-purple-300">
          {te.backToList}
        </a>
      </div>
    );
  }

  const isInactive = note.status === 'inactive';

  return (
    <div
      data-cc-id="entity-detail-page"
      className="max-w-6xl mx-auto px-4 py-6 space-y-6"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <a
          href={backHref}
          className="flex items-center gap-1 hover:text-purple-300 transition-colors"
        >
          <BackArrow size={14} />
          {etInfo ? (
            <span>{etInfo.icon} {etInfo.label[lang] || entityTypeSlug}</span>
          ) : (
            <span>{entityTypeSlug}</span>
          )}
        </a>
        <ChevronRight size={12} className="text-slate-600" />
        <span className="text-slate-300 truncate max-w-xs">{note.title}</span>
      </nav>

      {/* Title */}
      <div className="flex items-center gap-3">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 bg-transparent text-2xl font-bold text-slate-100 border-b border-transparent hover:border-white/[0.08] focus:border-purple-500/50 focus:outline-none py-1 transition-colors"
        />
        {saving && <Loader2 size={16} className="animate-spin text-slate-500" />}
        {isInactive && (
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400">
            {te.inactive}
          </span>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        {note.status && !isInactive && (
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5">
            {note.status}
          </span>
        )}
        <span>
          {te.createdAt}: {new Date(note.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-US')}
        </span>
        {note.last_edited_at && (
          <span>
            {te.lastEdited}: {new Date(note.last_edited_at).toLocaleDateString(isHe ? 'he-IL' : 'en-US')}
          </span>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2">
          <NoteMeta
            noteId={noteId}
            entityType={entityTypeSlug}
            meta={note.meta}
            onMetaChange={handleMetaChange}
            hideSidebar
          />
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          <TemplatePicker noteId={noteId} />
          <StakeholderPanel noteId={noteId} />
          {trackActivity && (
            <ActivityFeed noteId={noteId} language={language} />
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
        {confirmAction === null ? (
          <>
            <button
              onClick={() => setConfirmAction('deactivate')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isInactive
                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              {isInactive ? <Power size={14} /> : <PowerOff size={14} />}
              {isInactive ? te.reactivate : te.deactivate}
            </button>
            <button
              onClick={() => setConfirmAction('delete')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              {t.common.delete}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">
              {confirmAction === 'delete'
                ? te.confirmDelete
                : (te.actions.confirmDeactivate)}
            </span>
            <button
              onClick={confirmAction === 'delete' ? handleDelete : handleDeactivate}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
            >
              {t.common.confirm}
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.04]"
            >
              {t.common.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
