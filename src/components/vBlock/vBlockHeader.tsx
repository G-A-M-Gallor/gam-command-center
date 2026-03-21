"use client";

import type { VBlockMode, VBlockFlipConfig } from "./vBlock.types";

interface Props {
  title: string;
  icon?: string;
  mode: VBlockMode;
  flip?: VBlockFlipConfig;
  showSettings?: boolean;
  onSettings?: () => void;
  onFullscreen?: () => void;
  onCloseFullscreen?: () => void;
  onFlip?: () => void;
  draggable?: boolean;
}

export function VBlockHeader({
  title,
  icon,
  mode,
  flip,
  showSettings,
  onSettings,
  onFullscreen,
  onCloseFullscreen,
  onFlip,
  draggable,
}: Props) {
  const isCompact = mode === "compact";
  const isFullscreen = mode === "fullscreen";

  return (
    <div
      dir="rtl"
      className="flex items-center gap-1.5 border-b border-slate-700/50 px-2 py-1.5 select-none"
    >
      {/* Right side (RTL): drag handle + icon + title */}
      <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
        {draggable && !isFullscreen && (
          <span className="cursor-grab text-slate-500 hover:text-slate-300 text-xs" title="גרור">
            ☰
          </span>
        )}
        {icon && <span className="text-sm shrink-0">{icon}</span>}
        <span className="truncate text-xs font-medium text-slate-200">
          {title}
        </span>
      </div>

      {/* Left side (RTL): action buttons */}
      {!isCompact && (
        <div className="flex items-center gap-0.5 shrink-0">
          {flip?.enabled && onFlip && (
            <button
              type="button"
              onClick={onFlip}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
              title="הפוך כרטיס"
            >
              <span className="text-xs">↻</span>
            </button>
          )}
          {showSettings && onSettings && (
            <button
              type="button"
              onClick={onSettings}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
              title="הגדרות"
            >
              <span className="text-xs">⚙</span>
            </button>
          )}
          {isFullscreen && onCloseFullscreen ? (
            <button
              type="button"
              onClick={onCloseFullscreen}
              className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="סגור מסך מלא"
            >
              <span className="text-xs">✕</span>
            </button>
          ) : (
            onFullscreen && (
              <button
                type="button"
                onClick={onFullscreen}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                title="מסך מלא"
              >
                <span className="text-xs">⛶</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
