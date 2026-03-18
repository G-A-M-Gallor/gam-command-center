"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Briefcase, MapPin, ChevronUp, ExternalLink, Loader2,
  Eye, Phone, Calendar, CheckCircle2, XCircle, UserX, ThumbsDown, Ban, Clock, UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ─── Status definitions (must match matching page) ───────
const STATUSES: Record<string, { tier: number; color: string; icon: typeof Users; label_he: string; label_en: string }> = {
  interested:         { tier: 1, color: "bg-blue-500",    icon: Eye,          label_he: "מתעניין",          label_en: "Interested" },
  contacted:          { tier: 1, color: "bg-indigo-500",  icon: Phone,        label_he: "נוצר קשר",        label_en: "Contacted" },
  interview:          { tier: 1, color: "bg-amber-500",   icon: Calendar,     label_he: "ראיון",           label_en: "Interview" },
  accepted:           { tier: 1, color: "bg-emerald-500", icon: CheckCircle2, label_he: "התקבל",           label_en: "Accepted" },
  added:              { tier: 2, color: "bg-slate-500",   icon: UserPlus,     label_he: "ברשימה",          label_en: "In List" },
  rejected_by_me:     { tier: 3, color: "bg-red-500",     icon: ThumbsDown,   label_he: "לא מתאים (אני)", label_en: "Not a fit" },
  candidate_declined: { tier: 3, color: "bg-orange-500",  icon: UserX,        label_he: "המועמד סירב",    label_en: "Declined" },
  client_rejected:    { tier: 3, color: "bg-rose-600",    icon: XCircle,      label_he: "הלקוח דחה",      label_en: "Client rejected" },
  excluded:           { tier: 0, color: "bg-slate-700",   icon: Ban,          label_he: "מושלל",           label_en: "Excluded" },
};

interface ShortlistRow {
  id: string;
  source_id: string;
  target_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  // joined
  other_id: string;
  other_title: string;
  other_type: string;
  other_meta: Record<string, unknown>;
}

interface Props {
  noteId: string;
  entityType: string;
  language: string;
}

export function MatchingShortlistPanel({ noteId, entityType, language }: Props) {
  const router = useRouter();
  const isRtl = language === "he";
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ShortlistRow[]>([]);

  // Determine perspective: am I a "source" (position/client) or "target" (worker)?
  const isSource = ["client", "lead", "project"].includes(entityType);

  const title = isSource
    ? (isRtl ? "מועמדים ברשימה" : "Shortlisted Candidates")
    : (isRtl ? "משרות שהתעניינתי בהן" : "Positions I'm listed in");

  const emptyText = isSource
    ? (isRtl ? "אין מועמדים ברשימה עדיין" : "No shortlisted candidates yet")
    : (isRtl ? "לא נמצא באף רשימת משרה" : "Not listed in any positions");

  const loadData = useCallback(async () => {
    setLoading(true);
    // Query shortlist from both sides
    const column = isSource ? "source_id" : "target_id";
    const otherColumn = isSource ? "target_id" : "source_id";

    const { data: shortlistData } = await supabase
      .from("matching_shortlist")
      .select("*")
      .eq(column, noteId)
      .neq("status", "excluded")
      .order("updated_at", { ascending: false });

    if (!shortlistData || shortlistData.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    // Fetch the other entity details
    const otherIds = shortlistData.map((r) => r[otherColumn]);
    const { data: otherNotes } = await supabase
      .from("vb_records")
      .select("id, title, entity_type, meta")
      .in("id", otherIds);

    const noteMap = new Map<string, { title: string; entity_type: string; meta: Record<string, unknown> }>();
    for (const n of otherNotes ?? []) {
      noteMap.set(n.id, { title: n.title, entity_type: n.entity_type || "", meta: (n.meta || {}) as Record<string, unknown> });
    }

    const mapped: ShortlistRow[] = shortlistData.map((r) => {
      const otherId = r[otherColumn];
      const other = noteMap.get(otherId);
      return {
        ...r,
        other_id: otherId,
        other_title: other?.title || otherId.slice(0, 8),
        other_type: other?.entity_type || "",
        other_meta: other?.meta || {},
      };
    });

    // Sort: tier 1 first, then tier 2, then tier 3
    mapped.sort((a, b) => {
      const ta = STATUSES[a.status]?.tier ?? 2;
      const tb = STATUSES[b.status]?.tier ?? 2;
      if (ta !== tb) return ta - tb;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    setRows(mapped);
    setLoading(false);
  }, [noteId, isSource]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading && rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/40 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isRtl ? "טוען..." : "Loading..."}
        </div>
      </div>
    );
  }

  // Don't render panel if no data and entity type doesn't participate in matching
  if (rows.length === 0 && !["client", "lead", "project", "employee", "worker", "talent", "contractor"].includes(entityType)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-700/40 bg-white/[0.02]">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 cursor-pointer"
      >
        <Users className="h-4 w-4 text-[var(--cc-accent-400)]" />
        <span className="text-xs font-semibold text-slate-200 flex-1 text-start">{title}</span>
        <span className="rounded-full bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400">{rows.length}</span>
        <ChevronUp className={`h-3.5 w-3.5 text-slate-500 transition-transform ${!expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-700/30">
          {rows.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <span className="text-xs text-slate-500">{emptyText}</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {rows.map((row) => {
                const sd = STATUSES[row.status] || STATUSES.added;
                const Icon = sd.icon;
                const cleanTitle = row.other_title.replace("[דוגמה] ", "");

                // Extract display info based on perspective
                const skills = isSource
                  ? (row.other_meta.skills as string[]) || []
                  : (row.other_meta.required_skills as string[]) || [];
                const location = isSource
                  ? (row.other_meta.location as string[]) || []
                  : (row.other_meta.service_area as string[]) || [];
                const experience = row.other_meta.experience_years as number | undefined;
                const hourlyRate = row.other_meta.hourly_rate as number | undefined;

                return (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/entities/${row.other_type}/${row.other_id}`)}
                  >
                    {/* Status badge */}
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${sd.color}`}>
                      <Icon className="h-3 w-3 text-white" />
                    </span>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-200 truncate">{cleanTitle}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium text-white ${sd.color}`}>
                          {language === "he" ? sd.label_he : sd.label_en}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        {location.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />{location.join(", ")}
                          </span>
                        )}
                        {skills.length > 0 && (
                          <span className="truncate max-w-[150px]">{skills.slice(0, 3).join(", ")}</span>
                        )}
                        {experience !== undefined && (
                          <span className="flex items-center gap-0.5">
                            <Briefcase className="h-2.5 w-2.5" />{experience}{isRtl ? " שנים" : "y"}
                          </span>
                        )}
                        {hourlyRate !== undefined && <span>₪{hourlyRate}</span>}
                      </div>
                    </div>

                    {/* Date */}
                    <span className="text-[10px] text-slate-600 shrink-0">
                      {new Date(row.updated_at).toLocaleDateString(language === "he" ? "he-IL" : "en-US", { day: "numeric", month: "short" })}
                    </span>

                    <ExternalLink className="h-3 w-3 text-slate-600 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
