"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  MoreHorizontal,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   BUTTONS
   ═══════════════════════════════════════════════════════════════ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "start",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 
      font-medium rounded-md transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-[var(--color-primary)] text-white
        hover:bg-[var(--color-primary-hover)]
        active:bg-[var(--color-primary-active)]
        focus-visible:ring-[var(--color-primary-500)]
      `,
      secondary: `
        bg-[var(--color-secondary-100)] text-[var(--text-primary)]
        hover:bg-[var(--color-secondary-200)]
        active:bg-[var(--color-secondary-300)]
        focus-visible:ring-[var(--color-secondary-400)]
      `,
      outline: `
        border border-[var(--border-base)] bg-transparent text-[var(--text-primary)]
        hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]
        active:bg-[var(--surface-active)]
        focus-visible:ring-[var(--color-primary-500)]
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)]
        hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]
        active:bg-[var(--surface-active)]
        focus-visible:ring-[var(--color-primary-500)]
      `,
      danger: `
        bg-[var(--color-error)] text-white
        hover:bg-[var(--color-error-700)]
        active:bg-[var(--color-error-700)]
        focus-visible:ring-[var(--color-error-500)]
      `,
      success: `
        bg-[var(--color-success)] text-white
        hover:bg-[var(--color-success-700)]
        active:bg-[var(--color-success-700)]
        focus-visible:ring-[var(--color-success-500)]
      `,
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-9 px-4 text-sm",
      lg: "h-10 px-5 text-base",
    };

    const iconEl = loading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      icon
    );

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {iconEl && iconPosition === "start" && iconEl}
        {children}
        {iconEl && iconPosition === "end" && iconEl}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ═══════════════════════════════════════════════════════════════
   INPUTS
   ═══════════════════════════════════════════════════════════════ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, label, required, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
            {required && <span className="text-[var(--color-error)] ms-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            `
            h-9 w-full rounded-md border bg-[var(--surface-base)] px-3
            text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-[var(--surface-sunken)] disabled:cursor-not-allowed disabled:opacity-50
          `,
            error
              ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-100)]"
              : "border-[var(--border-base)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-100)]",
            className
          )}
          {...props}
        />
        {helperText && (
          <span
            className={cn(
              "text-xs",
              error ? "text-[var(--color-error)]" : "text-[var(--text-muted)]"
            )}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ═══════════════════════════════════════════════════════════════
   SEARCH INPUT
   ═══════════════════════════════════════════════════════════════ */

interface SearchInputProps extends Omit<InputProps, "type"> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            `
            h-9 w-full rounded-md border border-[var(--border-base)] 
            bg-[var(--surface-base)] pe-9 ps-9
            text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
            transition-colors duration-200
            focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]
          `,
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

/* ═══════════════════════════════════════════════════════════════
   TEXTAREA
   ═══════════════════════════════════════════════════════════════ */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, label, required, id, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
            {required && <span className="text-[var(--color-error)] ms-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            `
            min-h-[80px] w-full rounded-md border bg-[var(--surface-base)] px-3 py-2
            text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
            transition-colors duration-200 resize-y
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-[var(--surface-sunken)] disabled:cursor-not-allowed disabled:opacity-50
          `,
            error
              ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-100)]"
              : "border-[var(--border-base)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-100)]",
            className
          )}
          {...props}
        />
        {helperText && (
          <span
            className={cn(
              "text-xs",
              error ? "text-[var(--color-error)]" : "text-[var(--text-muted)]"
            )}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ═══════════════════════════════════════════════════════════════
   SELECT
   ═══════════════════════════════════════════════════════════════ */

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "בחר אפשרות",
  label,
  required,
  error,
  helperText,
  disabled,
  className,
}: SelectProps) {
  const id = React.useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
          {required && <span className="text-[var(--color-error)] ms-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            `
            h-9 w-full appearance-none rounded-md border bg-[var(--surface-base)] 
            pe-9 ps-3 text-sm text-[var(--text-primary)]
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-[var(--surface-sunken)] disabled:cursor-not-allowed disabled:opacity-50
          `,
            error
              ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-100)]"
              : "border-[var(--border-base)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-100)]",
            !value && "text-[var(--text-placeholder)]",
            className
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
      {helperText && (
        <span
          className={cn(
            "text-xs",
            error ? "text-[var(--color-error)]" : "text-[var(--text-muted)]"
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHECKBOX
   ═══════════════════════════════════════════════════════════════ */

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled,
  error,
  className,
}: CheckboxProps) {
  const id = React.useId();

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          `
          mt-0.5 h-4 w-4 shrink-0 rounded border
          flex items-center justify-center
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
        `,
          checked
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
            : error
            ? "border-[var(--color-error)] bg-[var(--surface-base)]"
            : "border-[var(--border-strong)] bg-[var(--surface-base)]"
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </button>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                "text-sm cursor-pointer",
                disabled ? "text-[var(--text-disabled)]" : "text-[var(--text-primary)]"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-[var(--text-muted)]">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RADIO GROUP
   ═══════════════════════════════════════════════════════════════ */

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
  error?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  required,
  error,
  orientation = "vertical",
  className,
}: RadioGroupProps) {
  const groupName = name || React.useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[var(--color-error)] ms-1">*</span>}
        </span>
      )}
      <div
        className={cn(
          "flex gap-4",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-start gap-3 cursor-pointer",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div
              className={cn(
                `
                mt-0.5 h-4 w-4 shrink-0 rounded-full border
                flex items-center justify-center
                transition-all duration-200
              `,
                value === option.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                  : error
                  ? "border-[var(--color-error)] bg-[var(--surface-base)]"
                  : "border-[var(--border-strong)] bg-[var(--surface-base)]"
              )}
            >
              {value === option.value && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              disabled={option.disabled}
              className="sr-only"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
              {option.description && (
                <span className="text-xs text-[var(--text-muted)]">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════ */

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pills" | "bordered";
  size?: "sm" | "md";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  size = "md",
  className,
}: TabsProps) {
  const baseTabStyles = "flex items-center gap-2 font-medium transition-all duration-200 whitespace-nowrap";

  const variants = {
    underline: {
      container: "flex gap-1 border-b border-[var(--border-base)]",
      tab: cn(
        baseTabStyles,
        "px-4 py-2.5 -mb-px border-b-2",
        size === "sm" ? "text-xs" : "text-sm"
      ),
      active: "border-[var(--color-primary)] text-[var(--color-primary)]",
      inactive: "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]",
    },
    pills: {
      container: "flex gap-1 p-1 bg-[var(--surface-sunken)] rounded-lg",
      tab: cn(
        baseTabStyles,
        "px-4 py-2 rounded-md",
        size === "sm" ? "text-xs" : "text-sm"
      ),
      active: "bg-[var(--surface-base)] text-[var(--text-primary)] shadow-sm",
      inactive: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
    },
    bordered: {
      container: "flex gap-2",
      tab: cn(
        baseTabStyles,
        "px-4 py-2 rounded-md border",
        size === "sm" ? "text-xs" : "text-sm"
      ),
      active: "border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)]",
      inactive: "border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
    },
  };

  const v = variants[variant];

  return (
    <div className={cn(v.container, className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          disabled={tab.disabled}
          onClick={() => onChange(tab.id)}
          className={cn(
            v.tab,
            activeTab === tab.id ? v.active : v.inactive,
            tab.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--surface-active)] text-[var(--text-muted)]"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════════ */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot,
  removable,
  onRemove,
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-[var(--color-secondary-100)] text-[var(--text-secondary)]",
    primary: "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]",
    success: "bg-[var(--color-success-light)] text-[var(--color-success-text)]",
    warning: "bg-[var(--color-warning-light)] text-[var(--color-warning-text)]",
    error: "bg-[var(--color-error-light)] text-[var(--color-error-text)]",
    info: "bg-[var(--color-info-light)] text-[var(--color-info-text)]",
  };

  const dotColors = {
    default: "bg-[var(--color-secondary-400)]",
    primary: "bg-[var(--color-primary)]",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    error: "bg-[var(--color-error)]",
    info: "bg-[var(--color-info)]",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-black/10 rounded-full p-0.5 -me-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════════ */

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  className,
}: CardProps) {
  const variants = {
    default: "bg-[var(--surface-base)] border border-[var(--border-base)]",
    bordered: "bg-[var(--surface-base)] border-2 border-[var(--border-base)]",
    elevated: "bg-[var(--surface-base)] shadow-md border border-[var(--border-subtle)]",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "rounded-lg",
        variants[variant],
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-card-title">{title}</h3>
        {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ALERTS
   ═══════════════════════════════════════════════════════════════ */

interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  title,
  children,
  variant = "info",
  dismissible,
  onDismiss,
  className,
}: AlertProps) {
  const variants = {
    info: {
      container: "bg-[var(--color-info-light)] border-[var(--color-info)]",
      icon: <Info className="h-4 w-4 text-[var(--color-info)]" />,
      title: "text-[var(--color-info-text)]",
    },
    success: {
      container: "bg-[var(--color-success-light)] border-[var(--color-success)]",
      icon: <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />,
      title: "text-[var(--color-success-text)]",
    },
    warning: {
      container: "bg-[var(--color-warning-light)] border-[var(--color-warning)]",
      icon: <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />,
      title: "text-[var(--color-warning-text)]",
    },
    error: {
      container: "bg-[var(--color-error-light)] border-[var(--color-error)]",
      icon: <AlertCircle className="h-4 w-4 text-[var(--color-error)]" />,
      title: "text-[var(--color-error-text)]",
    },
  };

  const v = variants[variant];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border-s-4 p-4",
        v.container,
        className
      )}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{v.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className={cn("font-medium text-sm mb-1", v.title)}>{title}</h4>}
        <div className="text-sm text-[var(--text-secondary)]">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-black/5"
        >
          <X className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGINATION
   ═══════════════════════════════════════════════════════════════ */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo,
  totalItems,
  itemsPerPage,
  className,
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | "...")[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) items.push(i);
      
      if (currentPage < totalPages - 2) items.push("...");
      items.push(totalPages);
    }
    
    return items;
  }, [currentPage, totalPages]);

  const startItem = ((currentPage - 1) * (itemsPerPage || 0)) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {showInfo && totalItems !== undefined && itemsPerPage !== undefined && (
        <span className="text-sm text-[var(--text-muted)]">
          מציג {startItem}-{endItem} מתוך {totalItems}
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-[var(--text-muted)]">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page as number)}
              className={cn(
                "min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors",
                currentPage === page
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              {page}
            </button>
          )
        )}
        
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("gam-empty-state", className)}>
      {icon && (
        <div className="mb-4 text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTION MENU (Dropdown)
   ═══════════════════════════════════════════════════════════════ */

interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  className?: string;
}

export function ActionMenu({ items, trigger, className }: ActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      >
        {trigger || <MoreHorizontal className="h-4 w-4" />}
      </button>
      
      {open && (
        <div className="absolute end-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)] py-1 shadow-lg animate-slide-up">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                item.variant === "danger"
                  ? "text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOOLTIP
   ═══════════════════════════════════════════════════════════════ */

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [show, setShow] = React.useState(false);

  const positions = {
    top: "bottom-full mb-2 start-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 start-1/2 -translate-x-1/2",
    left: "end-full me-2 top-1/2 -translate-y-1/2",
    right: "start-full ms-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 rounded-md bg-[var(--color-secondary-800)] text-white text-xs whitespace-nowrap animate-fade-in",
            positions[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
