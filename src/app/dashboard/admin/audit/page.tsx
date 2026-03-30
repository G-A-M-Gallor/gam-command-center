'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  XCircle, Info, ArrowLeft, ArrowRight, FileCode,
} from 'lucide-react';
import { useSettings, type _Language } from '@/contexts/SettingsContext';
import { _getTranslations, loc } from '@/lib/i18n';
import { PageHeader } from '@/components/command-center/PageHeader';
import {
  allChecks, getChecksByHat, getHatScore, getOverallScore, hatMeta,
  type AuditHat, type CheckResult, type AuditCheck,
} from '@/lib/audit/checks';

// ─── Sub-components ──────────────────────────────────────────

function ResultIcon({ result }: { result: CheckResult }) {
  switch (result) {
    case 'pass': return <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />;
    case 'warn': return <AlertTriangle size={14} className="shrink-0 text-amber-400" />;
    case 'fail': return <XCircle size={14} className="shrink-0 text-red-400" />;
    case 'info': return <Info size={14} className="shrink-0 text-blue-400" />;
  }
}

const resultColors: Record<CheckResult, string> = {
  pass: 'border-emerald-500/20 bg-emerald-500/5',
  warn: 'border-amber-500/20 bg-amber-500/5',
  fail: 'border-red-500/20 bg-red-500/5',
  info: 'border-blue-500/20 bg-blue-500/5',
};

type AuditTranslations = ReturnType<typeof getTranslations>['audit'];

function getResultLabels(ta: AuditTranslations): Record<CheckResult, string> {
  return {
    pass: ta.resultPass,
    warn: ta.resultWarn,
    fail: ta.resultFail,
    info: ta.resultInfo,
  };
}

function ScoreRing({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#ef4444';

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.25} fontWeight="bold">
        {pct}%
      </text>
    </svg>
  );
}

function CheckCard({ check, isRtl, language, ta }: { check: AuditCheck; isRtl: boolean; language: _Language; ta: AuditTranslations }) {
  const [expanded, setExpanded] = useState(false);
  const Arrow = expanded ? ChevronDown : (isRtl ? ChevronLeft : ChevronRight);
  const resultLabelMap = getResultLabels(ta);

  return (
    <div className={`rounded-lg border ${resultColors[check.result]} transition-colors`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <ResultIcon result={check.result} />
        <span className="flex-1 text-sm font-medium text-slate-200">
          {loc(check, 'title', language)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          check.result === 'pass' ? 'bg-emerald-500/20 text-emerald-400' :
          check.result === 'warn' ? 'bg-amber-500/20 text-amber-400' :
          check.result === 'fail' ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {resultLabelMap[check.result]}
        </span>
        <Arrow size={14} className="shrink-0 text-slate-600" />
      </button>

      {expanded && (
        <div className="border-_t border-white/[0.04] px-4 py-3 space-y-2" dir={isRtl ? 'rtl' : 'ltr'}>
          <p className="text-xs text-slate-400">{loc(check, 'detail', language)}</p>

          {check.file && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <FileCode size={10} />
              <code dir="ltr">{check.file}</code>
            </div>
          )}

          {check.recommendation && (
            <div className="mt-2 rounded-md bg-white/[0.03] px-3 py-2">
              <span className="text-[10px] font-medium text-slate-500">
                {ta.recommendation}
              </span>
              <p className="mt-0.5 text-xs text-slate-400">
                {loc(check, 'recommendation', language)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HatSummary({ hat, isRtl, language, isActive, onClick, ta }: {
  hat: AuditHat; isRtl: boolean; language: _Language; isActive: boolean; onClick: () => void; ta: AuditTranslations;
}) {
  const score = getHatScore(hat);
  const meta = hatMeta[hat];

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        isActive
          ? 'border-purple-500/30 bg-purple-500/5 ring-1 ring-purple-500/20'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-3">
        <ScoreRing pct={score.pct} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.icon}</span>
            <span className="text-sm font-semibold text-slate-200">
              {loc(meta, 'label', language)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 truncate">
            {loc(meta, 'description', language)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="text-emerald-400">{score.pass} {ta.passCount}</span>
            <span className="text-slate-700">|</span>
            <span className="text-amber-400">{score.warn} {ta.warnCount}</span>
            <span className="text-slate-700">|</span>
            <span className="text-red-400">{score.fail} {ta.failCount}</span>
            {score.info > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span className="text-blue-400">{score.info} {ta.infoCount}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function AuditPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const isRtl = language === 'he';

  const [activeHat, setActiveHat] = useState<AuditHat | 'all'>('all');
  const [filterResult, setFilterResult] = useState<CheckResult | 'all'>('all');

  const ta = t.audit;
  const overall = getOverallScore();

  const displayChecks = useMemo(() => {
    let checks = activeHat === 'all' ? allChecks : getChecksByHat(activeHat);
    if (filterResult !== 'all') {
      checks = checks.filter(c => c.result === filterResult);
    }
    return checks;
  }, [activeHat, filterResult]);

  const totalStats = useMemo(() => {
    const pass = allChecks.filter(c => c.result === 'pass').length;
    const warn = allChecks.filter(c => c.result === 'warn').length;
    const fail = allChecks.filter(c => c.result === 'fail').length;
    const info = allChecks.filter(c => c.result === 'info').length;
    return { pass, warn, fail, info, total: allChecks.length };
  }, []);

  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="admin" />

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* Back to Admin */}
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
        >
          <BackArrow size={12} />
          {ta.backToAdmin}
        </Link>

        {/* Overall Score Banner */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center gap-6 flex-wrap" dir={isRtl ? 'rtl' : 'ltr'}>
            <ScoreRing pct={overall} size={80} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-100">{ta.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{ta.subtitle}</p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {totalStats.pass} {ta.passed}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {totalStats.warn} {ta.warnings}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  {totalStats.fail} {ta.failures}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {totalStats.info} {ta.infoItems}
                </span>
              </div>
            </div>
            <div className="text-right" dir="ltr">
              <div className="text-[10px] text-slate-600">{ta.totalChecks}</div>
              <div className="text-2xl font-bold text-slate-300">{totalStats.total}</div>
            </div>
          </div>
        </div>

        {/* Hat Cards Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['plan', 'reality', 'quality', 'integrity'] as AuditHat[]).map(hat => (
            <HatSummary
              key={hat}
              hat={hat}
              isRtl={isRtl}
              language={language}
              ta={ta}
              isActive={activeHat === hat}
              onClick={() => setActiveHat(activeHat === hat ? 'all' : hat)}
            />
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap" dir={isRtl ? 'rtl' : 'ltr'}>
          <span className="text-xs text-slate-600">{ta.filterBy}:</span>
          {(['all', 'fail', 'warn', 'pass', 'info'] as const).map(r => {
            const labels: Record<string, string> = {
              all: ta.filterAll,
              pass: ta.passed,
              warn: ta.warnings,
              fail: ta.failures,
              info: ta.infoItems,
            };
            const count = r === 'all'
              ? displayChecks.length
              : (activeHat === 'all' ? allChecks : getChecksByHat(activeHat as AuditHat)).filter(c => c.result === r).length;
            return (
              <button
                key={r}
                onClick={() => setFilterResult(r === 'all' ? 'all' : r)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  filterResult === r
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {labels[r]} ({count})
              </button>
            );
          })}
        </div>

        {/* Active Hat Header */}
        {activeHat !== 'all' && (
          <div className="flex items-center gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
            <span className="text-xl">{hatMeta[activeHat].icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {loc(hatMeta[activeHat], 'label', language)}
              </h3>
              <p className="text-xs text-slate-500">
                {loc(hatMeta[activeHat], 'description', language)}
              </p>
            </div>
          </div>
        )}

        {/* Check Cards */}
        <div className="space-y-2">
          {displayChecks.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-600">{ta.noChecks}</div>
          ) : (
            displayChecks.map(check => (
              <CheckCard key={check.id} check={check} isRtl={isRtl} language={language} ta={ta} />
            ))
          )}
        </div>

        {/* Summary Table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-300" dir={isRtl ? 'rtl' : 'ltr'}>
            {ta.summaryTitle}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="ltr">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 text-left text-slate-500 font-medium">{ta.hat}</th>
                  <th className="py-2 text-center text-slate-500 font-medium">{ta.score}</th>
                  <th className="py-2 text-center text-emerald-500 font-medium">{ta.resultPass}</th>
                  <th className="py-2 text-center text-amber-500 font-medium">{ta.resultWarn}</th>
                  <th className="py-2 text-center text-red-500 font-medium">{ta.resultFail}</th>
                  <th className="py-2 text-center text-blue-500 font-medium">{ta.resultInfo}</th>
                  <th className="py-2 text-center text-slate-500 font-medium">{ta.totalLabel}</th>
                </tr>
              </thead>
              <tbody>
                {(['plan', 'reality', 'quality', 'integrity'] as AuditHat[]).map(hat => {
                  const score = getHatScore(hat);
                  const meta = hatMeta[hat];
                  return (
                    <tr key={hat} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-2.5">
                        <span className="flex items-center gap-2">
                          <span>{meta.icon}</span>
                          <span className="text-slate-300">{loc(meta, 'label', language)}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`font-bold ${
                          score.pct >= 80 ? 'text-emerald-400' : score.pct >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {score.pct}%
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-emerald-400">{score.pass}</td>
                      <td className="py-2.5 text-center text-amber-400">{score.warn}</td>
                      <td className="py-2.5 text-center text-red-400">{score.fail}</td>
                      <td className="py-2.5 text-center text-blue-400">{score.info}</td>
                      <td className="py-2.5 text-center text-slate-500">{score.total}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  <td className="py-2.5 text-slate-300">{ta.overall}</td>
                  <td className="py-2.5 text-center">
                    <span className={`${
                      overall >= 80 ? 'text-emerald-400' : overall >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {overall}%
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-emerald-400">{totalStats.pass}</td>
                  <td className="py-2.5 text-center text-amber-400">{totalStats.warn}</td>
                  <td className="py-2.5 text-center text-red-400">{totalStats.fail}</td>
                  <td className="py-2.5 text-center text-blue-400">{totalStats.info}</td>
                  <td className="py-2.5 text-center text-slate-400">{totalStats.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
