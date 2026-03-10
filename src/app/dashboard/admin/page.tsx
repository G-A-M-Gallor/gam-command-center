'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';
import { getOverallScore } from '@/lib/audit/checks';
import type { Phase } from './types';
import {
  routes, standalonePages, widgets, contexts,
  changelogEntries, getOverallChecklistScoreFromEntries,
} from './data';
import { RoutesSection, WidgetsSection, ContextsSection } from './RoutesTab';
import ChangelogTab from './ChangelogTab';
import StoryMapTab from './StoryMapTab';

// ─── Stat Card ───────────────────────────────────────────

function StatCard({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value}{suffix}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function AdminDevLogPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const ta = t.admin;

  const [activeSection, setActiveSection] = useState<'routes' | 'widgets' | 'contexts' | 'changelog' | 'storymap'>('routes');

  const allRoutes = [...routes, ...standalonePages];

  const stats = useMemo(() => {
    const activeRoutes = allRoutes.filter(r => r.status === 'active').length;
    const placeholderRoutes = allRoutes.filter(r => r.status === 'placeholder').length;
    const totalComponents = allRoutes.reduce((sum, r) => sum + r.components.length, 0);
    const totalFields = allRoutes.reduce((sum, r) => sum + r.components.reduce((s, c) => s + (c.fields?.length || 0), 0), 0);
    const clScore = getOverallChecklistScoreFromEntries(changelogEntries);
    return { activeRoutes, placeholderRoutes, totalComponents, totalFields, totalWidgets: widgets.length, totalContexts: contexts.length, checklistPct: clScore.pct };
  }, [allRoutes]);

  const phaseProgress = useMemo(() => {
    const phases: Phase[] = [1, 2, 3, 4, 5];
    return phases.map(p => {
      const all = allRoutes.filter(r => r.phase === p);
      const active = all.filter(r => r.status === 'active');
      return { phase: p, total: all.length, active: active.length, pct: all.length > 0 ? Math.round((active.length / all.length) * 100) : 0 };
    });
  }, [allRoutes]);

  const phaseLabelsMap: Record<Phase, string> = {
    1: ta.phase1, 2: ta.phase2, 3: ta.phase3, 4: ta.phase4, 5: ta.phase5,
  };

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="admin" />

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label={ta.activePages} value={stats.activeRoutes} color="#34d399" />
          <StatCard label={ta.placeholderPages} value={stats.placeholderRoutes} color="#fbbf24" />
          <StatCard label={ta.components} value={stats.totalComponents} color="#60a5fa" />
          <StatCard label={ta.fieldsMapped} value={stats.totalFields} color="#c084fc" />
          <StatCard label={ta.widgetsLabel} value={stats.totalWidgets} color="#f472b6" />
          <StatCard label={ta.contextsLabel} value={stats.totalContexts} color="#fb923c" />
          <StatCard label={ta.checklistDone} value={stats.checklistPct} color={stats.checklistPct >= 80 ? '#34d399' : '#fbbf24'} suffix="%" />
        </div>

        {/* Audit Link */}
        <Link
          href="/dashboard/admin/audit"
          className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 px-5 py-3 transition-colors hover:bg-purple-500/10"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck size={18} className="text-purple-400" />
            <div>
              <span className="text-sm font-medium text-slate-200">{ta.auditLinkTitle}</span>
              <p className="text-[11px] text-slate-500">{ta.auditLinkSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              getOverallScore() >= 80 ? 'text-emerald-400' : getOverallScore() >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {getOverallScore()}%
            </span>
            <ExternalLink size={14} className="text-slate-600" />
          </div>
        </Link>

        {/* Phase Progress */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">{ta.phaseProgress}</h3>
          <div className="space-y-2">
            {phaseProgress.map(p => (
              <div key={p.phase} className="flex items-center gap-3">
                <span className="w-24 sm:w-44 text-xs text-slate-500">{phaseLabelsMap[p.phase]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#34d399' : p.pct > 0 ? '#60a5fa' : '#374151' }} />
                </div>
                <span className="w-20 text-[11px] text-slate-500" dir="ltr" style={{ textAlign: isHe ? 'left' : 'right' }}>
                  {p.active}/{p.total} ({p.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] pb-px overflow-x-auto">
          {(['routes', 'widgets', 'contexts', 'changelog', 'storymap'] as const).map(section => (
            <button key={section} onClick={() => setActiveSection(section)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeSection === section ? 'bg-white/5 text-white border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {section === 'routes' ? `${ta.tabRoutes} (${allRoutes.length})` :
               section === 'widgets' ? `${ta.tabWidgets} (${widgets.length})` :
               section === 'contexts' ? `${ta.tabContexts} (${contexts.length})` :
               section === 'changelog' ? `${ta.tabChangelog} (${changelogEntries.length})` :
               ta.tabStoryMap}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeSection === 'routes' && <RoutesSection isHe={isHe} ta={ta} />}
        {activeSection === 'widgets' && <WidgetsSection isHe={isHe} ta={ta} />}
        {activeSection === 'contexts' && <ContextsSection isHe={isHe} ta={ta} />}
        {activeSection === 'changelog' && <ChangelogTab isHe={isHe} ta={ta} />}
        {activeSection === 'storymap' && <StoryMapTab isHe={isHe} ta={ta} />}

        {/* Architecture Summary */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">{ta.architectureStack}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 md:grid-cols-6">
            {[
              { layer: 'UI', tool: 'Next.js 15', color: '#60a5fa' },
              { layer: 'DB + API', tool: 'Supabase', color: '#34d399' },
              { layer: 'SOT', tool: 'Origami CRM', color: '#f472b6' },
              { layer: ta.layerKnowledge, tool: 'Notion', color: '#fbbf24' },
              { layer: ta.layerAutomation, tool: 'n8n', color: '#fb923c' },
              { layer: ta.layerMessaging, tool: 'WATI', color: '#a78bfa' },
            ].map(s => (
              <div key={s.layer} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-center">
                <div className="text-[10px] text-slate-600">{s.layer}</div>
                <div className="font-semibold" style={{ color: s.color }}>{s.tool}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
