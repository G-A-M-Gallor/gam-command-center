'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Phone, ArrowRight, Plus, Trash2,
  UserPlus, UserMinus, Power, Send,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { fetchActivityLog, addComment, addCallLogEntry } from '@/lib/supabase/entityQueries';
import type { ActivityLogEntry, ActivityType, I18nLabel } from '@/lib/entities/types';

interface Props {
  noteId: string;
  language: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  field_change: ArrowRight,
  status_change: ArrowRight,
  comment: MessageSquare,
  call_log: Phone,
  relation_added: Plus,
  relation_removed: Trash2,
  stakeholder_added: UserPlus,
  stakeholder_removed: UserMinus,
  created: Plus,
  deactivated: Power,
  reactivated: Power,
};

function activityLabel(type: ActivityType, lang: string): string {
  const labels: Record<ActivityType, { he: string; en: string }> = {
    field_change: { he: 'שינוי שדה', en: 'Field changed' },
    status_change: { he: 'שינוי סטטוס', en: 'Status changed' },
    comment: { he: 'תגובה', en: 'Comment' },
    call_log: { he: 'שיחה', en: 'Call' },
    relation_added: { he: 'קשר נוסף', en: 'Relation added' },
    relation_removed: { he: 'קשר הוסר', en: 'Relation removed' },
    stakeholder_added: { he: 'בעל עניין נוסף', en: 'Stakeholder added' },
    stakeholder_removed: { he: 'בעל עניין הוסר', en: 'Stakeholder removed' },
    created: { he: 'נוצר', en: 'Created' },
    deactivated: { he: 'הושבת', en: 'Deactivated' },
    reactivated: { he: 'הופעל מחדש', en: 'Reactivated' },
  };
  return labels[type]?.[lang === 'he' ? 'he' : 'en'] ?? type;
}

function formatTime(iso: string, lang: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return lang === 'he' ? 'עכשיו' : 'now';
  if (diffMin < 60) return lang === 'he' ? `לפני ${diffMin} דק׳` : `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return lang === 'he' ? `לפני ${diffH} שע׳` : `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return lang === 'he' ? `לפני ${diffD} ימים` : `${diffD}d ago`;
  return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' });
}

export function ActivityFeed({ noteId, language }: Props) {
  const lang = language === 'he' ? 'he' : 'en';
  const t = getTranslations(language as 'he' | 'en' | 'ru');
  const te = t.entities;
  const isHe = language === 'he';

  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [mode, setMode] = useState<'comment' | 'call'>('comment');
  const [callSummary, setCallSummary] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchActivityLog(noteId);
    setEntries(data);
    setLoading(false);
  }, [noteId]);

  useEffect(() => { load(); }, [load]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(noteId, commentText.trim());
    setCommentText('');
    await load();
  };

  const handleAddCallLog = async () => {
    if (!callSummary.trim()) return;
    await addCallLogEntry(noteId, callSummary.trim());
    setCallSummary('');
    await load();
  };

  return (
    <div className="border-t border-white/[0.04] pt-3" dir={isHe ? 'rtl' : 'ltr'}>
      <h4 className="text-[10px] font-medium text-slate-400 mb-2">
        {te.activity ?? (isHe ? 'פעילות' : 'Activity')}
      </h4>

      {/* Input area */}
      <div className="mb-3 space-y-2">
        <div className="flex gap-1 text-[10px]">
          <button
            onClick={() => setMode('comment')}
            className={`px-2 py-1 rounded ${mode === 'comment' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MessageSquare size={10} className="inline me-1" />
            {te.comment ?? (isHe ? 'תגובה' : 'Comment')}
          </button>
          <button
            onClick={() => setMode('call')}
            className={`px-2 py-1 rounded ${mode === 'call' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Phone size={10} className="inline me-1" />
            {te.callLog ?? (isHe ? 'שיחה' : 'Call')}
          </button>
        </div>

        {mode === 'comment' && (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              placeholder={isHe ? 'הוסף תגובה...' : 'Add comment...'}
              className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              onClick={handleAddComment}
              className="rounded bg-purple-600/20 px-2 py-1.5 text-purple-300 hover:bg-purple-600/30"
            >
              <Send size={12} />
            </button>
          </div>
        )}

        {mode === 'call' && (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={callSummary}
              onChange={e => setCallSummary(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCallLog()}
              placeholder={isHe ? 'סיכום שיחה...' : 'Call summary...'}
              className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              onClick={handleAddCallLog}
              className="rounded bg-purple-600/20 px-2 py-1.5 text-purple-300 hover:bg-purple-600/30"
            >
              <Send size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-[10px] text-slate-600 py-2">{isHe ? 'טוען...' : 'Loading...'}</div>
      ) : entries.length === 0 ? (
        <div className="text-[10px] text-slate-600 py-2">{isHe ? 'אין פעילות עדיין' : 'No activity yet'}</div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {entries.map(entry => {
            const Icon = ACTIVITY_ICONS[entry.activity_type] ?? ArrowRight;
            return (
              <div key={entry.id} className="flex items-start gap-2 text-[11px]">
                <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center">
                  <Icon size={10} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-300 font-medium">
                    {activityLabel(entry.activity_type, lang)}
                  </span>
                  {entry.field_key && (
                    <span className="text-slate-500 ms-1">
                      {entry.field_key}
                    </span>
                  )}
                  {entry.old_value && entry.new_value && (
                    <span className="text-slate-500 ms-1">
                      <span className="line-through text-red-400/60">{entry.old_value}</span>
                      {' → '}
                      <span className="text-emerald-400/80">{entry.new_value}</span>
                    </span>
                  )}
                  {entry.note_text && (
                    <p className="text-slate-400 mt-0.5 break-words">{entry.note_text}</p>
                  )}
                </div>
                <span className="text-[9px] text-slate-600 shrink-0">
                  {formatTime(entry.created_at, lang)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
