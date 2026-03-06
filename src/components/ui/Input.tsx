"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export type InputSize = "sm" | "md" | "lg";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  error?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "h-7 px-2.5 text-[12px]",
  md: "h-8 px-3 text-[13px]",
  lg: "h-10 px-3.5 text-sm",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = "md", error, iconStart, iconEnd, className = "", ...rest }, ref) => {
    const hasStart = !!iconStart;
    const hasEnd = !!iconEnd;

    return (
      <div className="relative">
        {hasStart && (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-500">
            {iconStart}
          </span>
        )}
        <input
          ref={ref}
          className={[
            "w-full rounded-[var(--cc-radius)] border bg-white/[0.03] text-slate-200 outline-none transition-colors",
            "placeholder:text-slate-600",
            "focus:bg-white/[0.06]",
            "disabled:pointer-events-none disabled:opacity-50",
            error
              ? "border-red-500/40 focus:border-red-400/60"
              : "border-white/[0.08] focus:border-[var(--cc-accent-500-50)]",
            sizeClasses[inputSize],
            hasStart ? "ps-8" : "",
            hasEnd ? "pe-8" : "",
            className,
          ].join(" ")}
          {...rest}
        />
        {hasEnd && (
          <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-500">
            {iconEnd}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
