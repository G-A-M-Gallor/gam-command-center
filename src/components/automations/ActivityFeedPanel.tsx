'use client';

import { useState, useEffect } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ActivityFeedPanelProps {
  t: Record<string, string>;
}

interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string | null;
  changed_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-500/15 text-emerald-400',
  UPDATE: 'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-red-500/15 text-red-400',
};

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

export function ActivityFeedPanel({ t }: ActivityFeedPanelProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function load() {
      try {
        const res = await fetch('/api/automations/activity');
        const data = await res.json();
        if (data.entries) setEntries(data.entries);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Realtime: listen for new audit_log inserts
    channel = supabase
      .channel('audit-log-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        (payload) => {
          const newEntry = payload.new as AuditEntry;
          setEntries((prev) => [newEntry, ...prev].slice(0, 50));
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      INSERT: t.activityInsert || 'Insert',
      UPDATE: t.activityUpdate || 'Update',
      DELETE: t.activityDelete || 'Delete',
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-4" data-cc-id="automations.activityFeed">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{t.activityFeed}</h3>
          <p className="text-xs text-slate-500">{t.activityFeedDesc}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t.activityLive}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-white/[0.02] py-12">
          <Activity className="h-8 w-8 text-slate-600" />
          <p className="text-xs text-slate-500">{t.activityNoEntries}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700/50">
          <table className="w-full text-xs" dir="ltr">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.activityTime}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.activityTable}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.activityAction}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.activityRecord}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-slate-700/20 ${i % 2 === 0 ? 'bg-slate-800/10' : ''}`}
                >
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">
                    {timeAgo(entry.changed_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-700/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                      {entry.table_name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${ACTION_COLORS[entry.action] || 'bg-slate-500/15 text-slate-400'}`}>
                      {actionLabel(entry.action)}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-[10px] text-slate-500">
                    {entry.record_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
