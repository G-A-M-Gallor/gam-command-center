'use client';

import { useState, useEffect } from 'react';
import { History, Loader2, CheckCircle2, XCircle, RotateCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RunHistoryPanelProps {
  t: Record<string, string>;
}

interface AutomationRun {
  id: number;
  job_name: string;
  status: 'running' | 'success' | 'error';
  result: Record<string, unknown> | null;
  triggered_by: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const STATUS_CONFIG = {
  running: { icon: RotateCw, color: 'bg-blue-500/15 text-blue-400', animate: 'animate-spin' },
  success: { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-400', animate: '' },
  error: { icon: XCircle, color: 'bg-red-500/15 text-red-400', animate: '' },
} as const;

export function RunHistoryPanel({ _t }: RunHistoryPanelProps) {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function load() {
      try {
        const res = await fetch('/api/automations/history');
        const data = await res.json();
        if (data.runs) setRuns(data.runs);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Realtime: listen for automation_runs changes
    channel = supabase
      .channel('automation-runs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'automation_runs' },
        (payload) => {
          const newRun = payload.new as AutomationRun;
          setRuns((prev) => [newRun, ...prev].slice(0, 50));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'automation_runs' },
        (payload) => {
          const updated = payload.new as AutomationRun;
          setRuns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      running: t.runStatusRunning || 'Running',
      success: t.runStatusSuccess || 'Success',
      error: t.runStatusError || 'Error',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-4" data-cc-id="automations.runHistory">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{t.runHistory}</h3>
          <p className="text-xs text-slate-500">{t.runHistoryDesc}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {_t.runLive}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-white/[0.02] py-12">
          <History className="h-8 w-8 text-slate-600" />
          <p className="text-xs text-slate-500">{_t.runNoEntries}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700/50">
          <table className="w-full text-xs" dir="ltr">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.runStarted}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.runJobName}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.runStatus}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{_t.runDuration}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => {
                const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.error;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={run.id}
                    className={`border-b border-slate-700/20 ${i % 2 === 0 ? 'bg-slate-800/10' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">
                      {timeAgo(run.started_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-200">{run.job_name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                        <Icon className={`h-3 w-3 ${cfg.animate}`} />
                        {statusLabel(run.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">
                      {run.duration_ms != null ? `${run.duration_ms}${t.runMs || 'ms'}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
