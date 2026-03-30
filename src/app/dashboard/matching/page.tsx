"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronDown, AlertCircle, Users, Briefcase, MapPin,
  Wrench, RefreshCw, SlidersHorizontal, _X, Loader2,
  UserPlus, CheckCircle2, Phone, Calendar, XCircle,
  _Star, Mail, _ExternalLink, ListChecks, Minus,
  ThumbsDown, UserX, Ban, Eye, ChevronUp,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/lib/supabaseClient";
import { extractMatchProfile } from "@/lib/matching/matchProfiles";
import type { NoteRecord, EntityType, GlobalField } from "@/lib/entities/types";
import type { MatchScoreRow, MatchProfile } from "@/lib/matching/types";

// ─── Shortlist types ─────────────────────────────────────
interface ShortlistEntry {
  id: string;
  source_id: string;
  target_id: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── Status system — 3 tiers ─────────────────────────────
// TIER 1 — Advancing (top, green zone)
// TIER 2 — Pending / potential (middle, neutral)
// TIER 3 — Not advancing (bottom, red zone)

const STATUSES = {
  // Tier 1: Advancing
  interested:    { tier: 1, color: "bg-blue-500",     icon: Eye,          sortOrder: 1 },
  contacted:     { tier: 1, color: "bg-indigo-500",   icon: Phone,        sortOrder: 2 },
  interview:     { tier: 1, color: "bg-amber-500",    icon: Calendar,     sortOrder: 3 },
  accepted:      { tier: 1, color: "bg-emerald-500",  icon: CheckCircle2, sortOrder: 4 },
  // Tier 2: Pending
  added:         { tier: 2, color: "bg-slate-500",    icon: UserPlus,     sortOrder: 10 },
  // Tier 3: Not advancing
  rejected_by_me:     { tier: 3, color: "bg-red-500",      icon: ThumbsDown, sortOrder: 20 },
  candidate_declined: { tier: 3, color: "bg-orange-500",   icon: UserX,      sortOrder: 21 },
  client_rejected:    { tier: 3, color: "bg-rose-600",     icon: XCircle,    sortOrder: 22 },
  // Special: excluded from search entirely
  excluded:      { tier: 0, color: "bg-slate-700",    icon: Ban,          sortOrder: 99 },
} as const;

type StatusKey = keyof typeof STATUSES;
const ALL_STATUS_KEYS = Object.keys(STATUSES) as StatusKey[];
const TIER1_STATUSES = ALL_STATUS_KEYS.filter((k) => STATUSES[k].tier === 1);
const TIER3_STATUSES = ALL_STATUS_KEYS.filter((k) => STATUSES[k].tier === 3);

// ─── Labels (inline, bilingual) ──────────────────────────
const L = {
  he: {
    title: "מנוע התאמות",
    subtitle: "מצא את המועמדים המתאימים ביותר למשרה",
    selectPosition: "בחר משרה / לקוח",
    searchPositions: "חיפוש משרות...",
    searchCandidates: "חיפוש מועמדים...",
    matchTo: "חפש התאמה מול",
    allTypes: "כל סוגי הישויות",
    findMatches: "מצא התאמות",
    refresh: "רענן",
    noPositionSelected: "בחר משרה כדי להתחיל",
    noPositionDesc: "בחר לקוח או משרה מהרשימה בצד, ולחץ על ׳מצא התאמות׳ כדי לראות מועמדים מתאימים",
    loading: "מחפש התאמות...",
    noResults: "לא נמצאו התאמות",
    noResultsDesc: "נסה לשנות את סוג היעד או לרענן",
    candidates: "מועמדים",
    skills: "כישורים",
    location: "אזור",
    experience: "ניסיון",
    years: "שנים",
    availability: "זמינות",
    hourlyRate: "שכר שעתי",
    semantic: "סמנטי",
    fields: "שדות",
    recency: "עדכניות",
    minMatch: "התאמה מינימלית",
    addToList: "הוסף לרשימה",
    removeFromList: "הסר",
    exclude: "שלול",
    shortlist: "רשימה מקוצרת",
    candidateProfile: "פרופיל מועמד",
    close: "סגור",
    openEntity: "פתח ישות",
    scoreBreakdown: "פירוט ציון",
    notes: "הערות",
    // Tier headers
    tierAdvancing: "מתקדמים",
    tierAdvancingDesc: "מועמדים שאנחנו מקדמים איתם",
    tierPending: "פוטנציאליים",
    tierPendingDesc: "נבחרו לרשימה, טרם הוחלט",
    tierRejected: "לא מתקדמים",
    tierRejectedDesc: "מועמדים שלא נבחרו או סירבו",
    tierUnreviewed: "טרם נבדקו",
    tierUnreviewedDesc: "כל שאר המועמדים",
    // Statuses
    status_interested: "מתעניין",
    status_contacted: "נוצר קשר",
    status_interview: "ראיון",
    status_accepted: "התקבל",
    status_added: "ברשימה",
    status_rejected_by_me: "לא מתאים (אני)",
    status_candidate_declined: "המועמד סירב",
    status_client_rejected: "הלקוח דחה",
    status_excluded: "מושלל",
  },
  en: {
    title: "Matching Engine",
    subtitle: "Find the best candidates for the position",
    selectPosition: "Select position / client",
    searchPositions: "Search positions...",
    searchCandidates: "Search candidates...",
    matchTo: "Match against",
    allTypes: "All entity types",
    findMatches: "Find Matches",
    refresh: "Refresh",
    noPositionSelected: "Select a position to begin",
    noPositionDesc: "Choose a client or position from the list, then click 'Find Matches' to see matching candidates",
    loading: "Finding matches...",
    noResults: "No matches found",
    noResultsDesc: "Try changing the target type or refreshing",
    candidates: "candidates",
    skills: "Skills",
    location: "Location",
    experience: "Experience",
    years: "years",
    availability: "Availability",
    hourlyRate: "Hourly Rate",
    semantic: "Semantic",
    fields: "Fields",
    recency: "Recency",
    minMatch: "Min match",
    addToList: "Add to list",
    removeFromList: "Remove",
    exclude: "Exclude",
    shortlist: "Shortlist",
    candidateProfile: "Candidate Profile",
    close: "Close",
    openEntity: "Open Entity",
    scoreBreakdown: "Score Breakdown",
    notes: "Notes",
    tierAdvancing: "Advancing",
    tierAdvancingDesc: "Candidates we are moving forward with",
    tierPending: "Potential",
    tierPendingDesc: "Added to list, not yet decided",
    tierRejected: "Not Advancing",
    tierRejectedDesc: "Candidates who were rejected or declined",
    tierUnreviewed: "Unreviewed",
    tierUnreviewedDesc: "All other candidates",
    status_interested: "Interested",
    status_contacted: "Contacted",
    status_interview: "Interview",
    status_accepted: "Accepted",
    status_added: "In List",
    status_rejected_by_me: "Not a fit (me)",
    status_candidate_declined: "Candidate declined",
    status_client_rejected: "Client rejected",
    status_excluded: "Excluded",
  },
};

// ─── Session storage ─────────────────────────────────────
const STORAGE_KEY = "matching-page-state";

interface SavedState {
  selectedType: string;
  targetType: string;
  selectedEntityId: string | null;
  minScore: number;
  candidateSearch: string;
  searchQuery: string;
}

function savePageState(s: SavedState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {
    // Ignore errors
  }
}

function loadPageState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Score helpers ───────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 0.7) return { ring: "ring-emerald-500/30", bg: "bg-emerald-500", text: "text-emerald-400" };
  if (score >= 0.4) return { ring: "ring-amber-500/30", bg: "bg-amber-500", text: "text-amber-400" };
  return { ring: "ring-red-500/30", bg: "bg-red-500", text: "text-red-400" };
}

function ScoreBadge({ score, size = 56 }: { score: number; size?: number }) {
  const pct = Math.round(score * 100);
  const { text, bg } = scoreColor(score);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-slate-700/50" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeLinecap="round"
          className={bg} style={{ strokeDasharray: circ, strokeDashoffset: offset, transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${text}`}>{pct}%</span>
    </div>
  );
}

function statusLabel(status: string, _t: typeof L.he) {
  return (_t as Record<string, string>)[`status_${status}`] || status;
}

function statusDef(status: string) {
  return STATUSES[status as StatusKey] || STATUSES.added;
}

// ─── Candidate Card ──────────────────────────────────────
function CandidateCard({
  score, meta, title, onView, onToggleShortlist, onRemoveFromList, onExclude,
  shortlistStatus, _t, _compact,
}: {
  score: MatchScoreRow;
  meta: Record<string, unknown> | null;
  title: string;
  onView: () => void;
  onToggleShortlist: () => void;
  onRemoveFromList: () => void;
  onExclude: () => void;
  shortlistStatus: string | null;
  t: typeof L.he;
  compact?: boolean;
}) {
  const c = scoreColor(score.total_score);
  const skills = (meta?.skills as string[]) || [];
  const location = (meta?.location as string[]) || [];
  const experience = meta?.experience_years as number | undefined;
  const hourlyRate = meta?.hourly_rate as number | undefined;
  const availFrom = meta?.available_from as string | undefined;
  const availTo = meta?.available_to as string | undefined;
  const isShortlisted = shortlistStatus !== null;
  const sd = isShortlisted ? statusDef(shortlistStatus!) : null;
  const cleanTitle = title.replace("[דוגמה] ", "");

  return (
    <div className={`group relative rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm transition-all duration-200 hover:border-slate-600/60 hover:bg-slate-800/60 cursor-pointer ${c.ring} ring-1`}
      onClick={onView}
    >
      {/* Status badge */}
      {isShortlisted && sd && (
        <div className="absolute top-2 end-2 z-10">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${sd.color}`}>
            {(() => { const Icon = sd.icon; return <Icon className="h-3 w-3 text-white" />; })()}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700/50">
          <span className="text-sm font-semibold text-slate-300">{cleanTitle.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-100 truncate group-hover:text-white">{cleanTitle}</h3>
          {location.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-slate-500" />
              <span className="text-[11px] text-slate-500 truncate">{location.join(", ")}</span>
            </div>
          )}
        </div>
        <ScoreBadge score={score.total_score} size={48} />
      </div>

      {/* Skills */}
      {!compact && skills.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {skills.slice(0, 5).map((s) => (
            <span key={s} className="rounded-md bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-300">{s}</span>
          ))}
          {skills.length > 5 && (
            <span className="rounded-md bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-500">+{skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Meta + action buttons */}
      <div className="flex items-center gap-2 border-t border-slate-700/30 px-4 py-2 text-[11px] text-slate-400">
        {experience !== undefined && (
          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{experience} {_t.years}</span>
        )}
        {hourlyRate !== undefined && (
          <span>₪{hourlyRate}/{_t.hourlyRate.includes("שעתי") ? "שעה" : "hr"}</span>
        )}
        {availFrom && !compact && (
          <span className="text-[10px] text-slate-500">{availFrom.slice(5)} → {availTo?.slice(5) || "..."}</span>
        )}

        {/* Action buttons */}
        <div className="ms-auto flex items-center gap-1">
          {/* Add / status indicator */}
          {!isShortlisted ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
              className="flex items-center gap-1 rounded-md bg-slate-700/30 px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors cursor-pointer"
              title={t.addToList}>
              <UserPlus className="h-3 w-3" />
            </button>
          ) : (
            <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${sd!.color}/10 text-slate-300`}>
              {statusLabel(shortlistStatus!, _t)}
            </span>
          )}
          {/* Remove from list */}
          {isShortlisted && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveFromList(); }}
              className="rounded-md p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
              title={t.removeFromList}>
              <Minus className="h-3 w-3" />
            </button>
          )}
          {/* Exclude */}
          {!isShortlisted && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onExclude(); }}
              className="rounded-md p-1 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
              title={t.exclude}>
              <Ban className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="flex gap-px rounded-b-xl overflow-hidden">
        <div className="h-1 bg-blue-500/60" style={{ width: `${Math.round(score.semantic_score * 100)}%` }} />
        <div className="h-1 bg-purple-500/60" style={{ width: `${Math.round(score.field_score * 100)}%` }} />
        <div className="h-1 bg-cyan-500/60" style={{ width: `${Math.round(score.recency_score * 100)}%` }} />
      </div>
    </div>
  );
}

// ─── Tier Section Header ─────────────────────────────────
function TierHeader({
  icon: Icon, title, desc, count, color, collapsed, onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  count: number;
  color: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center gap-3 py-2 cursor-pointer group">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 text-start">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">{title}</span>
          <span className="rounded-full bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400">{count}</span>
        </div>
        <span className="text-[10px] text-slate-500">{desc}</span>
      </div>
      <ChevronUp className={`h-4 w-4 text-slate-500 transition-transform ${collapsed ? "rotate-180" : ""}`} />
    </button>
  );
}

// ─── Position Summary (expandable) ───────────────────────
function PositionSummary({ entity, _t, isRtl }: { entity: NoteRecord; _t: typeof L.he; isRtl: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = entity.meta || {};
  const skills = (meta.required_skills as string[]) || (meta.skills as string[]) || [];
  const areas = (meta.service_area as string[]) || (meta.location as string[]) || [];
  const budget = meta.budget as number | undefined;
  const budgetMin = meta.budget_min as number | undefined;
  const budgetMax = meta.budget_max as number | undefined;
  const workers = meta.workers_needed as number | undefined;
  const startDate = meta.start_date as string | undefined;
  const endDate = meta.end_date as string | undefined;
  const description = meta.description as string | undefined;
  const notes = meta.notes as string | undefined;

  // Collect all meta keys for expanded view
  const allMeta = Object.entries(meta).filter(
    ([k, v]) => v !== null && v !== undefined && v !== "" && !k.startsWith("__") &&
    !["required_skills", "skills", "service_area", "location", "budget", "budget_min", "budget_max",
      "workers_needed", "start_date", "end_date", "description", "notes"].includes(k)
  );

  return (
    <div className="text-xs">
      {/* Compact row */}
      <div className="flex flex-wrap items-center gap-3">
        {skills.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-slate-500" />
            <div className="flex gap-1 flex-wrap">
              {skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded bg-[var(--cc-accent-600-20)] px-1.5 py-0.5 text-[10px] text-[var(--cc-accent-300)]">{s}</span>
              ))}
              {skills.length > 4 && <span className="text-[10px] text-slate-500">+{skills.length - 4}</span>}
            </div>
          </div>
        )}
        {areas.length > 0 && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400">{areas.join(", ")}</span>
          </div>
        )}
        {budgetMin !== undefined && budgetMax !== undefined ? (
          <span className="text-slate-400">₪{budgetMin.toLocaleString()} - ₪{budgetMax.toLocaleString()}</span>
        ) : budget !== undefined ? (
          <span className="text-slate-400">₪{budget.toLocaleString()}</span>
        ) : null}
        {workers !== undefined && (
          <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-500" /><span className="text-slate-400">{workers}</span></div>
        )}
        {startDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400">{startDate}{endDate ? ` → ${endDate}` : ""}</span>
          </div>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="ms-auto text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer">
          {expanded ? (isRtl ? "פחות" : "Less") : (isRtl ? "כל הפרטים" : "All details")}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 space-y-2 border-_t border-slate-700/30 pt-3">
          {description && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">{isRtl ? "תיאור" : "Description"}</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          )}
          {notes && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">{_t.notes}</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{notes}</p>
            </div>
          )}
          {allMeta.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {allMeta.map(([key, val]) => (
                <div key={key} className="rounded-lg bg-slate-800/30 px-2.5 py-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">{key.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-slate-300">
                    {Array.isArray(val) ? val.join(", ") : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Slide-Over Panel ────────────────────────────────────
function CandidateSlideOver({
  score, meta, title, onClose, onNavigate, shortlistStatus, onStatusChange, onRemove, _t, isRtl,
}: {
  score: MatchScoreRow;
  meta: Record<string, unknown> | null;
  title: string;
  onClose: () => void;
  onNavigate: () => void;
  shortlistStatus: string | null;
  onStatusChange: (status: string) => void;
  onRemove: () => void;
  t: typeof L.he;
  isRtl: boolean;
}) {
  const skills = (meta?.skills as string[]) || [];
  const location = (meta?.location as string[]) || [];
  const experience = meta?.experience_years as number | undefined;
  const hourlyRate = meta?.hourly_rate as number | undefined;
  const availFrom = meta?.available_from as string | undefined;
  const availTo = meta?.available_to as string | undefined;
  const email = meta?.email as string | undefined;
  const phone = meta?.phone as string | undefined;
  const certifications = (meta?.certifications as string[]) || [];
  const trades = (meta?.trades as string[]) || [];
  const description = meta?.description as string | undefined;
  const notes = meta?.notes as string | undefined;
  const cleanTitle = title.replace("[דוגמה] ", "");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed top-0 bottom-0 z-50 w-[440px] max-w-[90vw] bg-slate-900 border-s border-slate-700/50 shadow-2xl flex flex-col"
        style={{ [isRtl ? "left" : "right"]: 0, [isRtl ? "right" : "left"]: "auto" }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-700/40 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-100">{t.candidateProfile}</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onNavigate} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer" title={_t.openEntity}>
              <_ExternalLink className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer">
              <_X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile header */}
          <div className="px-5 py-5 border-b border-slate-700/40">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-700/50">
                <span className="text-lg font-bold text-slate-200">{cleanTitle.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{cleanTitle}</h3>
                {location.length > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">{location.join(", ")}</span>
                  </div>
                )}
              </div>
              <ScoreBadge score={score.total_score} size={64} />
            </div>
            {(email || phone) && (
              <div className="flex flex-wrap gap-3 mt-4 text-xs">
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                    <Mail className="h-3.5 w-3.5" />{email}
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                    <Phone className="h-3.5 w-3.5" />{phone}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Score breakdown */}
          <div className="px-5 py-4 border-b border-slate-700/40">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-3">{t.scoreBreakdown}</h4>
            <div className="space-y-2">
              {[
                { label: t.semantic, val: score.semantic_score, color: "bg-blue-500" },
                { label: t.fields, val: score.field_score, color: "bg-purple-500" },
                { label: t.recency, val: score.recency_score, color: "bg-cyan-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-16 text-[11px] text-slate-400">{row.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.round(row.val * 100)}%`, transition: "width 0.4s ease" }} />
                  </div>
                  <span className="w-10 text-end text-[11px] font-medium text-slate-300">{Math.round(row.val * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 border-b border-slate-700/40 space-y-4">
            {skills.length > 0 && (
              <div>
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">{_t.skills}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => <span key={s} className="rounded-md bg-slate-700/40 px-2.5 py-1 text-xs text-slate-300">{s}</span>)}
                </div>
              </div>
            )}
            {(certifications.length > 0 || trades.length > 0) && (
              <div>
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">
                  {isRtl ? "הסמכות ומקצועות" : "Certifications & Trades"}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[...certifications, ...trades].map((s) => (
                    <span key={s} className="rounded-md bg-[var(--cc-accent-600-20)] px-2.5 py-1 text-xs text-[var(--cc-accent-300)]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {experience !== undefined && (
                <div className="rounded-lg bg-slate-800/40 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">{t.experience}</span>
                  <span className="text-sm font-medium text-slate-200">{experience} {_t.years}</span>
                </div>
              )}
              {hourlyRate !== undefined && (
                <div className="rounded-lg bg-slate-800/40 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">{_t.hourlyRate}</span>
                  <span className="text-sm font-medium text-slate-200">₪{hourlyRate}</span>
                </div>
              )}
              {availFrom && (
                <div className="rounded-lg bg-slate-800/40 p-3 col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">{_t.availability}</span>
                  <span className="text-sm font-medium text-slate-200">{availFrom} → {availTo || "..."}</span>
                </div>
              )}
            </div>
            {(description || notes) && (
              <div>
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">{_t.notes}</h4>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{description || notes}</p>
              </div>
            )}
          </div>

          {/* Status picker — grouped by tier */}
          <div className="px-5 py-4 space-y-4">
            {/* Tier 1: Advancing */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-wider text-emerald-500/70 mb-2">{t.tierAdvancing}</h4>
              <div className="flex flex-wrap gap-2">
                {TIER1_STATUSES.map((key) => {
                  const s = STATUSES[key];
                  const Icon = s.icon;
                  const isActive = shortlistStatus === key;
                  return (
                    <button key={key} type="button" onClick={() => onStatusChange(key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                        isActive ? `${s.color} text-white shadow-lg` : "bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}>
                      <Icon className="h-3.5 w-3.5" />{statusLabel(key, _t)}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Tier 3: Not advancing */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-wider text-red-500/70 mb-2">{t.tierRejected}</h4>
              <div className="flex flex-wrap gap-2">
                {TIER3_STATUSES.map((key) => {
                  const s = STATUSES[key];
                  const Icon = s.icon;
                  const isActive = shortlistStatus === key;
                  return (
                    <button key={key} type="button" onClick={() => onStatusChange(key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                        isActive ? `${s.color} text-white shadow-lg` : "bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}>
                      <Icon className="h-3.5 w-3.5" />{statusLabel(key, _t)}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Remove / Exclude */}
            <div className="flex gap-2 pt-2 border-t border-slate-700/40">
              {shortlistStatus && (
                <button type="button" onClick={onRemove}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer">
                  <Minus className="h-3.5 w-3.5" />{_t.removeFromList}
                </button>
              )}
              <button type="button" onClick={() => onStatusChange("excluded")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                  shortlistStatus === "excluded" ? "bg-slate-700 text-white" : "text-slate-500 bg-slate-800/40 hover:bg-slate-800 hover:text-slate-300"
                }`}>
                <Ban className="h-3.5 w-3.5" />{t.exclude}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════
export default function MatchingPage() {
  const { language } = useSettings();
  const _router = useRouter();
  const _t = language === "he" ? L.he : L.en;
  const isRtl = language === "he";

  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [globalFields, setGlobalFields] = useState<GlobalField[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [targetType, setTargetType] = useState("");
  const [entities, setEntities] = useState<NoteRecord[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<NoteRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scores, setScores] = useState<MatchScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [_profile, setProfile] = useState<MatchProfile | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [restoredState, setRestoredState] = useState(false);

  const [targetMetas, setTargetMetas] = useState<Record<string, Record<string, unknown>>>({});
  const [targetTitles, setTargetTitles] = useState<Record<string, string>>({});
  const [targetTypes, setTargetTypes] = useState<Record<string, string>>({});

  const [slideOverTargetId, setSlideOverTargetId] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<Map<string, ShortlistEntry>>(new Map());

  // Tier collapse state
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});
  const toggleTier = (tier: string) => setCollapsedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));

  // ── Persist state ──
  useEffect(() => {
    if (!restoredState) return;
    savePageState({ selectedType, targetType, selectedEntityId: selectedEntity?.id || null, minScore, candidateSearch, searchQuery });
  }, [selectedType, targetType, selectedEntity?.id, minScore, candidateSearch, searchQuery, restoredState]);

  const loadTargetDetails = useCallback(async (scoreList: MatchScoreRow[]) => {
    const ids = scoreList.map((s) => s.target_id);
    if (!ids.length) return;
    const { data: notes } = await supabase.from("vb_records").select("id, title, entity_type, meta").in("id", ids);
    const titles: Record<string, string> = {};
    const types: Record<string, string> = {};
    const metas: Record<string, Record<string, unknown>> = {};
    for (const n of notes ?? []) { titles[n.id] = n.title; types[n.id] = n.entity_type || ""; metas[n.id] = (n.meta || {}) as Record<string, unknown>; }
    setTargetTitles(titles); setTargetTypes(types); setTargetMetas(metas);
  }, []);

  const loadShortlist = useCallback(async (sourceId: string) => {
    const { data } = await supabase.from("matching_shortlist").select("*").eq("source_id", sourceId);
    const map = new Map<string, ShortlistEntry>();
    for (const e of data ?? []) map.set(e.target_id, e as ShortlistEntry);
    setShortlist(map);
  }, []);

  const autoFindMatches = useCallback(async (entity: NoteRecord, tType: string) => {
    setLoading(true); setMatchError(null);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;
      if (!token) { setLoading(false); return; }
      const res = await fetch("/api/matching/score", {
        method: "POST",
        _headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source_id: entity.id, target_type: tType || undefined, limit: 50, force_refresh: false }),
      });
      const data = await res.json();
      if (res.ok && data.scores) { setScores(data.scores); await loadTargetDetails(data.scores); await loadShortlist(entity.id); }
    } catch {
    // Ignore errors
  }
    setLoading(false);
  }, [loadTargetDetails, loadShortlist]);

  // ── Load types + restore ──
  useEffect(() => {
    async function load() {
      const [typesRes, fieldsRes] = await Promise.all([
        supabase.from("entity_types").select("*").order("sort_order"),
        supabase.from("global_fields").select("*"),
      ]);
      setEntityTypes((typesRes.data ?? []) as EntityType[]);
      setGlobalFields((fieldsRes.data ?? []) as GlobalField[]);

      const saved = loadPageState();
      if (saved) {
        setSelectedType(saved.selectedType);
        setTargetType(saved.targetType);
        setMinScore(saved.minScore);
        setCandidateSearch(saved.candidateSearch);
        setSearchQuery(saved.searchQuery);
        if (saved.selectedType) {
          setLoadingEntities(true);
          const { data } = await supabase.from("vb_records").select("*")
            .eq("entity_type", saved.selectedType).eq("is_deleted", false)
            .order("last_edited_at", { ascending: false }).limit(100);
          const loaded = (data ?? []) as NoteRecord[];
          setEntities(loaded);
          setLoadingEntities(false);
          if (saved.selectedEntityId) {
            const entity = loaded.find((e) => e.id === saved.selectedEntityId);
            if (entity) {
              setSelectedEntity(entity);
              setTimeout(() => autoFindMatches(entity, saved.targetType), 100);
            }
          }
        }
      }
      setRestoredState(true);
    }
    load();
  }, [autoFindMatches]);

  useEffect(() => {
    if (!restoredState || !selectedType) { setEntities([]); return; }
    (async () => {
      setLoadingEntities(true);
      const { data } = await supabase.from("vb_records").select("*").eq("entity_type", selectedType).eq("is_deleted", false)
        .order("last_edited_at", { ascending: false }).limit(100);
      setEntities((data ?? []) as NoteRecord[]);
      setLoadingEntities(false);
    })();
  }, [selectedType, restoredState]);

  useEffect(() => {
    if (!selectedEntity) { setProfile(null); return; }
    const et = entityTypes.find((x) => x.slug === selectedEntity.entity_type);
    if (et) setProfile(extractMatchProfile(selectedEntity, et, globalFields));
  }, [selectedEntity, entityTypes, globalFields]);

  const findMatches = useCallback(async (forceRefresh = false) => {
    if (!selectedEntity) return;
    setLoading(true); setMatchError(null);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;
      if (!token) { setLoading(false); return; }
      const res = await fetch("/api/matching/score", {
        method: "POST",
        _headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source_id: selectedEntity.id, target_type: targetType || undefined, limit: 50, force_refresh: forceRefresh }),
      });
      const data = await res.json();
      if (res.ok && data.scores) { setScores(data.scores); await loadTargetDetails(data.scores); await loadShortlist(selectedEntity.id); }
      else setMatchError(data.error || "Error");
    } catch { setMatchError("Error"); }
    setLoading(false);
  }, [selectedEntity, targetType, loadTargetDetails, loadShortlist]);

  // ── Shortlist operations ──
  const addToShortlist = useCallback(async (targetId: string, status: StatusKey = "added") => {
    if (!selectedEntity) return;
    const { data } = await supabase.from("matching_shortlist").insert({ source_id: selectedEntity.id, target_id: targetId, status }).select().single();
    if (data) setShortlist((prev) => { const n = new Map(prev); n.set(targetId, data as ShortlistEntry); return n; });
  }, [selectedEntity]);

  const removeFromShortlist = useCallback(async (targetId: string) => {
    const entry = shortlist.get(targetId);
    if (!entry) return;
    await supabase.from("matching_shortlist").delete().eq("id", entry.id);
    setShortlist((prev) => { const n = new Map(prev); n.delete(targetId); return n; });
  }, [shortlist]);

  const updateStatus = useCallback(async (targetId: string, status: string) => {
    if (!selectedEntity) return;
    const existing = shortlist.get(targetId);
    if (existing) {
      if (existing.status === status) {
        // Toggle same status → remove
        await supabase.from("matching_shortlist").delete().eq("id", existing.id);
        setShortlist((prev) => { const n = new Map(prev); n.delete(targetId); return n; });
      } else {
        await supabase.from("matching_shortlist").update({ status }).eq("id", existing.id);
        setShortlist((prev) => { const n = new Map(prev); n.set(targetId, { ...existing, status }); return n; });
      }
    } else {
      const { data } = await supabase.from("matching_shortlist").insert({ source_id: selectedEntity.id, target_id: targetId, status }).select().single();
      if (data) setShortlist((prev) => { const n = new Map(prev); n.set(targetId, data as ShortlistEntry); return n; });
    }
  }, [selectedEntity, shortlist]);

  // ── Tiered score lists ──
  const { tier1, tier2, tier3, excluded, unreviewed } = useMemo(() => {
    let filtered = scores.filter((s) => s.total_score >= minScore);
    if (candidateSearch.trim()) {
      const q = candidateSearch.trim().toLowerCase();
      filtered = filtered.filter((s) => (targetTitles[s.target_id] || "").toLowerCase().includes(q));
    }
    filtered.sort((a, b) => b.total_score - a.total_score);

    const t1: MatchScoreRow[] = [];
    const t2: MatchScoreRow[] = [];
    const t3: MatchScoreRow[] = [];
    const excl: MatchScoreRow[] = [];
    const unrev: MatchScoreRow[] = [];

    for (const s of filtered) {
      const entry = shortlist.get(s.target_id);
      if (!entry) { unrev.push(s); continue; }
      const tier = STATUSES[entry.status as StatusKey]?.tier ?? 2;
      if (tier === 0) excl.push(s);
      else if (tier === 1) t1.push(s);
      else if (tier === 3) t3.push(s);
      else t2.push(s);
    }
    return { tier1: t1, tier2: t2, tier3: t3, excluded: excl, unreviewed: unrev };
  }, [scores, minScore, candidateSearch, targetTitles, shortlist]);

  const filteredEntities = entities.filter((e) =>
    searchQuery ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const handleEntitySelect = (entity: NoteRecord) => {
    setSelectedEntity(entity); setScores([]); setMatchError(null); setShortlist(new Map()); setSlideOverTargetId(null);
  };

  const navigateToEntity = (targetId: string) => {
    const et = targetTypes[targetId];
    if (et) router.push(`/dashboard/entities/${et}/${targetId}`);
  };

  const slideOverScore = slideOverTargetId ? scores.find((s) => s.target_id === slideOverTargetId) : null;

  // ── Card renderer helper ──
  const renderCard = (score: MatchScoreRow, _compact = false) => (
    <CandidateCard
      key={score.id || `${score.source_id}-${score.target_id}`}
      score={score}
      meta={targetMetas[score.target_id] || null}
      title={targetTitles[score.target_id] || score.target_id.slice(0, 8)}
      onView={() => setSlideOverTargetId(score.target_id)}
      onToggleShortlist={() => addToShortlist(score.target_id)}
      onRemoveFromList={() => removeFromShortlist(score.target_id)}
      onExclude={() => updateStatus(score.target_id, "excluded")}
      shortlistStatus={shortlist.get(score.target_id)?.status ?? null}
      t={_t}
      compact={_compact}
    />
  );

  const hasResults = scores.length > 0;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} data-cc-id="matching.page" className="flex h-[calc(100vh-48px)] bg-slate-900">

      {/* ═══ Left Panel ═══ */}
      <div className="w-80 shrink-0 border-e border-slate-700/40 flex flex-col bg-slate-900/80">
        <div className="shrink-0 px-4 py-4 border-b border-slate-700/40">
          <h1 className="text-base font-semibold text-slate-100">{t.title}</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="shrink-0 border-b border-slate-700/40 p-3 space-y-3">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1 block">{t.selectPosition}</label>
            <div className="relative">
              <select value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setSelectedEntity(null); setScores([]); }}
                className="w-full appearance-none rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:border-[var(--cc-accent-500)] focus:outline-none cursor-pointer">
                <option value="">{t.selectPosition}</option>
                {entityTypes.map((et) => <option key={et.id} value={et.slug}>{et.label[language] || et.label.en || et.slug}</option>)}
              </select>
              <ChevronDown className="absolute end-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1 block">{t.matchTo}</label>
            <div className="relative">
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:border-[var(--cc-accent-500)] focus:outline-none cursor-pointer">
                <option value="">{t.allTypes}</option>
                {entityTypes.map((et) => <option key={et.id} value={et.slug}>{et.label[language] || et.label.en || et.slug}</option>)}
              </select>
              <ChevronDown className="absolute end-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {selectedType && (
          <div className="shrink-0 border-b border-slate-700/40 p-3">
            <div className="relative">
              <Search className="absolute start-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPositions}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/60 py-1.5 ps-8 pe-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingEntities ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>
          ) : !selectedType ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Briefcase className="h-8 w-8 text-slate-700 mb-2" />
              <span className="text-xs text-slate-500">{_t.selectPosition}</span>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="flex items-center justify-center py-8"><span className="text-xs text-slate-500">{_t.noResults}</span></div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredEntities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                const meta = entity.meta || {};
                const sk = (meta.required_skills as string[]) || [];
                return (
                  <button key={entity.id} type="button" onClick={() => handleEntitySelect(entity)}
                    className={`w-full rounded-lg px-3 py-2.5 text-start transition-all cursor-pointer ${
                      isSelected ? "bg-[var(--cc-accent-600-20)] border border-[var(--cc-accent-500)]/20" : "hover:bg-slate-800/50 border border-transparent"
                    }`}>
                    <span className={`block text-sm truncate ${isSelected ? "text-[var(--cc-accent-300)] font-medium" : "text-slate-300"}`}>
                      {entity.title.replace("[דוגמה] ", "")}
                    </span>
                    {sk.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {sk.slice(0, 3).map((s) => <span key={s} className="rounded bg-slate-700/40 px-1.5 py-0.5 text-[9px] text-slate-500">{s}</span>)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedEntity && (
          <div className="shrink-0 border-_t border-slate-700/40 p-3">
            <button type="button" onClick={() => findMatches(false)} disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--cc-accent-500)] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--cc-accent-400)] disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t.findMatches}
            </button>
          </div>
        )}
      </div>

      {/* ═══ Right Panel — Tiered Results ═══ */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {selectedEntity ? (
          <>
            {/* Position bar */}
            <div className="shrink-0 border-b border-slate-700/40 px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-100">{selectedEntity.title.replace("[דוגמה] ", "")}</h2>
                  {hasResults && <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400">{scores.length} {t.candidates}</span>}
                  {shortlist.size > 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      <ListChecks className="inline h-3 w-3 me-1" />{shortlist.size}
                    </span>
                  )}
                </div>
                {hasResults && (
                  <button type="button" onClick={() => findMatches(true)} disabled={loading}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50" title={t.refresh}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
              <PositionSummary entity={selectedEntity} t={_t} isRtl={isRtl} />
            </div>

            {matchError && (
              <div className="shrink-0 flex items-center gap-2 border-b border-red-800/30 bg-red-900/10 px-5 py-2">
                <AlertCircle className="h-4 w-4 text-red-400" /><span className="text-sm text-red-400">{matchError}</span>
              </div>
            )}

            {/* Toolbar */}
            {hasResults && (
              <div className="shrink-0 border-b border-slate-700/40 px-5 py-2 flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute start-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                  <input type="text" value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder={t.searchCandidates}
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 py-1.5 ps-8 pe-8 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none" />
                  {candidateSearch && (
                    <button type="button" onClick={() => setCandidateSearch("")} className="absolute end-2 top-1.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}
                    className="rounded-lg bg-slate-800/40 border border-slate-700/50 px-2 py-1 text-[11px] text-slate-400 cursor-pointer focus:outline-none">
                    <option value={0}>{t.minMatch}: 0%</option>
                    <option value={0.3}>{t.minMatch}: 30%</option>
                    <option value={0.5}>{t.minMatch}: 50%</option>
                    <option value={0.7}>{t.minMatch}: 70%</option>
                  </select>
                </div>
                <div className="ms-auto flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500/60" />{t.semantic}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500/60" />{t.fields}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500/60" />{t.recency}</span>
                </div>
              </div>
            )}

            {/* Tiered results */}
            <div className="flex-1 overflow-y-auto p-5 space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--cc-accent-400)] mb-3" />
                  <span className="text-sm text-slate-400">{t.loading}</span>
                </div>
              ) : !hasResults ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-10 w-10 text-slate-700 mb-3" />
                  <h3 className="text-sm font-medium text-slate-400 mb-1">{!matchError ? t.findMatches : t.noResults}</h3>
                  <p className="text-xs text-slate-600 max-w-sm">{_t.noResultsDesc}</p>
                </div>
              ) : (
                <>
                  {/* ── TIER 1: Advancing ── */}
                  {tier1.length > 0 && (
                    <div className="mb-4">
                      <TierHeader icon={CheckCircle2} title={t.tierAdvancing} desc={_t.tierAdvancingDesc}
                        count={tier1.length} color="bg-emerald-600" collapsed={!!collapsedTiers.t1} onToggle={() => toggleTier("t1")} />
                      {!collapsedTiers.t1 && (
                        <>
                          <div className="h-px bg-gradient-to-e from-emerald-500/30 via-emerald-500/10 to-transparent mb-3" />
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {tier1.map((s) => renderCard(s))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── TIER 2: Pending / Potential ── */}
                  {tier2.length > 0 && (
                    <div className="mb-4">
                      <TierHeader icon={_Star} title={t.tierPending} desc={_t.tierPendingDesc}
                        count={tier2.length} color="bg-slate-600" collapsed={!!collapsedTiers.t2} onToggle={() => toggleTier("t2")} />
                      {!collapsedTiers.t2 && (
                        <>
                          <div className="h-px bg-gradient-to-e from-slate-500/30 via-slate-500/10 to-transparent mb-3" />
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {tier2.map((s) => renderCard(s))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── UNREVIEWED: Not in any list ── */}
                  {unreviewed.length > 0 && (
                    <div className="mb-4">
                      <TierHeader icon={Users} title={t.tierUnreviewed} desc={_t.tierUnreviewedDesc}
                        count={unreviewed.length} color="bg-slate-700" collapsed={!!collapsedTiers.unrev} onToggle={() => toggleTier("unrev")} />
                      {!collapsedTiers.unrev && (
                        <>
                          <div className="h-px bg-gradient-to-e from-slate-600/30 via-slate-600/10 to-transparent mb-3" />
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {unreviewed.map((s) => renderCard(s))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── TIER 3: Not advancing ── */}
                  {tier3.length > 0 && (
                    <div className="mb-4">
                      <TierHeader icon={XCircle} title={t.tierRejected} desc={_t.tierRejectedDesc}
                        count={tier3.length} color="bg-red-600/80" collapsed={!!collapsedTiers.t3} onToggle={() => toggleTier("t3")} />
                      {!collapsedTiers.t3 && (
                        <>
                          <div className="h-px bg-gradient-to-e from-red-500/20 via-red-500/5 to-transparent mb-3" />
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 opacity-70">
                            {tier3.map((s) => renderCard(s, true))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── EXCLUDED: Hidden by default ── */}
                  {excluded.length > 0 && (
                    <div className="mb-4">
                      <TierHeader icon={Ban} title={_t.status_excluded} desc={`${excluded.length}`}
                        count={excluded.length} color="bg-slate-800" collapsed={collapsedTiers.excl !== false} onToggle={() => toggleTier("excl")} />
                      {collapsedTiers.excl === false && (
                        <>
                          <div className="h-px bg-slate-700/20 mb-3" />
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 opacity-40">
                            {excluded.map((s) => renderCard(s, true))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 mb-5">
              <Users className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="text-lg font-medium text-slate-300 mb-1.5">{t.noPositionSelected}</h2>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">{_t.noPositionDesc}</p>
          </div>
        )}
      </div>

      {/* ═══ Slide-Over ═══ */}
      {slideOverTargetId && slideOverScore && (
        <CandidateSlideOver
          score={slideOverScore}
          meta={targetMetas[slideOverTargetId] || null}
          title={targetTitles[slideOverTargetId] || slideOverTargetId.slice(0, 8)}
          onClose={() => setSlideOverTargetId(null)}
          onNavigate={() => navigateToEntity(slideOverTargetId)}
          shortlistStatus={shortlist.get(slideOverTargetId)?.status ?? null}
          onStatusChange={(status) => updateStatus(slideOverTargetId, status)}
          onRemove={() => { removeFromShortlist(slideOverTargetId); setSlideOverTargetId(null); }}
          t={_t}
          isRtl={isRtl}
        />
      )}
    </div>
  );
}
