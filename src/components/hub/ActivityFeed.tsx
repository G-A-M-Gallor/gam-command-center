"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  ArrowRightLeft,
  MessageSquare,
  PlusCircle,
  Trash2,
  FileText,
} from "lucide-react";
import type { HubActivityItem } from "@/lib/supabase/hubQueries";
import { Skeleton } from "@/components/ui";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  field_change: { icon: Pencil, color: "text-blue-400 bg-blue-500/15", label: "Field changed" },
  status_change: { icon: ArrowRightLeft, color: "text-amber-400 bg-amber-500/15", label: "Status changed" },
  comment: { icon: MessageSquare, color: "text-purple-400 bg-purple-500/15", label: "Comment" },
  created: { icon: PlusCircle, color: "text-emerald-400 bg-emerald-500/15", label: "Created" },
  deleted: { icon: Trash2, color: "text-red-400 bg-red-500/15", label: "Deleted" },
};

const DEFAULT_CONFIG = { icon: FileText, color: "text-slate-400 bg-slate-500/15", label: "Activity" };

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityFeedProps {
  items: HubActivityItem[];
  loading: boolean;
  noActivityLabel: string;
  onContextMenu?: (e: React.MouseEvent, item: HubActivityItem) => void;
}

export function ActivityFeed({
  items,
  loading,
  noActivityLabel,
  onContextMenu,
}: ActivityFeedProps) {
  const _router = useRouter();

  const handleClick = useCallback(
    (noteId: string) => {
      router.push(`/dashboard/editor?doc=${noteId}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg p-2">
            <Skeleton width="2rem" height="2rem" rounded />
            <div className="flex-1 space-y-1">
              <Skeleton width="60%" height="0.75rem" />
              <Skeleton width="40%" height="0.625rem" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-sm text-slate-500">
        {noActivityLabel}
      </div>
    );
  }

  return (
    <div className="max-h-[400px] space-y-0.5 overflow-y-auto pr-1">
      {items.map((item) => {
        const config = TYPE_CONFIG[item.type] || DEFAULT_CONFIG;
        const Icon = config.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item.noteId)}
            onContextMenu={onContextMenu ? (e) => onContextMenu(e, item) : undefined}
            className="flex w-full items-start gap-3 rounded-lg p-2 text-start transition-colors hover:bg-white/[0.03]"
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${config.color}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-slate-200">
                  {item.noteTitle}
                </span>
                {item.entityType && (
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {item.entityType}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {item.fieldKey && (
                  <span className="text-slate-400">{item.fieldKey}: </span>
                )}
                {item.newValue && (
                  <span className="text-slate-400">
                    {item.newValue.length > 50
                      ? item.newValue.slice(0, 50) + "..."
                      : item.newValue}
                  </span>
                )}
                {!item.fieldKey && !item.newValue && (
                  <span>{config.label}</span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-slate-600">
              {relativeTime(item.timestamp)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
