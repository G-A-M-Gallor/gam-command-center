'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JSONContent } from '@tiptap/react';
import { FileText, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { TiptapEditor } from '@/components/editor';
import type { SaveState } from '@/lib/editor/useAutoSave';

interface Props {
  noteId: string;
  language: string;
}

const LABELS: Record<string, Record<string, string>> = {
  he: { content: 'תוכן', loading: 'טוען...', collapse: 'כווץ', expand: 'הרחב' },
  en: { content: 'Content', loading: 'Loading...', collapse: 'Collapse', expand: 'Expand' },
  ru: { content: 'Содержание', loading: 'Загрузка...', collapse: 'Свернуть', expand: 'Развернуть' },
};

const DEFAULT_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function EntityContentEditor({ noteId, language }: Props) {
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
  const l = LABELS[lang];
  const isRtl = lang === 'he';

  const [content, setContent] = useState<JSONContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load content
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('vb_records')
        .select('content')
        .eq('id', noteId)
        .single();
      setContent(data?.content || DEFAULT_CONTENT);
      setLoading(false);
    })();
  }, [noteId]);

  // Debounced save
  const handleChange = useCallback((json: JSONContent) => {
    setContent(json);
    setSaveState('saving');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('vb_records')
        .update({ content: json, last_edited_at: new Date().toISOString() })
        .eq('id', noteId);
      if (error) {
        setSaveState('error');
      } else {
        setSaveState('saved');
        setLastSavedAt(new Date());
        setTimeout(() => setSaveState('idle'), 2000);
      }
    }, 1000);
  }, [noteId]);

  const handleSave = useCallback((json: JSONContent) => {
    handleChange(json);
  }, [handleChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        {l.loading}
      </div>
    );
  }

  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-start hover:bg-white/[0.02] transition-colors rounded-t-lg"
      >
        <FileText size={14} className="text-purple-400 shrink-0" />
        <span className="text-xs font-medium text-slate-300 flex-1">{l.content}</span>
        {saveState === 'saving' && <Loader2 size={12} className="animate-spin text-slate-500" />}
        {saveState === 'saved' && <span className="text-[10px] text-emerald-400/70">✓</span>}
        {saveState === 'error' && <span className="text-[10px] text-red-400">✗</span>}
        <Chevron size={14} className="text-slate-500" />
      </button>

      {/* Editor */}
      {!collapsed && content && (
        <div className="border-t border-white/[0.04] px-1 py-1 min-h-[120px]">
          <TiptapEditor
            content={content}
            onChange={handleChange}
            onSave={handleSave}
            recordId={noteId}
            saveStatus={saveState}
            lastSavedAt={lastSavedAt}
          />
        </div>
      )}
    </div>
  );
}
