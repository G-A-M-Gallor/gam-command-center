"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { _Clock, Tag, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { NoteRecord, EntityType } from "@/lib/entities/types";
import { VNOTE_STATUS_OPTIONS } from "./vNote.types";

interface Props {
  entity: NoteRecord;
  onUpdate?: (updated: Partial<NoteRecord>) => void;
}

const STATUS_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/20 text-emerald-300",
  slate: "bg-slate-500/20 text-slate-300",
  amber: "bg-amber-500/20 text-amber-300",
  blue: "bg-blue-500/20 text-blue-300",
  purple: "bg-purple-500/20 text-purple-300",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return new Date(dateStr).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function VNoteUniversalFields({ entity, onUpdate }: Props) {
  const [title, setTitle] = useState(entity.title);
  const [status, setStatus] = useState(entity.status);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Fetch entity type definition for badge
  const { data: typeDef } = useQuery({
    queryKey: ["vnote-entity-type-badge", entity.entity_type],
    queryFn: async () => {
      if (!entity.entity_type) return null;
      const { data } = await supabase
        .from("entity_types")
        .select("slug, label, icon, color")
        .eq("slug", entity.entity_type)
        .single();
      return data as Pick<EntityType, "slug" | "label" | "icon" | "color"> | null;
    },
    enabled: !!entity.entity_type,
    staleTime: 5 * 60_000,
  });

  const handleTitleBlur = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === entity.title) {
      setTitle(entity.title);
      return;
    }
    setSaving(true);
    await supabase.from("vb_records").update({ title: trimmed }).eq("id", entity.id);
    onUpdate?.({ title: trimmed });
    setSaving(false);
  }, [entity.id, entity.title, title, onUpdate]);

  const handleStatusChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      setStatus(newStatus);
      await supabase.from("vb_records").update({ status: newStatus }).eq("id", entity.id);
      onUpdate?.({ status: newStatus });
    },
    [entity.id, onUpdate],
  );

  const tags = Array.isArray(entity.meta?.tags) ? (entity.meta.tags as string[]) : [];

  const currentOpt = VNOTE_STATUS_OPTIONS.find((o) => o.value === status);
  const colorClass = STATUS_COLORS[currentOpt?.color ?? "slate"] ?? STATUS_COLORS.slate;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      {/* Row 1: Title + Entity Type Badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] text-slate-500 mb-1">שם</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") titleRef.current?.blur();
              if (e.key === "Escape") {
                setTitle(entity.title);
                titleRef.current?.blur();
              }
            }}
            className="w-full bg-transparent text-sm font-semibold text-slate-100 border-b border-transparent hover:border-white/10 focus:border-purple-500/50 focus:outline-none py-1 transition-colors"
          />
          {saving && <span className="text-[10px] text-slate-500">שומר...</span>}
        </div>

        {/* Entity Type Badge */}
        {entity.entity_type && (
          <div className="shrink-0 mt-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/20 px-2.5 py-1 text-[11px] font-medium text-purple-300">
              <span>{typeDef?.icon ?? "📄"}</span>
              <span>{typeDef?.label?.he ?? entity.entity_type}</span>
            </span>
          </div>
        )}
      </div>

      {/* Row 2: Status + Dates + Creator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {/* Status */}
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">סטטוס</label>
          <select
            value={status}
            onChange={handleStatusChange}
            className={`rounded-md px-2 py-1 text-xs font-medium border-0 cursor-pointer transition-colors ${colorClass} bg-opacity-20`}
          >
            {VNOTE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Created */}
        <div>
          <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <Clock className="w-2.5 h-2.5" /> נוצר
          </label>
          <p className="text-xs text-slate-400 py-1">
            {relativeTime(entity.created_at)}
          </p>
        </div>

        {/* Updated */}
        <div>
          <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <Clock className="w-2.5 h-2.5" /> עודכן
          </label>
          <p className="text-xs text-slate-400 py-1">
            {entity.last_edited_at ? relativeTime(entity.last_edited_at) : "—"}
          </p>
        </div>

        {/* Creator */}
        <div>
          <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <User className="w-2.5 h-2.5" /> יוצר
          </label>
          <p className="text-xs text-slate-400 py-1 truncate">
            {entity.created_by ? entity.created_by.slice(0, 8) + "..." : "מערכת"}
          </p>
        </div>
      </div>

      {/* Row 3: Tags */}
      <div>
        <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
          <Tag className="w-2.5 h-2.5" /> תגים
        </label>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-700/60 border border-slate-600/30 px-2.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-600/60 transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-1">אין תגים</p>
        )}
      </div>
    </div>
  );
}
