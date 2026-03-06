"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

export type SelectSize = "sm" | "md" | "lg";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  selectSize?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: "h-7 px-2 text-[12px]",
  md: "h-8 px-2.5 text-[13px]",
  lg: "h-10 px-3 text-sm",
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ selectSize = "md", options, placeholder, error, className = "", ...rest }, ref) => {
    return (
      <select
        ref={ref}
        className={[
          "w-full appearance-none rounded-[var(--cc-radius)] border bg-white/[0.03] text-slate-200 outline-none transition-colors",
          "focus:bg-white/[0.06]",
          "disabled:pointer-events-none disabled:opacity-50",
          error
            ? "border-red-500/40 focus:border-red-400/60"
            : "border-white/[0.08] focus:border-[var(--cc-accent-500-50)]",
          sizeClasses[selectSize],
          className,
        ].join(" ")}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";
export { Select };
