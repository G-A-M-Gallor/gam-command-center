"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { NoteRecord } from "@/lib/entities/types";
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

export function VNoteUniversalFields({ entity, onUpdate }: Props) {
  const [title, setTitle] = useState(entity.title);
  const [status, setStatus] = useState(entity.status);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

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
  const createdAt = new Date(entity.created_at).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const currentOpt = VNOTE_STATUS_OPTIONS.find((o) => o.value === status);
  const colorClass = STATUS_COLORS[currentOpt?.color ?? "slate"] ?? STATUS_COLORS.slate;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Title — editable inline */}
        <div className="sm:col-span-2">
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

        {/* Created date — read only */}
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">תאריך יצירה</label>
          <p className="text-sm text-slate-300 py-1">{createdAt}</p>
        </div>

        {/* Status — dropdown */}
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

        {/* Tags — multi-select display */}
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="block text-[10px] text-slate-500 mb-1">תגים</label>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-1">אין תגים</p>
          )}
        </div>
      </div>
    </div>
  );
}
