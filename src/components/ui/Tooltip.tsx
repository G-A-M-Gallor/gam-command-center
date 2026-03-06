"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  /** Delay in ms before showing. Default 300. */
  delay?: number;
  side?: "top" | "bottom";
  children: ReactNode;
}

export function Tooltip({
  content,
  delay = 300,
  side = "top",
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const top =
        side === "top"
          ? rect.top - 6
          : rect.bottom + 6;
      setPos({
        position: "fixed",
        left: rect.left + rect.width / 2,
        top,
        transform: side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        zIndex: 9999,
      });
      setVisible(true);
    }, delay);
  }, [delay, side]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={pos}
            className="pointer-events-none max-w-xs rounded-md bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 shadow-lg shadow-black/30 border border-white/10"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
