'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';

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

// ─── Router (decides list vs canvas editor) ──────
function EditorRouter() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');

  if (recordId) {
    return (
      <div className="h-[calc(100vh-88px)]">
        <CanvasEditor recordId={recordId} />
      </div>
    );
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
