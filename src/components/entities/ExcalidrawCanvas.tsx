'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';

// Dynamic import — Excalidraw doesn't support SSR
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => ({ default: mod.Excalidraw })),
  { ssr: false, loading: () => <LoadingState /> }
);

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="animate-spin text-slate-500" />
    </div>
  );
}

// ─── Supabase persistence ────────────────────────────

const META_KEY = '__excalidraw_data';

interface ExcalidrawData {
  elements: readonly Record<string, unknown>[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
}

async function loadScene(noteId: string): Promise<ExcalidrawData | null> {
  const { data } = await supabase
    .from('vb_records')
    .select('meta')
    .eq('id', noteId)
    .single();
  const meta = (data?.meta as Record<string, unknown>) ?? {};
  return (meta[META_KEY] as ExcalidrawData) ?? null;
}

async function saveScene(noteId: string, scene: ExcalidrawData): Promise<void> {
  const { data: current } = await supabase
    .from('vb_records')
    .select('meta')
    .eq('id', noteId)
    .single();
  const oldMeta = (current?.meta as Record<string, unknown>) ?? {};
  await supabase
    .from('vb_records')
    .update({ meta: { ...oldMeta, [META_KEY]: scene } })
    .eq('id', noteId);
}

// ─── Component ───────────────────────────────────────

interface Props {
  noteId: string;
  language: 'he' | 'en' | 'ru';
  height: string;
}

const LANG_MAP: Record<string, string> = {
  he: 'he-IL',
  en: 'en',
  ru: 'ru-RU',
};

export function ExcalidrawCanvas({ noteId, language, height }: Props) {
  const [initialData, setInitialData] = useState<ExcalidrawData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load scene on mount
  useEffect(() => {
    loadScene(noteId).then(data => {
      setInitialData(data);
      setLoaded(true);
    });
  }, [noteId]);

  // Debounced save
  const handleChange = useCallback(
    (elements: readonly Record<string, unknown>[], _appState: Record<string, unknown>, files: Record<string, unknown>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveScene(noteId, { elements, files });
      }, 2000);
    },
    [noteId]
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!loaded) return <LoadingState />;

  return (
    <div className={height} dir="ltr" style={{ position: 'relative' }}>
      <style>{`
        .excalidraw .App-menu_top .buttonList { direction: ltr; }
        .excalidraw { --color-primary: #8b5cf6; }
        .excalidraw .Island { background: rgba(30, 41, 59, 0.95) !important; border: 1px solid rgba(255,255,255,0.08) !important; }
        .excalidraw .App-toolbar .ToolIcon__icon { background: rgba(30, 41, 59, 0.8); }
      `}</style>
      <Excalidraw
        initialData={initialData ? {
          elements: initialData.elements as never[],
          appState: {
            theme: 'dark' as const,
            viewBackgroundColor: 'transparent',
            ...(initialData.appState ?? {}),
          },
          files: initialData.files as never,
        } : {
          appState: {
            theme: 'dark' as const,
            viewBackgroundColor: 'transparent',
          },
        }}
        onChange={handleChange as never}
        langCode={LANG_MAP[language] || 'en'}
        theme="dark"
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
