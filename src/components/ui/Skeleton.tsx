"use client";

interface SkeletonProps {
  className?: string;
  /** Width in CSS units. Defaults to "100%". */
  width?: string;
  /** Height in CSS units. Defaults to "1rem". */
  height?: string;
  /** Rounds to pill shape when true. */
  rounded?: boolean;
}

export function Skeleton({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse bg-slate-700/40",
        rounded ? "rounded-full" : "rounded-[var(--cc-radius)]",
        className,
      ].join(" ")}
      style={{ width, height }}
    />
  );
}

/** Row of skeletons mimicking a card list */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 rounded-[var(--cc-radius-lg)] border border-white/[0.06] bg-white/[0.02] p-4">
      <Skeleton width="40%" height="0.875rem" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height="0.75rem" />
      ))}
    </div>
  );
}
