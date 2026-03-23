"use client";
// ===================================================
// GAM Command Center — Progress Bar
// Color-coded progress bar with percentage
// ===================================================

import { cn } from "@/lib/utils";
import { progressColor } from "@/lib/pm-utils";

interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  size = "md",
  showLabel = true,
  label,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const colorClass = progressColor(clampedValue);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">{label}</span>
          <span className={cn("font-medium", colorClass.split(" ")[0])}>
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}

      <div
        className={cn(
          "w-full bg-slate-800 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClass.split(" ")[1]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

interface MiniProgressBarProps {
  value: number;
  className?: string;
}

export function MiniProgressBar({ value, className }: MiniProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const colorClass = progressColor(clampedValue);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            colorClass.split(" ")[1]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium", colorClass.split(" ")[0])}>
        {Math.round(clampedValue)}%
      </span>
    </div>
  );
}