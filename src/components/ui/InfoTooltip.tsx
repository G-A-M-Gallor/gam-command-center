'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  size?: number;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
}

export function InfoTooltip({ text, size = 13, className = '', side = 'top', maxWidth = 280 }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const positionClasses = {
    top: 'bottom-full mb-2 start-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 start-1/2 -translate-x-1/2',
    left: 'end-full me-2 top-1/2 -translate-y-1/2',
    right: 'start-full ms-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full start-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full start-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'start-full top-1/2 -translate-y-1/2 border-s-slate-800 border-y-transparent border-e-transparent',
    right: 'end-full top-1/2 -translate-y-1/2 border-e-slate-800 border-y-transparent border-s-transparent',
  };

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => { timeoutRef.current = setTimeout(() => setOpen(true), 300); }}
        onMouseLeave={() => { clearTimeout(timeoutRef.current); setOpen(false); }}
        className="rounded-full p-0.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors focus:outline-none"
        aria-label="Info"
      >
        <Info size={size} />
      </button>
      {open && (
        <div
          className={`absolute z-50 ${positionClasses[side]}`}
          style={{ maxWidth }}
        >
          <div className="rounded-lg bg-slate-800 border border-white/[0.08] px-3 py-2 shadow-xl">
            <p className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-line">{text}</p>
          </div>
          <div className={`absolute w-0 h-0 border-[5px] ${arrowClasses[side]}`} />
        </div>
      )}
    </div>
  );
}
