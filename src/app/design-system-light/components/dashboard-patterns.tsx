"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Phone,
  Mail,
  ChevronLeft,
  MoreHorizontal,
  Plus,
  Filter,
} from "lucide-react";
import { Card, Badge, Button, ActionMenu } from "./core-components";
import { StatusChip, KpiCard } from "./data-patterns";

/* ═══════════════════════════════════════════════════════════════
   KPI ROW
   Horizontal row of KPI cards
   ═══════════════════════════════════════════════════════════════ */

interface KpiItem {
  id: string;
  title: string;
  value: string | number;
  change?: { value: number; label?: string };
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

interface KpiRowProps {
  items: KpiItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function KpiRow({ items, columns = 4, className }: KpiRowProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {items.map((item) => (
        <KpiCard
          key={item.id}
          title={item.title}
          value={item.value}
          change={item.change}
          trend={item.trend}
          icon={item.icon}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECENT ACTIVITY WIDGET
   ═══════════════════════════════════════════════════════════════ */

interface ActivityItem {
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
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface RecentActivityProps {
  title?: string;
  items: ActivityItem[];
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}

export function RecentActivity({
  title = "פעילות אחרונה",
  items,
  maxItems = 5,
  onViewAll,
  className,
}: RecentActivityProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={className}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
          >
            הצג הכל
            <ChevronLeft className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                item.iconBg || "bg-[var(--color-primary-50)] text-[var(--color-primary)]"
              )}
            >
              {item.icon || <Clock className="h-4 w-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{item.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--text-placeholder)]">
                  {item.timestamp}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                {item.user && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <div className="h-4 w-4 rounded-full bg-[var(--surface-muted)] flex items-center justify-center">
                      <User className="h-2.5 w-2.5" />
                    </div>
                    {item.user.name}
                  </div>
                )}
                {item.action && (
                  <button
                    type="button"
                    onClick={item.action.onClick}
                    className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          אין פעילות אחרונה
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
   ═══════════════════════════════════════════════════════════════ */

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "warning";
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActions({
  title = "פעולות מהירות",
  actions,
  columns = 4,
  className,
}: QuickActionsProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  const variantStyles = {
    default: "bg-[var(--surface-base)] border-[var(--border-base)] hover:border-[var(--border-strong)]",
    primary: "bg-[var(--color-primary-50)] border-[var(--color-primary-200)] hover:bg-[var(--color-primary-100)]",
    success: "bg-[var(--color-success-light)] border-[var(--color-success-100)] hover:bg-[var(--color-success-100)]",
    warning: "bg-[var(--color-warning-light)] border-[var(--color-warning-100)] hover:bg-[var(--color-warning-100)]",
  };

  const iconStyles = {
    default: "text-[var(--text-muted)]",
    primary: "text-[var(--color-primary)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      )}
      <div className={cn("grid gap-3", gridCols[columns])}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all",
              "hover:shadow-md active:scale-[0.98]",
              variantStyles[action.variant || "default"]
            )}
          >
            <div className={cn("text-2xl", iconStyles[action.variant || "default"])}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{action.label}</span>
            {action.description && (
              <span className="text-xs text-[var(--text-muted)]">{action.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TABLE PREVIEW WIDGET
   Compact table for dashboard overview
   ═══════════════════════════════════════════════════════════════ */

interface TablePreviewColumn {
  id: string;
  header: string;
  accessor: (row: Record<string, unknown>) => React.ReactNode;
  width?: string;
}

interface TablePreviewProps {
  title: string;
  columns: TablePreviewColumn[];
  data: Record<string, unknown>[];
  maxRows?: number;
  onViewAll?: () => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  className?: string;
}

export function TablePreview({
  title,
  columns,
  data,
  maxRows = 5,
  onViewAll,
  onRowClick,
  className,
}: TablePreviewProps) {
  const displayData = data.slice(0, maxRows);

  return (
    <Card padding="none" className={className}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="default">{data.length}</Badge>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              הצג הכל
              <ChevronLeft className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] text-start"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {displayData.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[var(--surface-hover)]"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-2.5 text-sm text-[var(--text-primary)]">
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          אין נתונים להצגה
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATUS OVERVIEW
   Visual summary of item statuses
   ═══════════════════════════════════════════════════════════════ */

interface StatusCount {
  status: "active" | "pending" | "completed" | "paused" | "cancelled" | "error";
  count: number;
  label?: string;
}

interface StatusOverviewProps {
  title?: string;
  items: StatusCount[];
  showTotal?: boolean;
  onStatusClick?: (status: string) => void;
  className?: string;
}

export function StatusOverview({
  title = "סטטוס כללי",
  items,
  showTotal = true,
  onStatusClick,
  className,
}: StatusOverviewProps) {
  const total = items.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card className={className}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {showTotal && (
          <span className="text-sm text-[var(--text-muted)]">סה"כ: {total}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.status}
            type="button"
            onClick={() => onStatusClick?.(item.status)}
            className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border-base)] p-3 transition-colors hover:bg-[var(--surface-hover)]"
          >
            <span className="text-2xl font-bold text-[var(--text-primary)]">{item.count}</span>
            <StatusChip status={item.status} label={item.label} size="sm" />
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASKS / FOLLOW-UP WIDGET
   ═══════════════════════════════════════════════════════════════ */

interface TaskItem {
  id: string;
  title: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  assignee?: string;
  completed?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

interface TasksWidgetProps {
  title?: string;
  tasks: TaskItem[];
  maxTasks?: number;
  onAddTask?: () => void;
  onViewAll?: () => void;
  className?: string;
}

export function TasksWidget({
  title = "משימות",
  tasks,
  maxTasks = 5,
  onAddTask,
  onViewAll,
  className,
}: TasksWidgetProps) {
  const displayTasks = tasks.slice(0, maxTasks);
  const priorityColors = {
    low: "bg-[var(--color-secondary-200)]",
    medium: "bg-[var(--color-warning)]",
    high: "bg-[var(--color-error)]",
  };

  return (
    <Card padding="none" className={className}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          <Badge variant="default">{tasks.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {onAddTask && (
            <Button variant="ghost" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAddTask}>
              הוסף
            </Button>
          )}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              הכל
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              task.onClick && "cursor-pointer hover:bg-[var(--surface-hover)]"
            )}
            onClick={task.onClick}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                task.onToggle?.();
              }}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                task.completed
                  ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                  : "border-[var(--border-strong)] hover:border-[var(--color-primary)]"
              )}
            >
              {task.completed && <CheckCircle2 className="h-3 w-3" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm",
                  task.completed
                    ? "text-[var(--text-muted)] line-through"
                    : "text-[var(--text-primary)]"
                )}
              >
                {task.title}
              </p>
              {(task.dueDate || task.assignee) && (
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.dueDate}
                    </span>
                  )}
                  {task.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  )}
                </div>
              )}
            </div>

            {task.priority && (
              <div className={cn("h-2 w-2 shrink-0 rounded-full", priorityColors[task.priority])} />
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          אין משימות
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD SECTION
   Standard section wrapper for dashboard
   ═══════════════════════════════════════════════════════════════ */

interface DashboardSectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  subtitle,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD GRID
   Responsive grid layout for dashboard widgets
   ═══════════════════════════════════════════════════════════════ */

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: "auto" | 2 | 3;
  className?: string;
}

export function DashboardGrid({ children, columns = "auto", className }: DashboardGridProps) {
  const gridClass = {
    auto: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("grid gap-6", gridClass[columns], className)}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WELCOME BANNER
   Dashboard greeting / welcome section
   ═══════════════════════════════════════════════════════════════ */

interface WelcomeBannerProps {
  greeting: string;
  userName?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function WelcomeBanner({
  greeting,
  userName,
  subtitle,
  actions,
  className,
}: WelcomeBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl bg-gradient-to-l from-[var(--color-primary-50)] to-[var(--surface-base)] border border-[var(--border-base)] p-6",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {greeting}{userName && `, ${userName}`}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
