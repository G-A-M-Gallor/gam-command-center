'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { JSONContent } from '@tiptap/react';
import { supabase } from '@/lib/supabaseClient';
import { TiptapEditor } from '@/components/editor';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function EditorInner() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recordId) {
      setError('חסר ID — הוסף ?id=UUID לכתובת');
      setLoading(false);
      return;
    }

    async function loadRecord() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('vb_records')
        .select('id, title, content')
        .eq('id', recordId)
        .single();

      if (err || !data) {
        setError(`שגיאה בטעינה: ${err?.message || 'רשומה לא נמצאה'}`);
        setLoading(false);
        return;
      }

      setTitle(data.title || 'ללא כותרת');
      setContent(data.content || { type: 'doc', content: [{ type: 'paragraph' }] });
      setLoading(false);
    }

    loadRecord();
  }, [recordId]);

  const handleSave = useCallback(
    async (json: JSONContent) => {
      if (!recordId) return;
      setSaveStatus('saving');
      const { error: err } = await supabase
        .from('vb_records')
        .update({ content: json, last_edited_at: new Date().toISOString() })
        .eq('id', recordId);

      if (err) {
        setSaveStatus('error');
        console.error('Save failed:', err);
        return;
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    [recordId]
  );

  const handleTitleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      if (!recordId) return;
      const newTitle = e.target.value.trim();
      if (newTitle === title) return;
      setTitle(newTitle);
      await supabase
        .from('vb_records')
        .update({ title: newTitle, last_edited_at: new Date().toISOString() })
        .eq('id', recordId);
    },
    [recordId, title]
  );

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>⏳ טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" style={{ padding: '2rem' }}>
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 1.5rem' }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        placeholder="כותרת המסמך"
        style={{ width: '100%', fontSize: '1.75rem', fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: 'inherit', padding: '0.5rem 0', marginBottom: '0.5rem', direction: 'rtl', fontFamily: 'Rubik, system-ui, sans-serif' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
        {saveStatus === 'saving' && <span>💾 שומר...</span>}
        {saveStatus === 'saved' && <span style={{ color: '#059669' }}>✅ נשמר</span>}
        {saveStatus === 'error' && <span style={{ color: '#e11d48' }}>❌ שגיאה בשמירה</span>}
        {saveStatus === 'idle' && <span>Ctrl+S לשמירה</span>}
        <span style={{ marginRight: 'auto', opacity: 0.5, direction: 'ltr', fontSize: '0.6875rem' }}>{recordId?.slice(0, 8)}...</span>
      </div>
      {content && (
        <TiptapEditor
          content={content}
          onChange={() => {}}
          onSave={handleSave}
          autoFocus
          recordId={recordId || undefined}
        />
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ טוען...</div>}>
      <EditorInner />
    </Suspense>
  );
}
