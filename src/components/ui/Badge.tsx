"use client";

import type { ReactNode } from "react";

export type BadgeIntent = "neutral" | "info" | "success" | "warning" | "danger" | "accent";
export type BadgeSize = "sm" | "md";

interface BadgeProps {
  intent?: BadgeIntent;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const intentClasses: Record<BadgeIntent, string> = {
  neutral: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  info:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  danger:  "bg-red-500/15 text-red-400 border-red-500/20",
  accent:  "bg-[var(--cc-accent-500-15)] text-[var(--cc-accent-400)] border-[var(--cc-accent-500-30)]",
};

const dotColors: Record<BadgeIntent, string> = {
  neutral: "bg-slate-400",
  info:    "bg-blue-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger:  "bg-red-400",
  accent:  "bg-[var(--cc-accent-400)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-px text-[10px]",
  md: "px-2 py-0.5 text-[11px]",
};

export function Badge({
  intent = "neutral",
  size = "sm",
  dot = false,
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border font-medium",
        intentClasses[intent],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[intent]}`} />}
      {children}
    </span>
  );
}
