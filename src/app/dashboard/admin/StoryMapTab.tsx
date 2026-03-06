'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Circle, XCircle,
  ChevronDown, ChevronLeft, ChevronRight,
  Heart, Zap, Target, Shield, Calendar, TrendingUp,
  Map, Layers, FileEdit, Bot, Grid3X3, Settings,
  Lock,
} from 'lucide-react';
import { getTranslations } from '@/lib/i18n';
import type { StoryStatus, RiskLevel, Effort, UserJourneyStep, MLPTier } from './types';
import {
  userJourneySteps, walkingSkeleton, mvp, mlpTiers,
  riskMatrix, implementationSequence, getJourneyStats,
} from './storyMapData';

// ─── Config ─────────────────────────────────────────────

const STATUS_CONFIG: Record<StoryStatus, { color: string; bg: string; icon: React.ElementType; en: string; he: string }> = {
  done:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, en: 'Done', he: 'הושלם' },
  broken:   { color: 'text-red-400',     bg: 'bg-red-500/10',     icon: XCircle,      en: 'Broken', he: 'שבור' },
  missing:  { color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: AlertCircle,  en: 'Missing', he: 'חסר' },
  untested: { color: 'text-sky-400',     bg: 'bg-sky-500/10',     icon: AlertTriangle, en: 'Untested', he: 'לא נבדק' },
};

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; en: string; he: string }> = {
  low:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', en: 'Low', he: 'נמוך' },
  medium:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   en: 'Medium', he: 'בינוני' },
  high:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  en: 'High', he: 'גבוה' },
  critical: { color: 'text-red-400',     bg: 'bg-red-500/10',     en: 'Critical', he: 'קריטי' },
};

const EFFORT_CONFIG: Record<Effort, { color: string; bg: string }> = {
  S: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  M: { color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  L: { color: 'text-red-400',     bg: 'bg-red-500/10' },
};

const STEP_ICONS: Record<string, React.ElementType> = {
  authenticate: Lock,
  navigate: Map,
  monitor: Layers,
  'create-edit': FileEdit,
  'plan-map': Target,
  'ai-assist': Bot,
  'understand-org': Grid3X3,
  customize: Settings,
};

// ─── Sub-components ─────────────────────────────────────

function Collapsible({ title, defaultOpen, count, children, isHe }: {
  title: React.ReactNode; defaultOpen?: boolean; count?: number; children: React.ReactNode; isHe: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Arrow = open ? ChevronDown : (isHe ? ChevronLeft : ChevronRight);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
        <Arrow size={14} />
        {title}
        {count !== undefined && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{count}</span>}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

function StatusBadge({ status, isHe }: { status: StoryStatus; isHe: boolean }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon size={10} />
      {isHe ? cfg.he : cfg.en}
    </span>
  );
}

function RiskBadge({ level, isHe }: { level: RiskLevel; isHe: boolean }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
      {isHe ? cfg.he : cfg.en}
    </span>
  );
}

function EffortBadge({ effort }: { effort: Effort }) {
  const cfg = EFFORT_CONFIG[effort];
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
      {effort}
    </span>
  );
}

function ProgressBar({ done, total, height = 'h-2' }: { done: number; total: number; height?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`${height} w-full overflow-hidden rounded-full bg-white/5`}>
      <div className={`${height} rounded-full transition-all`}
        style={{ width: `${pct}%`, background: pct === 100 ? '#34d399' : pct >= 70 ? '#60a5fa' : pct >= 40 ? '#fbbf24' : '#ef4444' }} />
    </div>
  );
}

// ─── Journey Step Card ──────────────────────────────────

function JourneyStepCard({ step, isHe }: { step: UserJourneyStep; isHe: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STEP_ICONS[step.id] || Circle;
  const doneCount = step.stories.filter(s => s.status === 'done').length;
  const totalCount = step.stories.length;
  const pct = Math.round((doneCount / totalCount) * 100);
  const hasCritical = step.stories.some(s => s.risk === 'critical');
  const hasBroken = step.stories.some(s => s.status === 'broken');

  return (
    <div className={`rounded-xl border ${hasCritical || hasBroken ? 'border-red-500/20' : 'border-white/[0.06]'} bg-white/[0.02] overflow-hidden`}>
      {/* Header */}
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
          <Icon size={16} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{step.step}</span>
            <span className="text-sm font-medium text-slate-200 truncate">{isHe ? step.nameHe : step.name}</span>
            {hasCritical && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase">CRITICAL</span>}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div className="w-24">
              <ProgressBar done={doneCount} total={totalCount} height="h-1.5" />
            </div>
            <span className="text-[10px] text-slate-500">{doneCount}/{totalCount} ({pct}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {step.primaryPages.slice(0, 2).map(p => (
            <code key={p} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-600" dir="ltr">{p}</code>
          ))}
          {expanded ? <ChevronDown size={14} className="text-slate-500" /> :
            (isHe ? <ChevronLeft size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />)}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/[0.04] px-4 py-3 space-y-3">
          {/* Emotion / Friction / Aha */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-lg bg-pink-500/5 border border-pink-500/10 px-2.5 py-2">
              <div className="flex items-center gap-1 text-pink-400 mb-1"><Heart size={10} /> {isHe ? 'רגש' : 'Emotion'}</div>
              <div className="text-slate-400">{isHe ? step.emotionHe : step.emotion}</div>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-2.5 py-2">
              <div className="flex items-center gap-1 text-amber-400 mb-1"><Zap size={10} /> {isHe ? 'חיכוך' : 'Friction'}</div>
              <div className="text-slate-400">{isHe ? step.frictionHe : step.friction}</div>
            </div>
            <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 px-2.5 py-2">
              <div className="flex items-center gap-1 text-purple-400 mb-1"><TrendingUp size={10} /> {isHe ? 'רגע אהא' : 'Aha!'}</div>
              <div className="text-slate-400">{step.ahamoment ? (isHe ? step.ahamomentHe : step.ahamoment) : '—'}</div>
            </div>
          </div>

          {/* Stories Table */}
          <div className="rounded-lg border border-white/[0.04] overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-white/[0.02] text-slate-500">
                  <th className={`px-3 py-1.5 font-medium ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'סיפור' : 'Story'}</th>
                  <th className="px-2 py-1.5 font-medium text-center w-20">{isHe ? 'סטטוס' : 'Status'}</th>
                  <th className="px-2 py-1.5 font-medium text-center w-16">{isHe ? 'סיכון' : 'Risk'}</th>
                  <th className={`px-2 py-1.5 font-medium ${isHe ? 'text-right' : 'text-left'} w-48`}>{isHe ? 'קובץ' : 'File'}</th>
                </tr>
              </thead>
              <tbody>
                {step.stories.map((story, i) => (
                  <tr key={i} className={`border-t border-white/[0.03] ${story.status === 'broken' || story.risk === 'critical' ? 'bg-red-500/[0.03]' : ''}`}>
                    <td className="px-3 py-1.5">
                      <span className="text-slate-300">{isHe ? story.nameHe : story.name}</span>
                      {story.note && (
                        <span className="ml-2 text-[10px] text-slate-600">({isHe ? story.noteHe : story.note})</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center"><StatusBadge status={story.status} isHe={isHe} /></td>
                    <td className="px-2 py-1.5 text-center"><RiskBadge level={story.risk} isHe={isHe} /></td>
                    <td className="px-2 py-1.5">
                      {story.keyFile && <code className="rounded bg-white/5 px-1 py-0.5 text-[9px] text-slate-600" dir="ltr">{story.keyFile}</code>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unhappy Paths + KPIs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                <AlertTriangle size={10} /> {isHe ? 'נתיבים לא שמחים' : 'Unhappy Paths'}
              </div>
              <ul className="space-y-0.5">
                {(isHe ? step.unhappyPathsHe : step.unhappyPaths).map((p, i) => (
                  <li key={i} className="text-[10px] text-slate-500">• {p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                <Target size={10} /> KPIs
              </div>
              <ul className="space-y-0.5">
                {(isHe ? step.kpisHe : step.kpis).map((k, i) => (
                  <li key={i} className="text-[10px] text-slate-500">• {k}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Release Tier Section ───────────────────────────────

function ReleaseTierSection({ tier, isHe, accent }: {
  tier: typeof walkingSkeleton; isHe: boolean; accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: accent }} />
          <h4 className="text-sm font-semibold text-slate-200">{isHe ? tier.nameHe : tier.name}</h4>
        </div>
        <span className="text-[10px] text-slate-500">{tier.tasks.length} {isHe ? 'משימות' : 'tasks'}</span>
      </div>
      <p className="text-xs text-slate-400 mb-3">{isHe ? tier.goalHe : tier.goal}</p>

      <div className="rounded-lg border border-white/[0.04] overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-white/[0.02] text-slate-500">
              <th className={`px-3 py-1.5 font-medium ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'משימה' : 'Task'}</th>
              <th className="px-2 py-1.5 font-medium text-center w-20">{isHe ? 'מצב' : 'Status'}</th>
              <th className="px-2 py-1.5 font-medium text-center w-16">{isHe ? 'מאמץ' : 'Effort'}</th>
              <th className="px-2 py-1.5 font-medium text-center w-16">{isHe ? 'סיכון' : 'Risk'}</th>
            </tr>
          </thead>
          <tbody>
            {tier.tasks.map((task, i) => (
              <tr key={i} className="border-t border-white/[0.03]">
                <td className="px-3 py-1.5 text-slate-300">{isHe ? task.nameHe : task.name}</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    task.status === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                    task.status === 'Missing' || task.status === 'Broken' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {isHe ? task.statusHe : task.status}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center text-slate-500">{task.effort}</td>
                <td className="px-2 py-1.5 text-center"><RiskBadge level={task.risk} isHe={isHe} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tier.kpis.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(isHe ? tier.kpisHe : tier.kpis).map((kpi, i) => (
            <span key={i} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">{kpi}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MLP Tier Card ──────────────────────────────────────

function MLPTierCard({ tier, isHe }: { tier: MLPTier; isHe: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <h4 className="text-sm font-semibold text-slate-200 mb-3">{isHe ? tier.nameHe : tier.name}</h4>
      <div className="space-y-1.5">
        {tier.features.map((feat, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.01] px-3 py-2 text-[11px]">
            <span className="flex-1 text-slate-300">{isHe ? feat.nameHe : feat.name}</span>
            <span className="text-slate-600 max-w-[140px] truncate" title={isHe ? feat.whyHe : feat.why}>
              {isHe ? feat.whyHe : feat.why}
            </span>
            <EffortBadge effort={feat.effort} />
            <RiskBadge level={feat.risk} isHe={isHe} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk Matrix ────────────────────────────────────────

function RiskMatrixSection({ isHe }: { isHe: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-red-400" />
        <h4 className="text-sm font-semibold text-slate-200">{isHe ? 'מטריצת סיכונים' : 'Risk Matrix'}</h4>
      </div>
      <div className="rounded-lg border border-white/[0.04] overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-white/[0.02] text-slate-500">
              <th className={`px-3 py-1.5 font-medium ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'סיכון' : 'Risk'}</th>
              <th className="px-2 py-1.5 font-medium text-center w-20">{isHe ? 'סוג' : 'Type'}</th>
              <th className="px-2 py-1.5 font-medium text-center w-16">{isHe ? 'רמה' : 'Level'}</th>
              <th className={`px-2 py-1.5 font-medium ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'מיטיגציה' : 'Mitigation'}</th>
            </tr>
          </thead>
          <tbody>
            {riskMatrix.map((r, i) => (
              <tr key={i} className={`border-t border-white/[0.03] ${r.level === 'critical' ? 'bg-red-500/[0.03]' : ''}`}>
                <td className="px-3 py-1.5 text-slate-300">{isHe ? r.riskHe : r.risk}</td>
                <td className="px-2 py-1.5 text-center">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">{isHe ? r.typeHe : r.type}</span>
                </td>
                <td className="px-2 py-1.5 text-center"><RiskBadge level={r.level} isHe={isHe} /></td>
                <td className="px-2 py-1.5 text-slate-500">{isHe ? r.mitigationHe : r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Implementation Timeline ────────────────────────────

function TimelineSection({ isHe }: { isHe: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-blue-400" />
        <h4 className="text-sm font-semibold text-slate-200">{isHe ? 'רצף יישום' : 'Implementation Sequence'}</h4>
      </div>
      <div className="space-y-3">
        {implementationSequence.map((week, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-purple-400" />
              {i < implementationSequence.length - 1 && <div className="w-px flex-1 bg-white/[0.06]" />}
            </div>
            <div className="pb-3">
              <div className="text-xs font-medium text-slate-200">{isHe ? week.weekHe : week.week}</div>
              <ul className="mt-1 space-y-0.5">
                {(isHe ? week.tasksHe : week.tasks).map((t, j) => (
                  <li key={j} className="text-[11px] text-slate-500">• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────

export default function StoryMapTab({ isHe, ta }: {
  isHe: boolean;
  ta: ReturnType<typeof getTranslations>['admin'];
}) {
  const stats = useMemo(() => getJourneyStats(), []);
  const [viewMode, setViewMode] = useState<'journey' | 'releases' | 'risks'>('journey');

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalStories}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{isHe ? 'סיפורים' : 'Stories'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.doneStories}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{isHe ? 'הושלמו' : 'Done'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.missingStories}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{isHe ? 'חסרים' : 'Missing'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.brokenStories}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{isHe ? 'שבורים' : 'Broken'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.criticalRisks}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{isHe ? 'סיכונים קריטיים' : 'Critical Risks'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
          <div className={`text-2xl font-bold ${stats.completionPct >= 80 ? 'text-emerald-400' : stats.completionPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {stats.completionPct}%
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">{isHe ? 'השלמה' : 'Complete'}</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-px">
        {(['journey', 'releases', 'risks'] as const).map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`rounded-t-lg px-4 py-2 text-xs font-medium transition-colors ${
              viewMode === mode ? 'bg-white/5 text-white border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {mode === 'journey' ? (isHe ? 'מסע משתמש' : 'User Journey') :
             mode === 'releases' ? (isHe ? 'שכבות שחרור' : 'Release Tiers') :
             (isHe ? 'סיכונים + ציר זמן' : 'Risks + Timeline')}
          </button>
        ))}
      </div>

      {/* Journey View */}
      {viewMode === 'journey' && (
        <div className="space-y-2">
          {userJourneySteps.map(step => (
            <JourneyStepCard key={step.id} step={step} isHe={isHe} />
          ))}
        </div>
      )}

      {/* Releases View */}
      {viewMode === 'releases' && (
        <div className="space-y-4">
          <ReleaseTierSection tier={walkingSkeleton} isHe={isHe} accent="#ef4444" />
          <ReleaseTierSection tier={mvp} isHe={isHe} accent="#f59e0b" />

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">MLP — {isHe ? 'המוצר שאוהבים' : 'The Product Users Love'}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {isHe ? 'KPIs: שימוש יומי >80%, יצירת מסמך <2 דקות, סשני AI >10/שבוע/משתמש, שביעות רצון >4/5'
                     : 'KPIs: Daily active usage >80%, Document creation <2min, AI sessions >10/week/user, Satisfaction >4/5'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mlpTiers.map(tier => (
                <MLPTierCard key={tier.id} tier={tier} isHe={isHe} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risks + Timeline View */}
      {viewMode === 'risks' && (
        <div className="space-y-4">
          <RiskMatrixSection isHe={isHe} />
          <TimelineSection isHe={isHe} />

          {/* Verification Checklist */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">{isHe ? 'אימות לכל שכבה' : 'Verification Per Tier'}</h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">WS</span>
                <span className="text-slate-400">{isHe ? 'כניסה → דשבורד מרונדר → פרויקטים נראים' : 'Login → dashboard renders → projects visible'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">MVP</span>
                <span className="text-slate-400">{isHe ? 'כל 12 הדפים עובדים, CRUD בכל הטבלאות, AI streaming, realtime מסתנכרן' : 'All 12 pages work, CRUD on all tables, AI streams, realtime syncs'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">MLP</span>
                <span className="text-slate-400">{isHe ? 'מסע משתמש מלא ללא נתוני הדגמה, כל האינטגרציות חיות, סקר שביעות רצון >4/5' : 'Full user journey without demo data, all integrations live, satisfaction survey >4/5'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
