'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import { DocumentListView } from '@/components/editor/DocumentListView';

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

  return <DocumentListView />;
}

// ─── Page Export ──────────────────────────────────
export default function EditorPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ טוען...</div>}>
      <EditorRouter />
    </Suspense>
  );
}
