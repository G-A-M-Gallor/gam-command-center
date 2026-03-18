import type { ReactNode } from "react";

// ===================================================
// Card — Unified card component for the entire system
// Use this instead of inline bg-slate-800/border combos
// ===================================================

interface CardProps {
  children: ReactNode;
  /** Visual variant */
  variant?: "default" | "elevated" | "ghost" | "accent";
  /** Elevation level (0-4) — overrides variant bg/shadow with depth system */
  elevation?: 0 | 1 | 2 | 3 | 4;
  /** Optional padding override */
  padding?: "none" | "sm" | "md" | "lg";
  /** Whether the card is interactive (hover effects) */
  interactive?: boolean;
  /** Artistic effects */
  grain?: boolean;
  accentEdge?: boolean;
  glow?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** data-cc-id for style override system */
  "data-cc-id"?: string;
  /** Click handler (auto-adds cursor-pointer) */
  onClick?: () => void;
}

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const VARIANTS = {
  default: "border border-white/[0.06] bg-[rgba(30,41,59,0.4)]",
  elevated: "border border-white/[0.08] bg-[rgba(30,41,59,0.6)] shadow-lg shadow-black/20",
  ghost: "bg-white/[0.02]",
  accent: "border border-[var(--cc-accent-500)]/20 bg-[var(--cc-accent-500)]/5",
};

export function Card({
  children,
  variant = "default",
  elevation,
  padding = "md",
  interactive = false,
  grain = false,
  accentEdge = false,
  glow,
  className = "",
  onClick,
  ...props
}: CardProps) {
  const Component = onClick ? "button" : "div";
  const useElevation = elevation !== undefined;

  const elevationClass = useElevation ? `elevation-${elevation}` : VARIANTS[variant];
  const effectClasses = [
    grain ? "surface-grain" : "",
    accentEdge ? "accent-edge" : "",
    glow ? `glow-accent-${glow}` : "",
  ].filter(Boolean).join(" ");

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-2xl ${elevationClass} ${PADDING[padding]} ${
        interactive || onClick
          ? "transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] cursor-pointer"
          : ""
      } ${onClick ? "text-start w-full" : ""} ${effectClasses} ${className}`}
      data-cc-id={props["data-cc-id"]}
    >
      {children}
    </Component>
  );
}

// ─── Card Header ────────────────────────────────────────

interface CardHeaderProps {
  children: ReactNode;
  /** Right-side actions */
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ children, actions, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="min-w-0 flex-1">{children}</div>
      {actions && <div className="shrink-0 flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}

// ─── Card Title ─────────────────────────────────────────

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-sm font-semibold text-slate-100 ${className}`}>{children}</h3>;
}

// ─── Card Description ───────────────────────────────────

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs text-slate-400 leading-relaxed ${className}`}>{children}</p>;
}

// ─── Card Section ───────────────────────────────────────

export function CardSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border-t border-white/[0.04] pt-3 mt-3 ${className}`}>{children}</div>;
}

// ─── App Icon ───────────────────────────────────────────
// Colorful gradient icon container (macOS/iOS style)

interface AppIconProps {
  icon: React.ElementType;
  gradient: [string, string];
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const ICON_SIZES = {
  sm: { container: "h-8 w-8", icon: "h-4 w-4", radius: "rounded-lg", shadow: "3px 8px" },
  md: { container: "h-11 w-11", icon: "h-5 w-5", radius: "rounded-xl", shadow: "4px 12px" },
  lg: { container: "h-14 w-14", icon: "h-7 w-7", radius: "rounded-2xl", shadow: "6px 16px" },
  xl: { container: "h-18 w-18", icon: "h-9 w-9", radius: "rounded-2xl", shadow: "8px 20px" },
};

export function AppIcon({ icon: Icon, gradient, size = "md", className = "" }: AppIconProps) {
  const s = ICON_SIZES[size];
  const [from, to] = gradient;

  return (
    <div
      className={`relative flex ${s.container} shrink-0 items-center justify-center ${s.radius} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 ${s.shadow} ${from}30`,
      }}
    >
      {/* Gloss overlay */}
      <div
        className={`pointer-events-none absolute inset-0 ${s.radius}`}
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)" }}
      />
      <Icon className={`relative z-10 ${s.icon} text-white`} />
    </div>
  );
}
