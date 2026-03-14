'use client';

import {
  ArrowUpDown, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { getTranslations } from '@/lib/i18n';

type Phase = 1 | 2 | 3 | 4 | 5;
type FeatureStatus = 'working' | 'not-verified' | 'broken';
type WorkflowStatus = 'inbox' | 'wishlist' | 'todo' | 'next' | 'inProgress' | 'hold' | 'stuck' | 'freeze' | 'complete' | 'cancelled';
type SortField = 'date' | 'name' | 'phase' | 'workflow' | 'fileCount';
type GroupField = 'none' | 'workflow' | 'phase' | 'date' | 'fileDir';

const WORKFLOW_ORDER: WorkflowStatus[] = ['inbox', 'wishlist', 'todo', 'next', 'inProgress', 'hold', 'stuck', 'freeze', 'complete', 'cancelled'];

const WORKFLOW_COLORS: Record<WorkflowStatus, { color: string; bg: string }> = {
  inbox:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  wishlist:   { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  todo:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  next:       { color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
  inProgress: { color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  hold:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  stuck:      { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  freeze:     { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  complete:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  cancelled:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

function getWfLabels(ta: ReturnType<typeof getTranslations>['admin']): Record<WorkflowStatus, string> {
  return {
    inbox: ta.wfLabelInbox, wishlist: ta.wfLabelWishlist, todo: ta.wfLabelTodo, next: ta.wfLabelNext,
    inProgress: ta.wfLabelInProgress, hold: ta.wfLabelHold, stuck: ta.wfLabelStuck, freeze: ta.wfLabelFreeze,
    complete: ta.wfLabelComplete, cancelled: ta.wfLabelCancelled,
  };
}

interface ChangelogToolbarProps {
  sortBy: SortField;
  sortDir: 'asc' | 'desc';
  groupBy: GroupField;
  clFilterWorkflow: WorkflowStatus[];
  clFilterPhase: Phase | 'all';
  clFilterTechStatus: FeatureStatus | 'all';
  onSortChange: (field: SortField) => void;
  onSortDirToggle: () => void;
  onGroupChange: (field: GroupField) => void;
  onWorkflowToggle: (status: WorkflowStatus) => void;
  onPhaseChange: (phase: Phase | 'all') => void;
  onTechStatusChange: (status: FeatureStatus | 'all') => void;
  isRtl: boolean;
  ta: ReturnType<typeof getTranslations>['admin'];
}

export default function ChangelogToolbar({
  sortBy, sortDir, groupBy,
  clFilterWorkflow, clFilterPhase, clFilterTechStatus,
  onSortChange, onSortDirToggle, onGroupChange,
  onWorkflowToggle, onPhaseChange, onTechStatusChange,
  isRtl, ta,
}: ChangelogToolbarProps) {
  const dir = isRtl ? 'rtl' : 'ltr';
  const wfLabels = getWfLabels(ta);

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'date', label: ta.sortDate },
    { field: 'name', label: ta.sortName },
    { field: 'phase', label: ta.sortPhase },
    { field: 'workflow', label: ta.sortWorkflow },
    { field: 'fileCount', label: ta.sortFileCount },
  ];

  const groupOptions: { field: GroupField; label: string }[] = [
    { field: 'none', label: ta.groupNone },
    { field: 'workflow', label: ta.groupWorkflow },
    { field: 'phase', label: ta.groupPhase },
    { field: 'date', label: ta.groupDate },
    { field: 'fileDir', label: ta.groupFileDir },
  ];

  const SortIcon = sortDir === 'asc' ? ChevronUp : ChevronDown;

  return (
    <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3" dir={dir}>
      {/* Row 1: Sort + Group */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={12} className="text-slate-600" />
          <span className="text-[11px] text-slate-600">{ta.sortBy}:</span>
          {sortOptions.map(opt => (
            <button
              key={opt.field}
              onClick={() => opt.field === sortBy ? onSortDirToggle() : onSortChange(opt.field)}
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                sortBy === opt.field
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
              {sortBy === opt.field && <SortIcon size={10} />}
            </button>
          ))}

          <span className="mx-1 h-4 w-px bg-white/10" />

          {/* Group */}
          <span className="text-[11px] text-slate-600">{ta.groupBy}:</span>
          {groupOptions.map(opt => (
            <button
              key={opt.field}
              onClick={() => onGroupChange(opt.field)}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                groupBy === opt.field
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Workflow chips + Phase + Tech status */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Workflow filter chips */}
        <span className="text-[11px] text-slate-600">{ta.filterWorkflow}:</span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {WORKFLOW_ORDER.map(ws => {
            const active = clFilterWorkflow.includes(ws);
            const wc = WORKFLOW_COLORS[ws];
            return (
              <button
                key={ws}
                onClick={() => onWorkflowToggle(ws)}
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all"
                style={{
                  color: active ? wc.color : '#64748b',
                  background: active ? wc.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? wc.color + '40' : 'transparent'}`,
                }}
              >
                {wfLabels[ws]}
              </button>
            );
          })}
        </div>

        <span className="h-4 w-px bg-white/10" />

        {/* Phase filter */}
        <span className="text-[11px] text-slate-600">{ta.filterPhase}:</span>
        {(['all', 1, 2, 3, 4, 5] as const).map(p => (
          <button
            key={p}
            onClick={() => onPhaseChange(p)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              clFilterPhase === p ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {p === 'all' ? ta.filterAll : `P${p}`}
          </button>
        ))}

        <span className="h-4 w-px bg-white/10" />

        {/* Tech status filter */}
        <span className="text-[11px] text-slate-600">{ta.filterTechStatus}:</span>
        {(['all', 'working', 'not-verified', 'broken'] as const).map(s => {
          const labels: Record<string, string> = { all: ta.filterAll, working: ta.working, 'not-verified': ta.notVerified, broken: ta.broken };
          return (
            <button
              key={s}
              onClick={() => onTechStatusChange(s)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                clFilterTechStatus === s ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
