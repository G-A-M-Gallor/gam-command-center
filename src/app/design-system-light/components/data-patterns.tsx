"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Filter,
  Download,
  Trash2,
  Edit3,
  Eye,
  Copy,
  Calendar,
  User,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  Building2,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Pause,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Badge, Button, Checkbox, SearchInput, ActionMenu } from "./core-components";

/* ═══════════════════════════════════════════════════════════════
   DATA TABLE
   Premium, scannable table for CRM data
   ═══════════════════════════════════════════════════════════════ */

interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  selectable,
  selectedIds = new Set(),
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  loading,
  emptyMessage = "אין נתונים להצגה",
  className,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds.has(row.id));
  const someSelected = data.some((row) => selectedIds.has(row.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map((row) => row.id)));
    }
  };

  const toggleRow = (id: string | number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange?.(newSet);
  };

  const getValue = (row: T, accessor: Column<T>["accessor"]) => {
    if (typeof accessor === "function") {
      return accessor(row);
    }
    return row[accessor] as React.ReactNode;
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-base)] bg-[var(--surface-sunken)]">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onChange={toggleAll}
                    className={someSelected ? "opacity-50" : ""}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide",
                    col.align === "center" && "text-center",
                    col.align === "end" && "text-end",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--text-primary)]"
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSort?.(col.id)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortColumn === col.id && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-[var(--text-muted)]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--color-primary)]" />
                    טוען נתונים...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-[var(--text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    selectedIds.has(row.id) && "bg-[var(--color-primary-50)]",
                    onRowClick && "cursor-pointer hover:bg-[var(--surface-hover)]"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-4 py-3 text-sm text-[var(--text-primary)]",
                        col.align === "center" && "text-center",
                        col.align === "end" && "text-end"
                      )}
                    >
                      {getValue(row, col.accessor)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILTERS BAR
   ═══════════════════════════════════════════════════════════════ */

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    id: string;
    label: string;
    options: FilterOption[];
    value?: string;
    onChange: (value: string) => void;
  }[];
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function FiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "חיפוש...",
  filters,
  activeFiltersCount,
  onClearFilters,
  actions,
  className,
}: FiltersBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 p-4 bg-[var(--surface-base)] border border-[var(--border-base)] rounded-lg", className)}>
      <div className="flex-1 min-w-[200px] max-w-xs">
        <SearchInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          placeholder={searchPlaceholder}
        />
      </div>

      {filters?.map((filter) => (
        <div key={filter.id} className="relative">
          <select
            value={filter.value || ""}
            onChange={(e) => filter.onChange(e.target.value)}
            className="h-9 appearance-none rounded-md border border-[var(--border-base)] bg-[var(--surface-base)] pe-8 ps-3 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label} {opt.count !== undefined && `(${opt.count})`}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
      ))}

      {activeFiltersCount !== undefined && activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline"
        >
          <Filter className="h-4 w-4" />
          נקה {activeFiltersCount} סינונים
        </button>
      )}

      {actions && <div className="ms-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BULK ACTIONS BAR
   ═══════════════════════════════════════════════════════════════ */

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "danger";
    onClick: () => void;
  }[];
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-[var(--color-primary-800)]">
          נבחרו
        </span>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant === "danger" ? "danger" : "outline"}
            size="sm"
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="ms-auto text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        בטל בחירה
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATUS CHIPS
   ═══════════════════════════════════════════════════════════════ */

type StatusType = "active" | "pending" | "completed" | "paused" | "cancelled" | "error";

interface StatusChipProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: {
    label: "פעיל",
    color: "var(--color-success-text)",
    bg: "var(--color-success-light)",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: "ממתין",
    color: "var(--color-warning-text)",
    bg: "var(--color-warning-light)",
    icon: <Clock className="h-3 w-3" />,
  },
  completed: {
    label: "הושלם",
    color: "var(--color-info-text)",
    bg: "var(--color-info-light)",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  paused: {
    label: "מושהה",
    color: "var(--text-muted)",
    bg: "var(--surface-muted)",
    icon: <Pause className="h-3 w-3" />,
  },
  cancelled: {
    label: "בוטל",
    color: "var(--color-error-text)",
    bg: "var(--color-error-light)",
    icon: <XCircle className="h-3 w-3" />,
  },
  error: {
    label: "שגיאה",
    color: "var(--color-error-text)",
    bg: "var(--color-error-light)",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function StatusChip({ status, label, size = "md", className }: StatusChipProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.icon}
      {displayLabel}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENTITY PROFILE HEADER
   ═══════════════════════════════════════════════════════════════ */

interface EntityProfileHeaderProps {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: StatusType;
  metadata?: { icon: React.ReactNode; label: string }[];
  actions?: React.ReactNode;
  className?: string;
}

export function EntityProfileHeader({
  avatar,
  title,
  subtitle,
  status,
  metadata,
  actions,
  className,
}: EntityProfileHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)] p-6",
        className
      )}
    >
      {avatar && (
        <div className="h-16 w-16 shrink-0 rounded-full bg-[var(--surface-muted)] flex items-center justify-center overflow-hidden">
          {avatar}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
              {status && <StatusChip status={status} />}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {metadata && metadata.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <span className="text-[var(--text-placeholder)]">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════════ */

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KpiCard({ title, value, change, icon, trend, className }: KpiCardProps) {
  const trendColors = {
    up: "text-[var(--color-success-text)]",
    down: "text-[var(--color-error-text)]",
    neutral: "text-[var(--text-muted)]",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)] p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-muted)]">{title}</span>
        {icon && (
          <div className="rounded-lg bg-[var(--color-primary-50)] p-2 text-[var(--color-primary)]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-[var(--text-primary)]">{value}</span>
        {change && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", trend && trendColors[trend])}>
            <TrendIcon className="h-4 w-4" />
            <span>{change.value > 0 ? "+" : ""}{change.value}%</span>
            {change.label && (
              <span className="text-[var(--text-muted)] font-normal">{change.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TIMELINE / ACTIVITY FEED
   ═══════════════════════════════════════════════════════════════ */

interface TimelineItem {
  id: string;
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute start-4 top-0 bottom-0 w-px bg-[var(--border-base)]" />

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="relative flex gap-4 ps-10">
            {/* Icon */}
            <div
              className={cn(
                "absolute start-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--surface-base)]",
                item.iconBg || "bg-[var(--color-primary-50)] text-[var(--color-primary)]"
              )}
            >
              {item.icon || <Circle className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--text-placeholder)]">{item.timestamp}</span>
              </div>
              {item.user && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <div className="h-5 w-5 rounded-full bg-[var(--surface-muted)] flex items-center justify-center">
                    <User className="h-3 w-3" />
                  </div>
                  {item.user.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUMMARY CARDS / INFO SECTIONS
   ═══════════════════════════════════════════════════════════════ */

interface InfoItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface SummaryCardProps {
  title: string;
  items: InfoItem[];
  action?: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function SummaryCard({ title, items, action, columns = 1, className }: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {action}
      </div>
      <div
        className={cn(
          "p-4",
          columns === 2 && "grid grid-cols-2 gap-4"
        )}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3",
              columns === 1 && idx > 0 && "mt-4 pt-4 border-t border-[var(--border-subtle)]"
            )}
          >
            {item.icon && (
              <div className="mt-0.5 text-[var(--text-placeholder)]">{item.icon}</div>
            )}
            <div className="flex-1 min-w-0">
              <span className="block text-xs text-[var(--text-muted)]">{item.label}</span>
              <span className="block mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT / FILE ROW
   ═══════════════════════════════════════════════════════════════ */

interface FileRowProps {
  name: string;
  type: string;
  size?: string;
  date?: string;
  status?: StatusType;
  actions?: { id: string; label: string; icon?: React.ReactNode; onClick: () => void }[];
  onClick?: () => void;
  className?: string;
}

export function FileRow({
  name,
  type,
  size,
  date,
  status,
  actions,
  onClick,
  className,
}: FileRowProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-5 w-5 text-red-500" />,
    doc: <FileText className="h-5 w-5 text-blue-500" />,
    xls: <FileText className="h-5 w-5 text-green-500" />,
    default: <FileText className="h-5 w-5 text-[var(--text-muted)]" />,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)] px-4 py-3 transition-colors",
        onClick && "cursor-pointer hover:bg-[var(--surface-hover)]",
        className
      )}
      onClick={onClick}
    >
      <div className="shrink-0">{typeIcons[type] || typeIcons.default}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{name}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
          <span>{type.toUpperCase()}</span>
          {size && (
            <>
              <span className="text-[var(--border-strong)]">•</span>
              <span>{size}</span>
            </>
          )}
          {date && (
            <>
              <span className="text-[var(--border-strong)]">•</span>
              <span>{date}</span>
            </>
          )}
        </div>
      </div>

      {status && <StatusChip status={status} size="sm" />}

      {actions && actions.length > 0 && (
        <ActionMenu
          items={actions.map((a) => ({
            ...a,
            onClick: () => {
              a.onClick();
            },
          }))}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILTER PANEL (Sidebar)
   ═══════════════════════════════════════════════════════════════ */

interface FilterSection {
  id: string;
  title: string;
  type: "checkbox" | "radio";
  options: { id: string; label: string; count?: number }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

interface FilterPanelProps {
  sections: FilterSection[];
  onClearAll: () => void;
  className?: string;
}

export function FilterPanel({ sections, onClearAll, className }: FilterPanelProps) {
  const totalActive = sections.reduce((acc, s) => acc + s.selectedValues.length, 0);

  return (
    <div
      className={cn(
        "w-64 shrink-0 rounded-lg border border-[var(--border-base)] bg-[var(--surface-base)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">סינון</h3>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            נקה הכל ({totalActive})
          </button>
        )}
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {sections.map((section) => (
          <div key={section.id} className="p-4">
            <h4 className="mb-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              {section.title}
            </h4>
            <div className="space-y-2">
              {section.options.map((opt) => {
                const isSelected = section.selectedValues.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type={section.type}
                      checked={isSelected}
                      onChange={() => {
                        if (section.type === "checkbox") {
                          const newValues = isSelected
                            ? section.selectedValues.filter((v) => v !== opt.id)
                            : [...section.selectedValues, opt.id];
                          section.onChange(newValues);
                        } else {
                          section.onChange([opt.id]);
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                        section.type === "radio" && "rounded-full",
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                          : "border-[var(--border-strong)] bg-[var(--surface-base)] group-hover:border-[var(--color-primary)]"
                      )}
                    >
                      {isSelected &&
                        (section.type === "checkbox" ? (
                          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        ))}
                    </div>
                    <span className="flex-1 text-sm text-[var(--text-primary)]">{opt.label}</span>
                    {opt.count !== undefined && (
                      <span className="text-xs text-[var(--text-placeholder)]">{opt.count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
