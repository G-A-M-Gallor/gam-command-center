"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// Excalidraw types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;

interface Props {
  entityId: string;
}

async function loadWhiteboardData(entityId: string) {
  const { data } = await supabase
    .from("whiteboard_data")
    .select("elements, app_state")
    .eq("context_type", "vnote")
    .eq("context_id", entityId)
    .maybeSingle();
  return data;
}

async function saveWhiteboardData(
  entityId: string,
  elements: ExcalidrawElement[],
  appState: AppState
) {
  await supabase.from("whiteboard_data").upsert(
    {
      context_type: "vnote",
      context_id: entityId,
      elements,
      app_state: {
        viewBackgroundColor: appState?.viewBackgroundColor,
        zoom: appState?.zoom,
        scrollX: appState?.scrollX,
        scrollY: appState?.scrollY,
      },
    },
    { onConflict: "context_type,context_id" }
  );
}

export function VNoteWhiteboard({ entityId }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Excalidraw, setExcalidraw] = useState<any>(null);
  const [initialData, setInitialData] = useState<{
    elements: ExcalidrawElement[];
    appState: AppState;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawRef = useRef<any>(null);

  // Load Excalidraw dynamically
  useEffect(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
    });
  }, []);

  // Load saved data
  useEffect(() => {
    loadWhiteboardData(entityId).then((data) => {
      setInitialData({
        elements: data?.elements ?? [],
        appState: data?.app_state ?? {},
      });
      setLoaded(true);
    });
  }, [entityId]);

  // Auto-save with debounce
  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveWhiteboardData(entityId, [...elements], appState);
      }, 3000);
    },
    [entityId]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!Excalidraw || !loaded) {
    return (
      <div className="flex items-center justify-center h-[400px] text-xs text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mr-2" />
        טוען Whiteboard...
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-slate-700" dir="ltr">
      <Excalidraw
        ref={excalidrawRef}
        initialData={{
          elements: initialData?.elements ?? [],
          appState: {
            viewBackgroundColor: "#0f172a",
            theme: "dark",
            ...(initialData?.appState ?? {}),
          },
        }}
        onChange={handleChange}
        theme="dark"
        langCode="he-IL"
      />
    </div>
  );
}
