"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { CanvasContext } from "@/lib/vcanvas/canvasConfig";

// Excalidraw v0.17 does not require explicit CSS import
// CSS is bundled within the component

const ExcalidrawWrapper = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => ({ default: mod.Excalidraw })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <Loader2 size={20} className="animate-spin text-slate-500" />
      </div>
    ),
  }
);

// ─── Persistence ─────────────────────────────────────

const STORAGE_KEY_PREFIX = "cc-vcanvas:";

interface ExcalidrawData {
  elements: readonly Record<string, unknown>[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
}

function loadScene(key: string): ExcalidrawData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveScene(key: string, scene: ExcalidrawData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(scene));
  } catch {
    // Ignore errors
  }
}

// ─── Language Map ────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  he: "he-IL",
  en: "en",
  ru: "ru-RU",
};

// ─── Component ───────────────────────────────────────

export type VCanvasMode = "vCanvas" | "vNote";

interface Props {
  /** Unique persistence key — each canvas gets its own storage */
  persistenceKey: string;
  /** Which context controls feature toggles */
  context: CanvasContext;
  /** Display mode — "vCanvas" for standalone, "vNote" for entity whiteboard */
  mode: VCanvasMode;
  /** Language */
  language: "he" | "en" | "ru";
  /** Height class */
  className?: string;
}

export function VCanvas({ persistenceKey, _context, mode, language, className = "h-full" }: Props) {
  const [initialData, setInitialData] = useState<ExcalidrawData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load scene on mount
  useEffect(() => {
    const data = loadScene(persistenceKey);
    setInitialData(data);
    setLoaded(true);
  }, [persistenceKey]);

  // Debounced save
  const handleChange = useCallback(
    (elements: readonly Record<string, unknown>[], _appState: Record<string, unknown>, files: Record<string, unknown>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveScene(persistenceKey, { elements, files });
      }, 2000);
    },
    [persistenceKey]
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!loaded) {
    return (
      <div className={`flex items-center justify-center bg-slate-950 ${className}`}>
        <Loader2 size={20} className="animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className={className} dir="ltr" style={{ position: "relative" }}>
      <style>{`
        .excalidraw .App-menu_top .buttonList { direction: ltr; }
        .excalidraw { --color-primary: #8b5cf6; }
        .excalidraw .Island { background: rgba(30, 41, 59, 0.95) !important; border: 1px solid rgba(255,255,255,0.08) !important; }
        .excalidraw .App-toolbar .ToolIcon__icon { background: rgba(30, 41, 59, 0.8); }
        /* Hide Excalidraw branding */
        .excalidraw .excalidraw-logo-icon,
        .excalidraw a[href*="excalidraw"],
        .excalidraw .welcome-screen-center__logo { display: none !important; }
      `}</style>
      <ExcalidrawWrapper
        initialData={
          initialData
            ? {
                elements: initialData.elements as never[],
                appState: {
                  theme: "dark" as const,
                  viewBackgroundColor: "transparent",
                  ...(initialData.appState ?? {}),
                },
                files: initialData.files as never,
              }
            : {
                appState: {
                  theme: "dark" as const,
                  viewBackgroundColor: "transparent",
                },
              }
        }
        onChange={handleChange as never}
        langCode={LANG_MAP[language] || "en"}
        theme="dark"
        renderTopRightUI={() => (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-white/[0.06]">
            <div className="h-4 w-4 rounded bg-purple-500 flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">G</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide">{mode}</span>
          </div>
        )}
        UIOptions={{
          welcomeScreen: false,
          canvasActions: {
            loadScene: false,
            export: false,
          },
        }}
      />
    </div>
  );
}
