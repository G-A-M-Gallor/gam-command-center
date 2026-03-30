"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSplitScreen } from "@/lib/hooks/useSplitScreen";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { _X, GripVertical } from "lucide-react";

const RATIO_KEY = "cc-split-ratio";
const MIN_RATIO = 20;
const MAX_RATIO = 80;

function loadRatio(): number {
  try {
    const v = parseFloat(localStorage.getItem(RATIO_KEY) || "50");
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, v));
  } catch { return 50; }
}

interface SplitScreenContainerProps {
  children: React.ReactNode;
}

export function SplitScreenContainer({ children }: SplitScreenContainerProps) {
  const split = useSplitScreen();
  const { language } = useSettings();
  const _t = getTranslations(language);
  const trayT = t.tray as Record<string, string>;

  const [ratio, setRatio] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate ratio
  useEffect(() => {
    setRatio(loadRatio());
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(MAX_RATIO, Math.max(MIN_RATIO, (x / rect.width) * 100));
      setRatio(pct);
    };
    const handleUp = () => {
      setDragging(false);
      try {
        localStorage.setItem(RATIO_KEY, String(ratio));
      } catch (_error) {
        // Ignore localStorage errors
      }
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, ratio]);

  // Save ratio on change (debounced via mouseup above)

  // No split active — render children normally
  if (!split.isActive) {
    return <>{children}</>;
  }

  const { left, right } = split.state;
  const bothActive = left !== null && right !== null;

  return (
    <div ref={containerRef} className="flex h-full w-full" style={{ cursor: dragging ? "col-resize" : undefined }}>
      {/* Left pane */}
      {left && (
        <div
          className="relative min-w-0 border-e border-slate-700/50"
          style={{ width: bothActive ? `${ratio}%` : right ? `${ratio}%` : "100%", flexShrink: 0 }}
        >
          <iframe
            src={`${left}?split=secondary`}
            className="h-full w-full border-0"
            title="Split left"
            style={{ pointerEvents: dragging ? "none" : undefined }}
          />
          <button
            type="button"
            onClick={() => split.undock("left")}
            className="absolute top-2 end-2 z-10 rounded-full bg-slate-800/90 p-1 text-slate-400 shadow-lg transition-colors hover:bg-red-500/80 hover:text-white"
            title={trayT.closeSplit}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Resize handle */}
      {(left && (right || !bothActive)) && (
        <div
          className={`flex w-2 shrink-0 cursor-col-resize items-center justify-center transition-colors ${
            dragging ? "bg-[var(--cc-accent-500)]/30" : "hover:bg-slate-700/50"
          }`}
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-slate-600" />
        </div>
      )}

      {/* Primary content — shown when only one side is docked */}
      {!bothActive && (
        <div className="min-w-0 flex-1">
          {children}
        </div>
      )}

      {/* Right pane */}
      {right && (
        <div
          className="relative min-w-0 border-s border-slate-700/50"
          style={{ width: bothActive ? `${100 - ratio}%` : undefined, flex: bothActive ? undefined : 1, flexShrink: 0 }}
        >
          <iframe
            src={`${right}?split=secondary`}
            className="h-full w-full border-0"
            title="Split right"
            style={{ pointerEvents: dragging ? "none" : undefined }}
          />
          <button
            type="button"
            onClick={() => split.undock("right")}
            className="absolute top-2 start-2 z-10 rounded-full bg-slate-800/90 p-1 text-slate-400 shadow-lg transition-colors hover:bg-red-500/80 hover:text-white"
            title={trayT.closeSplit}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
