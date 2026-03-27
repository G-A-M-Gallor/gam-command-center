"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button, Input, Select, Textarea, Checkbox, RadioGroup, Card } from "./core-components";

/* ═══════════════════════════════════════════════════════════════
   FORM WRAPPER
   Base form container with consistent spacing
   ═══════════════════════════════════════════════════════════════ */

interface FormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function Form({ children, onSubmit, className }: FormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      className={cn("space-y-6", className)}
    >
      {children}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM SECTION
   Group related fields with a title
   ═══════════════════════════════════════════════════════════════ */

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="border-b border-[var(--border-subtle)] pb-4">
          {title && (
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM ROW
   Single row for form fields (supports 1 or 2 columns)
   ═══════════════════════════════════════════════════════════════ */

interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormRow({ children, columns = 1, className }: FormRowProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SINGLE COLUMN FORM
   Standard form layout for simple data entry
   ═══════════════════════════════════════════════════════════════ */

interface SingleColumnFormProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  className?: string;
}

export function SingleColumnForm({
  title,
  description,
  children,
  actions,
  maxWidth = "md",
  className,
}: SingleColumnFormProps) {
  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className={cn(widths[maxWidth], className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
      {actions && (
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-6">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TWO COLUMN FORM
   Side-by-side form layout for comprehensive data entry
   ═══════════════════════════════════════════════════════════════ */

interface TwoColumnFormProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function TwoColumnForm({
  title,
  description,
  children,
  sidebar,
  actions,
  className,
}: TwoColumnFormProps) {
  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}

      <div className="flex gap-8">
        <div className="flex-1 space-y-4">{children}</div>
        {sidebar && (
          <div className="w-80 shrink-0 space-y-4">{sidebar}</div>
        )}
      </div>

      {actions && (
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-6">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTIONED LONG FORM
   Multi-section form with navigation
   ═══════════════════════════════════════════════════════════════ */

interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
}

interface SectionedFormProps {
  title?: string;
  description?: string;
  sections: FormSectionConfig[];
  activeSection?: string;
  onSectionChange?: (id: string) => void;
  actions?: React.ReactNode;
  stickyNav?: boolean;
  className?: string;
}

export function SectionedForm({
  title,
  description,
  sections,
  activeSection,
  onSectionChange,
  actions,
  stickyNav = true,
  className,
}: SectionedFormProps) {
  const [currentSection, setCurrentSection] = React.useState(activeSection || sections[0]?.id);

  const handleSectionChange = (id: string) => {
    setCurrentSection(id);
    onSectionChange?.(id);
    // Scroll to section
    document.getElementById(`form-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={cn("flex gap-8", className)}>
      {/* Navigation sidebar */}
      <nav
        className={cn(
          "w-56 shrink-0 space-y-1",
          stickyNav && "sticky top-6 self-start"
        )}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => handleSectionChange(section.id)}
            className={cn(
              "w-full rounded-md px-3 py-2 text-start text-sm font-medium transition-colors",
              currentSection === section.id
                ? "bg-[var(--color-primary-50)] text-[var(--color-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {section.title}
          </button>
        ))}
      </nav>

      {/* Form content */}
      <div className="flex-1">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
            )}
          </div>
        )}

        <div className="space-y-10">
          {sections.map((section) => (
            <div
              key={section.id}
              id={`form-section-${section.id}`}
              className="scroll-mt-6"
            >
              <div className="mb-6 border-b border-[var(--border-subtle)] pb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {section.title}
                </h3>
                {section.description && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {section.description}
                  </p>
                )}
              </div>
              <div className="space-y-4">{section.content}</div>
            </div>
          ))}
        </div>

        {actions && (
          <div className="gam-sticky-actions mt-8">{actions}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP FORM (Wizard)
   Multi-step form with progress indicator
   ═══════════════════════════════════════════════════════════════ */

interface StepConfig {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface StepFormProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  isSubmitting?: boolean;
  completeLabel?: string;
  className?: string;
}

export function StepForm({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  isSubmitting,
  completeLabel = "שמור",
  className,
}: StepFormProps) {
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (step?.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }

    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className={className}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep;

            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isComplete
                        ? "bg-[var(--color-success)] text-white"
                        : isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-4",
                      idx < currentStep
                        ? "bg-[var(--color-success)]"
                        : "bg-[var(--border-base)]"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <Card variant="bordered" padding="lg" className="mb-8">
        {step?.description && (
          <p className="mb-6 text-sm text-[var(--text-muted)]">{step.description}</p>
        )}
        <div className="space-y-4">{step?.content}</div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
          icon={<ChevronRight className="h-4 w-4" />}
        >
          הקודם
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          loading={isSubmitting}
          icon={isLastStep ? undefined : <ChevronLeft className="h-4 w-4" />}
          iconPosition="end"
        >
          {isLastStep ? completeLabel : "הבא"}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM ACTIONS BAR
   Sticky footer for form actions (Save/Cancel)
   ═══════════════════════════════════════════════════════════════ */

interface FormActionsProps {
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  isDirty?: boolean;
  saveDisabled?: boolean;
  className?: string;
}

export function FormActions({
  onSave,
  onCancel,
  saveLabel = "שמור",
  cancelLabel = "ביטול",
  isSaving,
  isDirty,
  saveDisabled,
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-[var(--border-base)] bg-[var(--surface-base)] px-6 py-4",
        className
      )}
    >
      <div className="text-sm text-[var(--text-muted)]">
        {isDirty && (
          <span className="flex items-center gap-1.5 text-[var(--color-warning-text)]">
            <AlertCircle className="h-4 w-4" />
            יש שינויים שלא נשמרו
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          {cancelLabel}
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          loading={isSaving}
          disabled={saveDisabled}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INLINE EDIT FIELD
   Click to edit inline pattern
   ═══════════════════════════════════════════════════════════════ */

interface InlineEditFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  type?: "text" | "textarea";
  className?: string;
}

export function InlineEditField({
  value,
  onChange,
  label,
  placeholder = "לחץ לעריכה",
  type = "text",
  className,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type === "text") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>
        )}
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full rounded-md border border-[var(--color-primary)] bg-[var(--surface-base)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full rounded-md border border-[var(--color-primary)] bg-[var(--surface-base)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <span className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full rounded-md border border-transparent px-3 py-1.5 text-start text-sm transition-colors",
          "hover:border-[var(--border-base)] hover:bg-[var(--surface-hover)]",
          !value && "text-[var(--text-placeholder)]"
        )}
      >
        {value || placeholder}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIELD VALIDATION MESSAGE
   ═══════════════════════════════════════════════════════════════ */

interface FieldValidationProps {
  error?: string;
  success?: string;
  className?: string;
}

export function FieldValidation({ error, success, className }: FieldValidationProps) {
  if (!error && !success) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs mt-1.5",
        error && "text-[var(--color-error)]",
        success && "text-[var(--color-success)]",
        className
      )}
    >
      {error && <AlertCircle className="h-3.5 w-3.5" />}
      {success && <Check className="h-3.5 w-3.5" />}
      <span>{error || success}</span>
    </div>
  );
}
