'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare, Send, Reply, Pencil, Trash2,
  ThumbsUp, Heart, Flame, Eye, CheckCircle2,
  Loader2, MoreHorizontal, X,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';

interface Comment {
  id: string;
  entity_type: string;
  record_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  mentions: string[];
  reactions: Record<string, string[]>;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface CommentThread {
  root: Comment;
  replies: Comment[];
}

interface Props {
  noteId: string;
  entityType: string;
  language: string;
}

const EMOJI_MAP: Record<string, { icon: React.ElementType; label: string }> = {
  thumbs_up: { icon: ThumbsUp, label: '👍' },
  heart: { icon: Heart, label: '❤️' },
  fire: { icon: Flame, label: '🔥' },
  eyes: { icon: Eye, label: '👀' },
  check: { icon: CheckCircle2, label: '✅' },
};

const EMOJI_KEYS = Object.keys(EMOJI_MAP) as (keyof typeof EMOJI_MAP)[];

export function CommentsSection({ noteId, entityType, language }: Props) {
  const { language: settingsLang } = useSettings();
  const lang = (language || settingsLang) as 'he' | 'en' | 'ru';
  const t = getTranslations(lang);
  const te = t.entities;
  const tc = (te as unknown as { comments?: Record<string, string> }).comments ?? {};
  const isRtl = lang === 'he';

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiBase = `/api/entities/${entityType}/${noteId}/comments`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      setComments(json.data || []);
    } catch {
      setComments([]);
    }
    setLoading(false);
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  const threads = useMemo(() => {
    const roots: CommentThread[] = [];
    const replyMap = new Map<string, Comment[]>();

    for (const c of comments) {
      if (c.parent_id) {
        const arr = replyMap.get(c.parent_id) || [];
        arr.push(c);
        replyMap.set(c.parent_id, arr);
      } else {
        roots.push({ root: c, replies: [] });
      }
    }
    for (const thread of roots) {
      thread.replies = replyMap.get(thread.root.id) || [];
    }
    return roots;
  }, [comments]);

  const handleSubmit = async () => {
    const text = newComment.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          parentId: replyTo || undefined,
          mentions: [],
        }),
      });
      setNewComment('');
      setReplyTo(null);
      await load();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editContent.trim() }),
      });
      setEditingId(null);
      setEditContent('');
      await load();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    try {
      await fetch(apiBase, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const handleReaction = async (commentId: string, emoji: string, action: 'add' | 'remove') => {
    try {
      await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, emoji, action }),
      });
      await load();
    } catch { /* ignore */ }
    setShowEmojiFor(null);
  };

  const startReply = (commentId: string) => {
    setReplyTo(commentId);
    inputRef.current?.focus();
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return tc.justNow || (lang === 'he' ? 'עכשיו' : 'now');
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`group rounded-lg bg-white/[0.02] border border-white/[0.04] p-2.5 ${isReply ? 'ms-6' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
          <MessageSquare size={10} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          {editingId === comment.id ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEdit(comment.id)}
                className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
                autoFocus
              />
              <button onClick={() => handleEdit(comment.id)} disabled={submitting} className="text-purple-400 hover:text-purple-300">
                <Send size={12} />
              </button>
              <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300">
                <X size={12} />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-300 break-words">{comment.content}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-slate-600">{formatTime(comment.created_at)}</span>
            {comment.is_edited && (
              <span className="text-[9px] text-slate-600 italic">{tc.edited || (lang === 'he' ? '(נערך)' : '(edited)')}</span>
            )}
          </div>

          {/* Reactions display */}
          {Object.keys(comment.reactions || {}).length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {Object.entries(comment.reactions).map(([emoji, users]) => {
                const info = EMOJI_MAP[emoji];
                if (!info || !users.length) return null;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment.id, emoji, 'remove')}
                    className="flex items-center gap-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-white/[0.08]"
                  >
                    {info.label} <span>{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isReply && (
            <button onClick={() => startReply(comment.id)} className="p-1 text-slate-600 hover:text-slate-300 rounded" title={tc.reply || 'Reply'}>
              <Reply size={11} />
            </button>
          )}
          <button onClick={() => startEdit(comment)} className="p-1 text-slate-600 hover:text-slate-300 rounded" title={tc.edit || 'Edit'}>
            <Pencil size={11} />
          </button>
          <button onClick={() => handleDelete(comment.id)} className="p-1 text-slate-600 hover:text-red-400 rounded" title={tc.delete || 'Delete'}>
            <Trash2 size={11} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEmojiFor(showEmojiFor === comment.id ? null : comment.id)}
              className="p-1 text-slate-600 hover:text-slate-300 rounded"
            >
              <MoreHorizontal size={11} />
            </button>
            {showEmojiFor === comment.id && (
              <div className="absolute end-0 top-full mt-1 z-10 flex gap-0.5 rounded-lg bg-slate-800 border border-white/[0.08] p-1 shadow-lg">
                {EMOJI_KEYS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment.id, emoji, 'add')}
                    className="p-1 rounded hover:bg-white/[0.08] text-sm"
                    title={emoji}
                  >
                    {EMOJI_MAP[emoji].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-t border-white/[0.04] pt-3" dir={isRtl ? 'rtl' : 'ltr'}>
      <h4 className="text-[10px] font-medium text-slate-400 mb-2">
        {tc.title || (lang === 'he' ? 'תגובות' : 'Comments')}
      </h4>

      {/* Input */}
      <div className="mb-3 space-y-1.5">
        {replyTo && (
          <div className="flex items-center gap-1.5 text-[10px] text-purple-400">
            <Reply size={10} />
            <span>{tc.replyingTo || (lang === 'he' ? 'מגיב ל...' : 'Replying to...')}</span>
            <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-300">
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={tc.writeComment || (lang === 'he' ? 'כתוב תגובה...' : 'Write a comment...')}
            className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="rounded bg-purple-600/20 px-2 py-1.5 text-purple-300 hover:bg-purple-600/30 disabled:opacity-40"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-[10px] text-slate-600 py-2">{te.loading}</div>
      ) : threads.length === 0 ? (
        <div className="text-[10px] text-slate-600 py-2">
          {tc.noComments || (lang === 'he' ? 'אין תגובות עדיין' : 'No comments yet')}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {threads.map(thread => (
            <div key={thread.root.id} className="space-y-1">
              {renderComment(thread.root)}
              {thread.replies.map(reply => renderComment(reply, true))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
