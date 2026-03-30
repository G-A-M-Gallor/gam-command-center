'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2, AlertCircle, Clock, Circle,
  ChevronDown, ChevronRight, ChevronLeft,
  Component, Database, Eye, EyeOff, LayoutDashboard, Globe,
} from 'lucide-react';
import { getTranslations, loc } from '@/lib/i18n';
import type { Language } from '@/contexts/SettingsContext';
import type { Status, Phase, RouteEntry } from './types';
import { routes, standalonePages, widgets, contexts } from './data';

// ─── Shared Sub-components ───────────────────────────────

type AdminTranslations = ReturnType<typeof getTranslations>['admin'];

function StatusBadge({ status, ta }: { status: Status; ta: AdminTranslations }) {
  const cfg: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
    active: { label: ta.statusActive, color: '#34d399', icon: CheckCircle2 },
    placeholder: { label: ta.statusPlaceholder, color: '#fbbf24', icon: AlertCircle },
    'coming-soon': { label: ta.statusComingSoon, color: '#818cf8', icon: Clock },
    deprecated: { label: ta.statusDeprecated, color: '#ef4444', icon: Circle },
  };
  const c = cfg[status];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: c.color, background: `${c.color}15` }}>
      <Icon size={12} />
      {c.label}
    </span>
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

function RouteCard({ route, language, ta }: { route: RouteEntry; language: Language; ta: AdminTranslations }) {
  const isRtl = language === 'he';
  const Icon = route.icon;
  const description = language === 'he' ? route.descriptionHe : route.descriptionEn;
  const displayName = loc(route, 'name', language);
  const secondaryName = isRtl ? route.name : route.nameHe;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
            <Icon size={18} className="text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-100">{displayName}</span>
              <span className="text-xs text-slate-500">{secondaryName}</span>
              <PhaseBadge phase={route.phase} />
              <StatusBadge status={route.status} ta={ta} />
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
              <code className="rounded bg-white/5 px-1.5 py-0.5" dir="ltr">{route.path}</code>
              <span>v{route.version}</span>
              <span>{route.addedDate}</span>
              {route.visible ? (
                <span className="flex items-center gap-1 text-emerald-400"><Eye size={10} /> {ta.routeVisible}</span>
              ) : (
                <span className="flex items-center gap-1 text-slate-600"><EyeOff size={10} /> {ta.routeHidden}</span>
              )}
              {route.sidebarTab && <span className="text-blue-400">{ta.routeSidebar}</span>}
            </div>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">{description}</p>

      {route.components.length > 0 && (
        <CollapsibleRow isRtl={isRtl} title={<span className="flex items-center gap-1.5"><Component size={13} className="text-slate-500" /> {ta.routeComponents}</span>} count={route.components.length}>
          <div className="mt-1 space-y-2">
            {route.components.map(comp => (
              <div key={comp.id} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={comp.status} ta={ta} />
                  <span className="text-sm font-medium text-slate-200">{comp.name}</span>
                  <code className="text-[10px] text-slate-600" dir="ltr">{comp.file}</code>
                </div>
                {comp.fields && comp.fields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comp.fields.map(f => (
                      <span key={f.name} className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400" dir="ltr">
                        <Database size={9} className="text-slate-600" />
                        {f.name} <span className="text-slate-600">({f.type})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleRow>
      )}

      {route.contexts.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] flex-wrap">
          <span className="text-slate-600">{ta.routeContexts}</span>
          {route.contexts.map(c => (
            <span key={c} className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">{c}</span>
          ))}
        </div>
      )}

      {route.supabaseTables && route.supabaseTables.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] flex-wrap">
          <Database size={10} className="text-slate-600" />
          <span className="text-slate-600">{ta.routeTables}</span>
          {route.supabaseTables.map(tbl => (
            <code key={tbl} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">{tbl}</code>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Routes Tab ──────────────────────────────────────────

export function RoutesSection({ language, ta }: { language: Language; ta: ReturnType<typeof getTranslations>['admin'] }) {
  const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');

  const allRoutes = useMemo(() => [...routes, ...standalonePages], []);

  const filteredRoutes = useMemo(() => {
    return allRoutes.filter(r => {
      if (filterPhase !== 'all' && r.phase !== filterPhase) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [filterPhase, filterStatus, allRoutes]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-600">{ta.filterPhase}:</span>
        {(['all', 1, 2, 3, 4, 5] as const).map(p => (
          <button key={p} onClick={() => setFilterPhase(p)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              filterPhase === p ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500 hover:text-slate-300'
            }`}>
            {p === 'all' ? ta.filterAll : `P${p}`}
          </button>
        ))}
        <span className="h-4 w-px bg-white/10" />
        <span className="text-xs text-slate-600">{ta.filterStatus}:</span>
        {(['all', 'active', 'placeholder', 'coming-soon'] as const).map(s => {
          const labels: Record<string, string> = { all: ta.filterAll, active: ta.statusActive, placeholder: ta.statusPlaceholder, 'coming-soon': ta.statusComingSoon };
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filterStatus === s ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500 hover:text-slate-300'
              }`}>
              {labels[s]}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-400">
          <LayoutDashboard size={14} /> {ta.dashboardRoutes}
        </h3>
        <div className="space-y-3">
          {filteredRoutes.filter(r => r.path.startsWith('/dashboard')).map(route => (
            <RouteCard key={route.id} route={route} language={language} ta={ta} />
          ))}
        </div>
      </div>

      {filteredRoutes.some(r => !r.path.startsWith('/dashboard')) && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-400">
            <Globe size={14} /> {ta.standalonePages}
          </h3>
          <div className="space-y-3">
            {filteredRoutes.filter(r => !r.path.startsWith('/dashboard')).map(route => (
              <RouteCard key={route.id} route={route} language={language} ta={ta} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Widgets Tab ─────────────────────────────────────────

export function WidgetsSection({ language, ta }: { language: Language; ta: AdminTranslations }) {
  const isRtl = language === 'he';
  return (
    <div className="space-y-2">
      {widgets.map(w => (
        <div key={w.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={w.status} ta={ta} />
            <div>
              <span className="text-sm font-medium text-slate-200">{loc(w, 'name', language)}</span>
              <span className="mx-2 text-xs text-slate-600">{isRtl ? w.name : w.nameHe}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
            <code className="rounded bg-white/5 px-1.5 py-0.5" dir="ltr">{w.file}</code>
            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">{w.defaultSize}</span>
            <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">{w.panelMode}</span>
            <span>v{w.version}</span>
            <span>{w.addedDate}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Contexts Tab ────────────────────────────────────────

export function ContextsSection({ ta }: { language?: Language; ta: AdminTranslations }) {
  return (
    <div className="space-y-3">
      {contexts.map(ctx => (
        <div key={ctx.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={ctx.status} ta={ta} />
              <span className="text-sm font-medium text-slate-200">{ctx.name}</span>
              <code className="text-[10px] text-slate-600" dir="ltr">{ctx.file}</code>
            </div>
            <span className="text-[11px] text-slate-500">v{ctx.version}</span>
          </div>
          {ctx.storageKeys.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ctx.storageKeys.map(k => (
                <code key={k} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400" dir="ltr">{k}</code>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
