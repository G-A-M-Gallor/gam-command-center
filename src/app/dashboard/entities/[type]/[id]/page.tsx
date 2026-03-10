'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, ChevronRight, Loader2,
  Power, PowerOff, Trash2, Lock,
  Type, CircleDot, UserCircle, Calendar, Clock,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import {
  fetchNote, fetchEntityTypes, fetchGlobalFields, updateNoteTitle,
  deactivateNote, reactivateNote, deleteNote,
} from '@/lib/supabase/entityQueries';
import { NoteMeta } from '@/components/entities/NoteMeta';
import { NoteActionBar } from '@/components/entities/NoteActionBar';
import { StakeholderPanel } from '@/components/entities/StakeholderPanel';
import { ActivityFeed } from '@/components/entities/ActivityFeed';
import { CommentsSection } from '@/components/entities/CommentsSection';
import { EntityContentEditor } from '@/components/entities/EntityContentEditor';
import { TemplatePicker } from '@/components/entities/TemplatePicker';
import { RelationPanel } from '@/components/entities/RelationPanel';
import { IconPicker, IconDisplay } from '@/components/ui/IconPicker';
import { SYSTEM_FIELDS } from '@/lib/entities/builtinFields';
import { updateNoteMeta } from '@/lib/supabase/entityQueries';
import { resolveActions } from '@/lib/entities/resolveActions';
import { executeAction } from '@/lib/entities/actionHandlers';
import { resolveActionIcon } from '@/lib/entities/actionIconMap';
import type { NoteRecord, EntityType, GlobalField } from '@/lib/entities/types';

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const te = t.entities;
  const isRtl = language === 'he';
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
  const LOCALE_MAP: Record<string, string> = { he: 'he-IL', en: 'en-US', ru: 'ru-RU' };

  const entityTypeSlug = params.type as string;
  const noteId = params.id as string;

  const [note, setNote] = useState<NoteRecord | null>(null);
  const [etInfo, setEtInfo] = useState<EntityType | null>(null);
  const [fields, setFields] = useState<GlobalField[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | null>(null);
  const [headerActionLoading, setHeaderActionLoading] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Load note + entity type
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [noteData, types, globalFields] = await Promise.all([
        fetchNote(noteId),
        fetchEntityTypes(),
        fetchGlobalFields(),
      ]);
      if (noteData) {
        setNote(noteData);
        setTitle(noteData.title);
      }
      const et = types.find(t => t.slug === entityTypeSlug);
      if (et) setEtInfo(et);
      setFields(globalFields);
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

  const handleIconChange = useCallback(async (icon: string) => {
    if (!note) return;
    const newMeta = { ...note.meta, __icon: icon };
    await updateNoteMeta(noteId, { __icon: icon });
    setNote(prev => prev ? { ...prev, meta: newMeta } : prev);
  }, [noteId, note]);

  const handleNoteRefresh = useCallback(async () => {
    const updated = await fetchNote(noteId);
    if (updated) { setNote(updated); setTitle(updated.title); }
  }, [noteId]);

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

  const headerActions = note
    ? resolveActions(etInfo?.template_config, { scope: 'single', position: 'detail_header', note })
    : [];

  const handleHeaderAction = useCallback(async (actionId: string) => {
    if (!note) return;
    const action = headerActions.find(a => a.id === actionId);
    if (!action) return;
    setHeaderActionLoading(actionId);
    const result = await executeAction(action, [note.id], entityTypeSlug, {
      language, fields, notes: [note], onRefresh: handleNoteRefresh,
    });
    setHeaderActionLoading(null);
    if (result.success) handleNoteRefresh();
  }, [note, headerActions, entityTypeSlug, language, fields, handleNoteRefresh]);

  const backHref = `/dashboard/entities/${entityTypeSlug}`;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
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
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <a
          href={backHref}
          className="flex items-center gap-1 hover:text-purple-300 transition-colors"
        >
          <BackArrow size={14} />
          {etInfo ? (
            <span className="flex items-center gap-1"><IconDisplay value={etInfo.icon} size={14} className="text-slate-400" /> {etInfo.label[lang] || entityTypeSlug}</span>
          ) : (
            <span>{entityTypeSlug}</span>
          )}
        </a>
        <ChevronRight size={12} className="text-slate-600" />
        <span className="text-slate-300 truncate max-w-xs">{note.title}</span>
      </nav>

      {/* Title */}
      <div className="flex items-center gap-3">
        <IconPicker
          value={note.meta.__icon as string | undefined}
          onChange={handleIconChange}
          size={28}
        />
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
        {headerActions.length > 0 && (
          <div className="flex items-center gap-1">
            {headerActions.map(action => {
              const Icon = resolveActionIcon(action.icon);
              const isLoading = headerActionLoading === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleHeaderAction(action.id)}
                  disabled={isLoading}
                  className={`rounded-md p-1.5 transition-colors text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 ${isLoading ? 'opacity-50' : ''}`}
                  title={action.label[lang] || action.label.en}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                </button>
              );
            })}
          </div>
        )}
        {isInactive && (
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400">
            {te.inactive}
          </span>
        )}
      </div>

      {/* System Fields strip */}
      <div className="rounded-lg border border-purple-500/15 bg-purple-500/[0.03] p-3">
        <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-medium text-amber-400/80">
          <Lock size={11} />
          {te.systemFields}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SYSTEM_FIELDS.map(sf => {
            const IconMap: Record<string, React.ElementType> = {
              Type, CircleDot, UserCircle, Calendar, Clock,
            };
            const SfIcon = IconMap[sf.icon] ?? Type;
            const raw = note[sf.noteField as keyof NoteRecord];
            let display: string;
            if (raw == null || raw === '') {
              display = '—';
            } else if (sf.noteField === 'created_at' || sf.noteField === 'last_edited_at') {
              display = new Date(raw as string).toLocaleDateString(LOCALE_MAP[lang] ?? 'en-US', {
                day: '2-digit', month: '2-digit', year: '2-digit',
              });
            } else {
              display = String(raw);
            }
            return (
              <div key={sf.key} className="flex flex-col gap-1 rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <SfIcon size={11} />
                  {sf.label[lang]}
                </div>
                <span className="text-xs text-slate-200 truncate" title={display}>
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-width fields */}
      <NoteMeta
        noteId={noteId}
        entityType={entityTypeSlug}
        meta={note.meta}
        onMetaChange={handleMetaChange}
        hideSidebar
        columns={3}
      />

      {/* Content Editor */}
      <EntityContentEditor noteId={noteId} language={language} />

      {/* Tools strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TemplatePicker noteId={noteId} />
        <StakeholderPanel noteId={noteId} />
        <RelationPanel noteId={noteId} entityType={entityTypeSlug} language={language} />
        {trackActivity && (
          <>
            <CommentsSection noteId={noteId} entityType={entityTypeSlug} language={language} />
            <ActivityFeed noteId={noteId} language={language} hideCommentInput />
          </>
        )}
      </div>

      {/* Single-scope action buttons */}
      <NoteActionBar
        note={note}
        entityType={entityTypeSlug}
        templateConfig={etInfo?.template_config}
        language={language}
        fields={fields}
        onRefresh={handleNoteRefresh}
      />

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
