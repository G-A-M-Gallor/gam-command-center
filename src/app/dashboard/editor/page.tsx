'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { JSONContent } from '@tiptap/react';
import { supabase } from '@/lib/supabaseClient';
import { TiptapEditor } from '@/components/editor';

// ─── Types ───────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DocRecord {
  id: string;
  title: string;
  status: string | null;
  created_at: string;
  last_edited_at: string;
}

// ─── Document List (no ?id=) ─────────────────────
function DocumentList() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      const { data } = await supabase
        .from('vb_records')
        .select('id, title, status, created_at, last_edited_at')
        .eq('record_type', 'document')
        .eq('is_deleted', false)
        .order('last_edited_at', { ascending: false })
        .limit(50);

      setDocs(data || []);
      setLoading(false);
    }
    loadDocs();
  }, []);

  const createNewDoc = async () => {
    setCreating(true);

    // Get workspace + entity IDs from existing record
    const { data: existing } = await supabase
      .from('vb_records')
      .select('workspace_id, entity_id, created_by')
      .eq('record_type', 'document')
      .limit(1)
      .single();

    if (!existing) {
      alert('שגיאה: לא נמצא workspace. צור מסמך ראשון דרך המערכת.');
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('vb_records')
      .insert({
        workspace_id: existing.workspace_id,
        entity_id: existing.entity_id,
        created_by: existing.created_by,
        title: 'מסמך חדש',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        record_type: 'document',
        source: 'manual',
        status: 'active',
      })
      .select('id')
      .single();

    if (error || !data) {
      alert('שגיאה ביצירת מסמך');
      setCreating(false);
      return;
    }

    router.push(`/dashboard/editor?id=${data.id}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        ⏳ טוען מסמכים...
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>📄 מסמכים</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0' }}>
            {docs.length} מסמכים
          </p>
        </div>
        <button
          onClick={createNewDoc}
          disabled={creating}
          style={{
            padding: '10px 20px',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: creating ? 'wait' : 'pointer',
            opacity: creating ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {creating ? '⏳ יוצר...' : '➕ מסמך חדש'}
        </button>
      </div>

      {docs.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '12px',
          border: '2px dashed rgba(99, 102, 241, 0.2)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
          <p style={{ color: '#64748b', margin: 0 }}>אין מסמכים עדיין. לחץ על "מסמך חדש" ליצירת הראשון.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/dashboard/editor?id=${doc.id}`)}
              style={{
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(99, 102, 241, 0.08)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {doc.title || 'ללא כותרת'}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
                  עודכן: {formatDate(doc.last_edited_at)}
                </div>
              </div>
              <span style={{ color: '#64748b', fontSize: '1.25rem' }}>←</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Editor View (with ?id=) ─────────────────────
function EditorView({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
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
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ טוען...</div>;
  }

  if (error) {
    return (
      <div dir="rtl" style={{ padding: '2rem' }}>
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Back button + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
        <button
          onClick={() => router.push('/dashboard/editor')}
          style={{
            padding: '4px 10px',
            fontSize: '0.8125rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#94a3b8',
          }}
        >
          ← חזרה למסמכים
        </button>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {saveStatus === 'saving' && '💾 שומר...'}
          {saveStatus === 'saved' && '✅ נשמר'}
          {saveStatus === 'error' && '❌ שגיאה'}
          {saveStatus === 'idle' && 'Ctrl+S לשמירה'}
        </span>
        <span style={{ marginRight: 'auto', opacity: 0.4, direction: 'ltr', fontSize: '0.6875rem' }}>
          {recordId.slice(0, 8)}...
        </span>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        placeholder="כותרת המסמך"
        style={{
          width: '100%',
          fontSize: '1.75rem',
          fontWeight: 700,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'inherit',
          padding: '0.5rem 0',
          marginBottom: '0.5rem',
          direction: 'rtl',
          fontFamily: 'Rubik, system-ui, sans-serif',
        }}
      />

      {/* Editor */}
      {content && (
        <TiptapEditor
          content={content}
          onChange={() => {}}
          onSave={handleSave}
          autoFocus
          recordId={recordId}
        />
      )}
    </div>
  );
}

// ─── Router (decides list vs editor) ─────────────
function EditorRouter() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');

  if (recordId) {
    return <EditorView recordId={recordId} />;
  }

  return <DocumentList />;
}

// ─── Page Export ──────────────────────────────────
export default function EditorPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ טוען...</div>}>
      <EditorRouter />
    </Suspense>
  );
}
