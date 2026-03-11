"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useSettings } from "./SettingsContext";

// ─── Types ──────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number; // ms, 0 = persistent. Default 4000.
  action?: ToastAction;
}

interface ToastItem extends Required<Pick<ToastOptions, "type" | "message" | "duration">> {
  id: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── Styling ────────────────────────────────────────────────────

const typeConfig: Record<ToastType, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  error:   { icon: XCircle,        color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  warning: { icon: AlertTriangle,  color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  info:    { icon: Info,           color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
};

// ─── Single Toast ───────────────────────────────────────────────

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const cfg = typeConfig[item.type];
  const Icon = cfg.icon;

  return (
    <div
      role="alert"
      className={[
        "gam-card pointer-events-auto flex w-80 items-start gap-2.5 rounded-[var(--cc-radius-lg)] border px-3.5 py-3 shadow-lg shadow-black/30 backdrop-blur-sm",
        cfg.bg,
        cfg.border,
      ].join(" ")}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-slate-200">{item.message}</p>
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action!.onClick();
              onDismiss(item.id);
            }}
            className="mt-1 text-[12px] font-medium text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-300"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { sidebarPosition } = useSettings();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: ToastItem = {
        id,
        type: opts.type ?? "info",
        message: opts.message,
        duration: opts.duration ?? 4000,
        action: opts.action,
      };

      setToasts((prev) => {
        const next = [...prev, item];
        // Evict oldest if over limit
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
      });

      if (item.duration > 0) {
        const timer = setTimeout(() => dismiss(id), item.duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss]
  );

  // Position: opposite side of sidebar
  const isRight = sidebarPosition === "left";

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {typeof document !== "undefined" &&
        toasts.length > 0 &&
        createPortal(
          <div
            className={[
              "pointer-events-none fixed bottom-4 z-[9999] flex flex-col gap-2",
              isRight ? "right-4" : "left-4",
            ].join(" ")}
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} item={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
