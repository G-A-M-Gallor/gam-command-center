"use client";

import { useEffect, useRef } from "react";
import { VBLOCK_Z } from "./vBlockZIndex";
import type { VBlockAction } from "./vBlock.types";

interface Props {
  position: { x: number; y: number };
  actions: VBlockAction[];
  onClose: () => void;
}

export function VBlockContextMenu({ position, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: position.y,
    left: position.x,
    zIndex: VBLOCK_Z.contextMenu,
  };

  return (
    <div
      ref={ref}
      dir="rtl"
      className="min-w-[180px] rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={style}
    >
      {actions.map((action) => (
        <div key={action.id}>
          {action.dividerBefore && (
            <div className="my-1 h-px bg-slate-700" />
          )}
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              action.danger
                ? "text-red-400 hover:bg-red-500/10"
                : "text-slate-200 hover:bg-slate-700"
            }`}
          >
            {action.icon && <span className="text-base">{action.icon}</span>}
            <span className="flex-1 text-start">{action.label}</span>
            {action.shortcut && (
              <span className="text-xs text-slate-500">{action.shortcut}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
