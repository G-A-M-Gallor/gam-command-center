"use client";

import { useState, useRef, useEffect } from "react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6",
  "#84cc16", "#a855f7", "#6366f1", "#0ea5e9", "#10b981",
  "#ffffff", "#e2e8f0", "#94a3b8", "#475569", "#1e293b",
];

interface ColorPickerPopoverProps {
  value?: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  children: React.ReactNode;
}

export function ColorPickerPopover({ value, onChange, onClear, children }: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-white/[0.08] bg-slate-900 p-2 shadow-xl">
          <div className="grid grid-cols-5 gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className={`h-6 w-6 rounded border transition-transform hover:scale-110 ${
                  value === c ? "border-white ring-1 ring-white/30" : "border-white/10"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {onClear && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              className="mt-1.5 w-full rounded px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
