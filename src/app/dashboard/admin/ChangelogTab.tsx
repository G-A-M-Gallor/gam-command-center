'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2, AlertCircle, Circle, Search, X, Hash, Network, FileCode,
  GitCommit, Rocket, RefreshCw, Loader2, ClipboardCheck, ExternalLink,
  ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getTranslations, loc } from '@/lib/i18n';
import type { Language } from '@/contexts/SettingsContext';
import { Button, Input, Badge } from '@/components/ui';
import ChangelogToolbar from './ChangelogToolbar';
import type {
  Phase, FeatureStatus, WorkflowStatus, SortField, GroupField,
  ChangelogEntry, DevChecklistKey, GitStatusData,
} from './types';
import {
  WORKFLOW_CONFIG, changelogEntries, dataCcIds,
  DEV_CHECKLIST_KEYS, CHANGELOG_CHECKLISTS,
  getChecklistScore, getOverallChecklistScoreFromEntries,
  routes, standalonePages,
} from './data';

// ─── Sub-components ──────────────────────────────────────

function CollapsibleRow({ title, defaultOpen = false, count, children, isRtl }: {
  title: React.ReactNode; defaultOpen?: boolean; count?: number; children: React.ReactNode; isRtl: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Arrow = open ? ChevronDown : (isRtl ? ChevronLeft : ChevronRight);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
        <Arrow size={14} />
        {title}
        {count !== undefined && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{count}</span>}
      </button>
      {open && <div className={isRtl ? 'pl-5 pb-2' : 'pr-5 pb-2'}>{children}</div>}
    </div>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  const colors: Record<Phase, string> = { 1: '#34d399', 2: '#60a5fa', 3: '#c084fc', 4: '#f472b6', 5: '#94a3b8' };
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ color: colors[phase], background: `${colors[phase]}15` }}>
      P{phase}
    </span>
  );
}

function ChecklistDots({ entryId, ta }: { entryId: string; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const [expanded, setExpanded] = useState(false);
  const checklist = CHANGELOG_CHECKLISTS[entryId];
  const score = getChecklistScore(checklist);

  const clLabels: Record<DevChecklistKey, string> = {
    guideContent: ta.clGuideContent,
    usageDoc: ta.clUsageDoc,
    diagram: ta.clDiagram,
    aiSourceOfTruth: ta.clAiSourceOfTruth,
    conflictReview: ta.clConflictReview,
  };

  if (!checklist) {
    return <span className="text-[10px] text-slate-600">{ta.noChecklist}</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-white/5"
      >
        <span className="flex items-center gap-0.5">
          {checklist.items.map(item => (
            <span
              key={item.key}
              className={`inline-block h-2 w-2 rounded-full ${item.done ? 'bg-emerald-400' : 'bg-slate-700'}`}
            />
          ))}
        </span>
        <span className={`font-medium ${score.pct === 100 ? 'text-emerald-400' : score.pct >= 60 ? 'text-slate-400' : 'text-amber-400'}`}>
          {score.done}/{score.total}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
          {checklist.items.map(item => {
            const cfg = DEV_CHECKLIST_KEYS.find(c => c.key === item.key)!;
            const Icon = cfg.icon;
            return (
              <div key={item.key} className="flex items-center gap-2 text-[11px]">
                <Icon size={12} className={item.done ? 'text-emerald-400' : 'text-slate-600'} />
                <span className={item.done ? 'text-slate-300' : 'text-slate-600'}>
                  {clLabels[item.key]}
                </span>
                {item.done ? (
                  <CheckCircle2 size={10} className="text-emerald-400" />
                ) : (
                  <Circle size={10} className="text-slate-700" />
                )}
              </div>
            );
          })}
          {checklist.reviewedBy && (
            <div className="mt-1.5 border-t border-white/[0.04] pt-1.5 text-[10px] text-slate-600">
              {ta.reviewedBy} {checklist.reviewedBy} · {checklist.reviewedDate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistSummary({ isRtl, ta }: { isRtl: boolean; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const [open, setOpen] = useState(false);
  const overall = getOverallChecklistScoreFromEntries(changelogEntries);

  const clLabels: Record<DevChecklistKey, string> = {
    guideContent: ta.clGuideContent,
    usageDoc: ta.clUsageDoc,
    diagram: ta.clDiagram,
    aiSourceOfTruth: ta.clAiSourceOfTruth,
    conflictReview: ta.clConflictReview,
  };

  const perItem = DEV_CHECKLIST_KEYS.map(cfg => {
    const done = changelogEntries.filter(e => {
      const cl = CHANGELOG_CHECKLISTS[e.id];
      return cl?.items.find(i => i.key === cfg.key)?.done;
    }).length;
    return { ...cfg, done, total: changelogEntries.length, label: clLabels[cfg.key] };
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ClipboardCheck size={16} className="text-purple-400" />
          <span className="text-sm font-medium text-slate-200">{ta.devChecklistTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${overall.pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {overall.pct}%
          </span>
          {open ? <ChevronDown size={14} className="text-slate-500" /> : (isRtl ? <ChevronLeft size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />)}
        </div>
      </button>
      {open && (
        <div className="mt-4 space-y-2.5">
          {perItem.map(item => {
            const Icon = item.icon;
            const pct = Math.round((item.done / item.total) * 100);
            return (
              <div key={item.key} className="flex items-center gap-3">
                <Icon size={14} className="shrink-0 text-slate-500" />
                <span className="w-32 shrink-0 text-xs text-slate-400">{item.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: pct === 100 ? '#34d399' : pct >= 70 ? '#60a5fa' : '#fbbf24' }}
                  />
                </div>
                <span className="w-16 shrink-0 text-[11px] text-slate-500" dir="ltr" style={{ textAlign: isRtl ? 'left' : 'right' }}>
                  {item.done}/{item.total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChangelogCard({ entry, language, ta }: { entry: ChangelogEntry; isRtl?: boolean; language: Language; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const statusColors: Record<FeatureStatus, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    working: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: ta.working, icon: CheckCircle2 },
    'not-verified': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: ta.notVerified, icon: AlertCircle },
    broken: { bg: 'bg-red-500/10', text: 'text-red-400', label: ta.broken, icon: Circle },
  };
  const sc = statusColors[entry.status];
  const StatusIcon = sc.icon;
  const commitLabel = entry.commitStatus === 'committed' ? ta.committed : ta.uncommitted;
  const commitColor = entry.commitStatus === 'committed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10';
  const wf = WORKFLOW_CONFIG[entry.workflowStatus];
  const WfIcon = wf.icon;
  const wfLabelMap: Record<string, string> = {
    inbox: ta.wfLabelInbox, wishlist: ta.wfLabelWishlist, todo: ta.wfLabelTodo,
    next: ta.wfLabelNext, inProgress: ta.wfLabelInProgress, hold: ta.wfLabelHold,
    stuck: ta.wfLabelStuck, freeze: ta.wfLabelFreeze, complete: ta.wfLabelComplete,
    cancelled: ta.wfLabelCancelled,
  };

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-200">{loc(entry, 'feature', language)}</span>
          {entry.phase && <PhaseBadge phase={entry.phase} />}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${wf.bg} ${wf.text}`}>
            <WfIcon size={10} />
            {wfLabelMap[entry.workflowStatus] || wf.enLabel}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.text}`}>
            <StatusIcon size={10} />
            {sc.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${commitColor}`}>
            <GitCommit size={10} />
            {commitLabel}
          </span>
          <span className="text-[10px] text-slate-600">{entry.date}</span>
        </div>
        {entry.route && (
          <a href={entry.route} className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200" dir="ltr">
            <ExternalLink size={10} />
            {entry.route}
          </a>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">{loc(entry, 'notes', language)}</p>
      <div className="mt-2 rounded-lg bg-purple-500/5 border border-purple-500/10 px-3 py-2">
        <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">{ta.whyBuilt}</span>
        <p className="mt-1 text-xs text-slate-400">{loc(entry, 'purpose', language)}</p>
      </div>
      {entry.connectedTo && entry.connectedTo.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-slate-600">{ta.connectedToLabel}</span>
          {entry.connectedTo.map(c => (
            <span key={c} className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">{c}</span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {entry.commitHash && (
          <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400" dir="ltr">
            {entry.commitHash}
          </code>
        )}
        {entry.files.slice(0, 4).map(f => (
          <code key={f} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-600" dir="ltr">{f}</code>
        ))}
        {entry.files.length > 4 && (
          <span className="text-[10px] text-slate-600">+{entry.files.length - 4} {ta.moreFiles}</span>
        )}
      </div>
      <div className="mt-2 border-t border-white/[0.04] pt-2">
        <ChecklistDots entryId={entry.id} ta={ta} />
      </div>
    </div>
  );
}

// ─── Mermaid Diagram ─────────────────────────────────────

function generateMermaidDiagram(entries: ChangelogEntry[], routeData: typeof routes): string {
  const lines: string[] = ['graph TD'];
  const phaseNames: Record<number, string> = {
    0: 'Foundation', 1: 'Phase 1 — Foundation', 2: 'Phase 2 — Editor',
    3: 'Phase 3 — Story Map', 4: 'Phase 4 — AI Hub', 5: 'Phase 5 — Extras',
  };
  const byPhase: Record<number, ChangelogEntry[]> = {};
  entries.forEach(e => {
    const p = e.phase || 0;
    if (!byPhase[p]) byPhase[p] = [];
    byPhase[p].push(e);
  });
  const statusStyle: Record<FeatureStatus, string> = {
    working: ':::working', 'not-verified': ':::notverified', broken: ':::broken',
  };
  const nodeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');
  const sortedPhases = Object.keys(byPhase).map(Number).sort((a, b) => a - b);
  for (const phase of sortedPhases) {
    const phaseEntries = byPhase[phase];
    const label = phaseNames[phase] || `Phase ${phase}`;
    lines.push(`  subgraph ${nodeId(`phase_${phase}`)}["${label}"]`);
    for (const entry of phaseEntries) {
      const nid = nodeId(entry.id);
      const displayName = entry.feature.length > 40 ? entry.feature.substring(0, 37) + '...' : entry.feature;
      const escapedName = displayName.replace(/"/g, "'");
      if (entry.route) {
        lines.push(`    ${nid}["${escapedName}"]${statusStyle[entry.status]}`);
      } else {
        lines.push(`    ${nid}("${escapedName}")${statusStyle[entry.status]}`);
      }
    }
    lines.push('  end');
  }
  const changelogRouteIds = new Set(entries.map(e => e.id));
  const routesNotInChangelog = routeData.filter(r => !changelogRouteIds.has(r.id));
  if (routesNotInChangelog.length > 0) {
    lines.push(`  subgraph routes_extra["Routes"]`);
    for (const r of routesNotInChangelog) {
      lines.push(`    ${nodeId(r.id)}["${r.name}"]${r.status === 'active' ? ':::working' : ':::notverified'}`);
    }
    lines.push('  end');
  }
  const allIds = new Set([...entries.map(e => e.id), ...routeData.map(r => r.id)]);
  const fileToEntry: Record<string, string> = {};
  entries.forEach(e => {
    e.files.forEach(f => {
      const basename = f.split('/').pop()?.toLowerCase() || '';
      fileToEntry[basename] = e.id;
    });
  });
  for (const entry of entries) {
    if (!entry.connectedTo) continue;
    for (const conn of entry.connectedTo) {
      const connLower = conn.toLowerCase();
      let targetId: string | undefined;
      for (const id of allIds) {
        if (id === connLower || connLower.includes(id)) { targetId = id; break; }
      }
      if (!targetId) {
        const connFile = conn.split('(')[0].trim().toLowerCase();
        for (const fname of Object.keys(fileToEntry)) {
          if (connFile.includes(fname) || fname.includes(connFile)) {
            if (fileToEntry[fname] !== entry.id) { targetId = fileToEntry[fname]; break; }
          }
        }
      }
      if (targetId && targetId !== entry.id) {
        lines.push(`  ${nodeId(entry.id)} -.-> ${nodeId(targetId)}`);
      }
    }
  }
  lines.push('  classDef working fill:#065f46,stroke:#34d399,color:#d1fae5');
  lines.push('  classDef notverified fill:#78350f,stroke:#fbbf24,color:#fef3c7');
  lines.push('  classDef broken fill:#7f1d1d,stroke:#ef4444,color:#fecaca');
  return lines.join('\n');
}

function MermaidDiagram({ definition, ta }: { definition: string; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false, theme: 'dark',
          themeVariables: {
            primaryColor: '#1e293b', primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#475569', lineColor: '#64748b',
            secondaryColor: '#0f172a', tertiaryColor: '#1e1b4b', fontSize: '12px',
          },
          flowchart: { curve: 'basis', padding: 12 },
          securityLevel: 'strict',
        });
        if (cancelled || !containerRef.current) return;
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, definition);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setRendered(true);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [definition]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-xs text-red-400">Diagram error: {error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-[10px] text-slate-600">Source</summary>
          <pre className="mt-1 max-h-40 overflow-auto text-[10px] text-slate-600">{definition}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="relative">
      {!rendered && (
        <div className="flex items-center justify-center py-12 text-sm text-slate-600">{ta.diagramLoading}</div>
      )}
      <div ref={containerRef} className="overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full" />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────

export default function ChangelogTab({ isRtl, language, ta }: { isRtl: boolean; language: Language; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const [changelogSearch, setChangelogSearch] = useState('');
  const [clSortBy, setClSortBy] = useState<SortField>('date');
  const [clSortDir, setClSortDir] = useState<'asc' | 'desc'>('desc');
  const [clGroupBy, setClGroupBy] = useState<GroupField>('none');
  const [clFilterWorkflow, setClFilterWorkflow] = useState<WorkflowStatus[]>([]);
  const [clFilterPhase, setClFilterPhase] = useState<Phase | 'all'>('all');
  const [clFilterTechStatus, setClFilterTechStatus] = useState<FeatureStatus | 'all'>('all');

  // Live git state
  const [gitData, setGitData] = useState<GitStatusData | null>(null);
  const [gitLoading, setGitLoading] = useState(true);
  const [gitError, setGitError] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchGitStatus = useCallback(async () => {
    try {
      setGitLoading(true);
      setGitError('');
      const res = await fetch('/api/git/status');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGitData(data);
    } catch {
      setGitError(ta.gitError);
    } finally {
      setGitLoading(false);
    }
  }, [ta.gitError]);

  useEffect(() => { fetchGitStatus(); }, [fetchGitStatus]);

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    setCommitLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({ type: 'success', message: `${ta.commitSuccess} — ${data.hash}` });
        setCommitMsg('');
        fetchGitStatus();
      } else {
        setActionFeedback({ type: 'error', message: data.error || ta.commitError });
      }
    } catch {
      setActionFeedback({ type: 'error', message: ta.commitError });
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!confirm(ta.confirmDeploy)) return;
    setDeployLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/git/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({ type: 'success', message: `${ta.deploySuccess} — ${data.commitHash}` });
        setCommitMsg('');
        fetchGitStatus();
      } else {
        setActionFeedback({ type: 'error', message: data.error || ta.deployError });
      }
    } catch {
      setActionFeedback({ type: 'error', message: ta.deployError });
    } finally {
      setDeployLoading(false);
    }
  };

  const allRoutes = [...routes, ...standalonePages];

  const filteredSortedEntries = useMemo(() => {
    let entries = changelogEntries.filter(entry => {
      if (clFilterWorkflow.length > 0 && !clFilterWorkflow.includes(entry.workflowStatus)) return false;
      if (clFilterPhase !== 'all' && entry.phase !== clFilterPhase) return false;
      if (clFilterTechStatus !== 'all' && entry.status !== clFilterTechStatus) return false;
      return true;
    });
    entries = [...entries].sort((a, b) => {
      let cmp = 0;
      switch (clSortBy) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'name': cmp = a.feature.localeCompare(b.feature); break;
        case 'phase': cmp = (a.phase || 0) - (b.phase || 0); break;
        case 'workflow': cmp = WORKFLOW_CONFIG[a.workflowStatus].order - WORKFLOW_CONFIG[b.workflowStatus].order; break;
        case 'fileCount': cmp = a.files.length - b.files.length; break;
      }
      return clSortDir === 'desc' ? -cmp : cmp;
    });
    return entries;
  }, [clFilterWorkflow, clFilterPhase, clFilterTechStatus, clSortBy, clSortDir]);

  const { directMatches, relatedMatches } = useMemo(() => {
    const q = changelogSearch.trim().toLowerCase();
    if (!q) return { directMatches: filteredSortedEntries, relatedMatches: [] as ChangelogEntry[] };
    const layer1 = filteredSortedEntries.filter(entry => {
      const searchable = [
        entry.feature, entry.featureHe, entry.notes, entry.notesHe,
        entry.purpose, entry.purposeHe, entry.id, entry.workflowStatus,
        entry.route || '', entry.commitHash || '', entry.date,
        ...entry.files, ...(entry.connectedTo || []),
      ].join(' ').toLowerCase();
      return searchable.includes(q);
    });
    const layer1Ids = new Set(layer1.map(e => e.id));
    const layer2 = filteredSortedEntries.filter(entry => {
      if (layer1Ids.has(entry.id)) return false;
      const connected = (entry.connectedTo || []).some(c =>
        layer1.some(l1 =>
          l1.id === c.toLowerCase() ||
          l1.files.some(f => c.toLowerCase().includes(f.split('/').pop()?.toLowerCase() || '___')) ||
          l1.feature.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(l1.id)
        )
      );
      const referencedBy = layer1.some(l1 =>
        (l1.connectedTo || []).some(c =>
          entry.id === c.toLowerCase() ||
          entry.files.some(f => c.toLowerCase().includes(f.split('/').pop()?.toLowerCase() || '___')) ||
          c.toLowerCase().includes(entry.id)
        )
      );
      return connected || referencedBy;
    });
    return { directMatches: layer1, relatedMatches: layer2 };
  }, [changelogSearch, filteredSortedEntries]);

  const groupedEntries = useMemo(() => {
    if (clGroupBy === 'none' || changelogSearch.trim()) return null;
    const entries = directMatches;
    const groups: { label: string; color: string; entries: ChangelogEntry[] }[] = [];
    const groupMap: Record<string, { label: string; color: string; entries: ChangelogEntry[] }> = {};
    for (const entry of entries) {
      let key: string;
      let label: string;
      let color = '#94a3b8';
      switch (clGroupBy) {
        case 'workflow': {
          key = entry.workflowStatus;
          const wf = WORKFLOW_CONFIG[entry.workflowStatus];
          const wfLabelMap: Record<string, string> = {
            inbox: ta.wfLabelInbox, wishlist: ta.wfLabelWishlist, todo: ta.wfLabelTodo,
            next: ta.wfLabelNext, inProgress: ta.wfLabelInProgress, hold: ta.wfLabelHold,
            stuck: ta.wfLabelStuck, freeze: ta.wfLabelFreeze, complete: ta.wfLabelComplete,
            cancelled: ta.wfLabelCancelled,
          };
          label = wfLabelMap[entry.workflowStatus] || wf.enLabel;
          color = wf.color;
          break;
        }
        case 'phase': {
          key = entry.phase ? `P${entry.phase}` : 'none';
          label = entry.phase ? `${ta.phaseLabel} ${entry.phase}` : ta.noPhase;
          const phaseColors: Record<string, string> = { P1: '#34d399', P2: '#60a5fa', P3: '#c084fc', P4: '#f472b6', P5: '#94a3b8', none: '#64748b' };
          color = phaseColors[key] || '#64748b';
          break;
        }
        case 'date': {
          key = entry.date;
          label = entry.date;
          color = '#60a5fa';
          break;
        }
        case 'fileDir': {
          const firstFile = entry.files[0] || '';
          const parts = firstFile.split('/');
          key = parts.length > 2 ? parts.slice(0, -1).join('/') : parts[0] || 'root';
          label = key;
          color = '#c084fc';
          break;
        }
      }
      if (!groupMap[key]) {
        const group = { label, color, entries: [] as ChangelogEntry[] };
        groupMap[key] = group;
        groups.push(group);
      }
      groupMap[key].entries.push(entry);
    }
    return groups;
  }, [clGroupBy, directMatches, changelogSearch, isRtl]);

  const mermaidDiagram = useMemo(() => generateMermaidDiagram(changelogEntries, allRoutes), [allRoutes]);

  return (
    <div className="space-y-6">
      <ChecklistSummary isRtl={isRtl} ta={ta} />

      {/* Search Input */}
      <div className="relative">
        <Input
          value={changelogSearch}
          onChange={e => setChangelogSearch(e.target.value)}
          placeholder={ta.searchPlaceholder}
          iconStart={<Search size={16} />}
          inputSize="lg"
          dir={isRtl ? 'rtl' : 'ltr'}
        />
        {changelogSearch && (
          <button onClick={() => setChangelogSearch('')}
            className="absolute top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-300"
            style={{ [isRtl ? 'left' : 'right']: 8 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sort / Group / Filter Toolbar */}
      <ChangelogToolbar
        sortBy={clSortBy} sortDir={clSortDir} groupBy={clGroupBy}
        clFilterWorkflow={clFilterWorkflow} clFilterPhase={clFilterPhase} clFilterTechStatus={clFilterTechStatus}
        onSortChange={(field) => { setClSortBy(field); setClSortDir(field === 'name' ? 'asc' : 'desc'); }}
        onSortDirToggle={() => setClSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        onGroupChange={setClGroupBy}
        onWorkflowToggle={(ws) => setClFilterWorkflow(prev =>
          prev.includes(ws) ? prev.filter(s => s !== ws) : [...prev, ws]
        )}
        onPhaseChange={setClFilterPhase}
        onTechStatusChange={setClFilterTechStatus}
        isRtl={isRtl} ta={ta}
      />

      {/* data-cc-id System */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Hash size={15} className="text-purple-400" />
          {ta.dataCcIdSystem}
        </h3>
        <p className="mb-3 text-xs text-slate-500">{ta.dataCcIdExplanation}</p>
        <p className="mb-4 text-xs text-slate-600">{ta.dataCcIdTextExplanation}</p>
        <div className="mb-4 flex gap-3">
          <div className="rounded-lg bg-purple-500/10 px-3 py-2 text-center">
            <div className="text-lg font-bold text-purple-400">{dataCcIds.length}</div>
            <div className="text-[10px] text-slate-500">{ta.totalIds}</div>
          </div>
          <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-center">
            <div className="text-lg font-bold text-blue-400">{dataCcIds.filter(d => d.textEditable).length}</div>
            <div className="text-[10px] text-slate-500">{ta.textEditableIds}</div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{new Set(dataCcIds.map(d => d.file)).size}</div>
            <div className="text-[10px] text-slate-500">{ta.filesWithIds}</div>
          </div>
        </div>
        <div className="space-y-1">
          {dataCcIds.map(entry => (
            <div key={`${entry.ccId}-${entry.line}`} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs hover:bg-white/[0.03] flex-wrap">
              <code className="min-w-[180px] rounded bg-purple-500/10 px-1.5 py-0.5 font-mono text-purple-300" dir="ltr">{entry.ccId}</code>
              {entry.textEditable && (
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">text</span>
              )}
              <code className="text-[10px] text-slate-600" dir="ltr">{entry.file}:{entry.line}</code>
              <span className="text-slate-500">{loc(entry, 'description', language)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Changelog */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <FileCode size={15} className="text-blue-400" />
          {ta.featureStatus}
          <span className="text-xs font-normal text-slate-500">
            — {changelogSearch
              ? `${directMatches.length + relatedMatches.length} ${ta.results}`
              : `${directMatches.length} / ${changelogEntries.length}`
            }
          </span>
        </h3>

        {directMatches.length === 0 && relatedMatches.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-600">{ta.noSearchResults}</div>
        )}

        {groupedEntries && !changelogSearch.trim() ? (
          <div className="space-y-4">
            {groupedEntries.map(group => (
              <CollapsibleRow
                key={group.label} isRtl={isRtl} defaultOpen count={group.entries.length}
                title={
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: group.color }} />
                    <span>{group.label}</span>
                  </span>
                }
              >
                <div className="space-y-3">
                  {group.entries.map(entry => (
                    <ChangelogCard key={entry.id} entry={entry} isRtl={isRtl} language={language} ta={ta} />
                  ))}
                </div>
              </CollapsibleRow>
            ))}
          </div>
        ) : (
          <>
            {changelogSearch && directMatches.length > 0 && (
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
                <CheckCircle2 size={12} />
                {ta.directMatches} ({directMatches.length})
              </div>
            )}
            <div className="space-y-3">
              {directMatches.map(entry => (
                <ChangelogCard key={entry.id} entry={entry} isRtl={isRtl} language={language} ta={ta} />
              ))}
            </div>
            {changelogSearch && relatedMatches.length > 0 && (
              <>
                <div className="my-4 border-t border-white/[0.06]" />
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-400">
                  <Network size={12} />
                  {ta.relatedConnected} ({relatedMatches.length})
                </div>
                <div className="space-y-3">
                  {relatedMatches.map(entry => (
                    <ChangelogCard key={entry.id} entry={entry} isRtl={isRtl} language={language} ta={ta} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Architecture Diagram */}
      {!changelogSearch && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Network size={15} className="text-purple-400" />
            {ta.architectureDiagram}
          </h3>
          <MermaidDiagram definition={mermaidDiagram} ta={ta} />
          <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#065f46', border: '1px solid #34d399' }} /> {ta.working}</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#78350f', border: '1px solid #fbbf24' }} /> {ta.notVerified}</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#7f1d1d', border: '1px solid #ef4444' }} /> {ta.broken}</span>
            <span className="text-slate-700">|</span>
            <span>[ ] = {ta.hasRoute}</span>
            <span>( ) = {ta.noRoute}</span>
            <span>-.- = {ta.connectedToLegend}</span>
          </div>
        </div>
      )}

      {/* Git Status — Live */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <GitCommit size={15} className="text-emerald-400" />
            Git Status
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">{ta.liveStatus}</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">{ta.devOnly}</span>
            <button onClick={fetchGitStatus} className="rounded p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
              <RefreshCw size={14} className={gitLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className={`mb-4 rounded-lg px-3 py-2 text-xs ${actionFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {actionFeedback.message}
          </div>
        )}

        {gitLoading && !gitData ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            {ta.loadingGit}
          </div>
        ) : gitError ? (
          <div className="py-6 text-center text-sm text-red-400">{gitError}</div>
        ) : gitData ? (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={commitMsg}
                onChange={e => setCommitMsg(e.target.value)}
                placeholder={ta.commitPlaceholder}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex-1"
                onKeyDown={e => { if (e.key === 'Enter' && commitMsg.trim()) handleCommit(); }}
              />
              <Button variant="primary" icon={GitCommit} loading={commitLoading} disabled={!commitMsg.trim()} onClick={handleCommit}>
                {commitLoading ? ta.committing : ta.commitButton}
              </Button>
              <Button variant="secondary" icon={Rocket} loading={deployLoading} onClick={handleDeploy}
                className="!bg-emerald-600 !text-white hover:!bg-emerald-500 !border-transparent">
                {deployLoading ? ta.pushing : ta.deployButton}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] font-medium text-slate-500">
                  {ta.committedChanges} ({gitData.commits.length})
                </div>
                <div className="space-y-1.5">
                  {gitData.commits.map(c => (
                    <div key={c.hash} className="flex items-start gap-2 text-xs">
                      <Badge intent="success" size="sm"><code className="font-mono" dir="ltr">{c.hash}</code></Badge>
                      <span className="text-slate-400" dir="ltr">{c.message}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-medium text-slate-500">
                  {ta.uncommittedChanges} ({gitData.modified.length + gitData.untracked.length})
                </div>
                {gitData.modified.length > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 text-[10px] text-slate-600">{ta.modifiedFiles} ({gitData.modified.length})</div>
                    <div className="space-y-0.5">
                      {gitData.modified.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-amber-400">M</span>
                          <code className="text-slate-500" dir="ltr">{f}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {gitData.untracked.length > 0 && (
                  <div>
                    <div className="mb-1 text-[10px] text-slate-600">{ta.untrackedFiles} ({gitData.untracked.length})</div>
                    <div className="space-y-0.5">
                      {gitData.untracked.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-emerald-400">+</span>
                          <code className="text-slate-500" dir="ltr">{f}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!gitData.isDirty && (
                  <div className="py-3 text-center text-xs text-slate-600">{ta.nothingToCommit}</div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
