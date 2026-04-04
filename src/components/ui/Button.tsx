"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary-600)] text-white hover:bg-[var(--primary-500)] active:bg-[var(--primary-700)] shadow-lg hover:shadow-xl transition-all duration-200",
  secondary:
    "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-slate-100 active:bg-white/5 transition-all duration-200",
  ghost:
    "text-slate-400 hover:bg-white/5 hover:text-slate-200 active:bg-white/10 transition-all duration-200",
  danger:
    "bg-[var(--error)]/15 text-red-400 border border-red-500/20 hover:bg-[var(--error)]/25 hover:text-red-300 active:bg-[var(--error)]/15 transition-all duration-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-[12px] gap-1.5",
  md: "h-8 px-3.5 text-[13px] gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

const iconSizes: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 16 };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const iconSize = iconSizes[size];

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center font-medium transition-colors",
          "rounded-[var(--cc-radius)] outline-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--cc-accent-500-50)] focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...rest}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : Icon ? (
          <Icon size={iconSize} />
        ) : null}
        {children}
        {IconRight && !loading && <IconRight size={iconSize} />}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
