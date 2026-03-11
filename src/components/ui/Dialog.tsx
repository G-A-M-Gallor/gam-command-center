"use client";

import {
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Max width class. Default "max-w-md". */
  maxWidth?: string;
  children: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  maxWidth = "max-w-md",
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    // Trap focus — focus the panel on open
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKey);
      prev?.focus();
    };
  }, [open, handleKey]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={[
          "gam-card relative z-10 w-full rounded-[var(--cc-radius-lg)] border border-white/[0.08] bg-slate-900 shadow-2xl shadow-black/40 outline-none",
          "mx-4",
          maxWidth,
        ].join(" ")}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
