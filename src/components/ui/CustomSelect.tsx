'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ value, options, onChange, placeholder, className = '' }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 text-start hover:bg-white/[0.05] transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon}
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-white/[0.08] bg-slate-800 py-1 shadow-xl max-h-[240px] overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); close(); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-start transition-colors ${
                opt.value === value
                  ? 'bg-purple-500/15 text-purple-300'
                  : 'text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              {opt.icon}
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.value === value && <Check size={13} className="shrink-0 text-purple-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
