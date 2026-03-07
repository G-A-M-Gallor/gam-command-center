'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/command-center/PageHeader';

const CanvasEditor = dynamic(
  () => import('@/components/canvas/CanvasEditor').then((m) => ({ default: m.CanvasEditor })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-96 bg-slate-800/50 rounded-lg" />,
  }
);

const DocumentListView = dynamic(
  () => import('@/components/editor/DocumentListView').then((m) => ({ default: m.DocumentListView })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-64 bg-slate-800/50 rounded-lg" />,
  }
);

// ─── Router (decides list vs canvas editor) ──────
function EditorRouter() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');

  if (recordId) {
    return (
      <div className="h-[calc(100dvh-48px)]">
        <CanvasEditor recordId={recordId} />
      </div>
    );
  }

  return (
    <>
      <PageHeader pageKey="editor" />
      <DocumentListView />
    </>
  );
}

// ─── Page Export ──────────────────────────────────
export default function EditorPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ טוען...</div>}>
      <EditorRouter />
    </Suspense>
  );
}
