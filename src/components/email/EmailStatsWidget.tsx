'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Eye, MousePointerClick, AlertTriangle, Loader2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';
import type { WidgetSize } from '@/components/command-center/widgets/WidgetRegistry';

interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

function useEmailStats() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/email/sends?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.sends) {
          const sends = d.sends as Array<{ status: string }>;
          setStats({
            total: sends.length,
            sent: sends.filter((s) => s.status === 'sent').length,
            delivered: sends.filter((s) => s.status === 'delivered').length,
            opened: sends.filter((s) => s.status === 'opened').length,
            clicked: sends.filter((s) => s.status === 'clicked').length,
            bounced: sends.filter((s) => s.status === 'bounced').length,
            failed: sends.filter((s) => s.status === 'failed').length,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { stats, loading };
}

export function EmailStatsPanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const e = t.email as Record<string, string>;
  const { stats, loading } = useEmailStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Mail className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">{e.noEmailsSent || 'No emails sent yet'}</p>
      </div>
    );
  }

  const openRate = stats.total > 0 ? Math.round((stats.opened / stats.total) * 100) : 0;
  const clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0;

  const metrics = [
    { icon: Send, label: e.totalSent || 'Sent', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Eye, label: e.opened || 'Opened', value: `${stats.opened} (${openRate}%)`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: MousePointerClick, label: e.clicked || 'Clicked', value: `${stats.clicked} (${clickRate}%)`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: AlertTriangle, label: e.bounced || 'Bounced', value: stats.bounced + stats.failed, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-lg ${bg} px-3 py-2.5`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
            <span className={`mt-1 block text-lg font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Open rate bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{e.openRate || 'Open Rate'}</span>
          <span className="text-amber-400">{openRate}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-amber-500/60 transition-all" style={{ width: `${Math.min(openRate, 100)}%` }} />
        </div>
      </div>

      {/* Click rate bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{e.clickRate || 'Click Rate'}</span>
          <span className="text-purple-400">{clickRate}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-purple-500/60 transition-all" style={{ width: `${Math.min(clickRate, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export function EmailStatsBarContent({ size }: { size: WidgetSize }) {
  const { stats, loading } = useEmailStats();

  if (loading || !stats) return null;

  if (size < 2) {
    if (stats.bounced > 0) {
      return <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />;
    }
    return null;
  }

  if (size === 2) {
    return (
      <span className="text-xs text-slate-400">
        {stats.total}
      </span>
    );
  }

  const openRate = stats.total > 0 ? Math.round((stats.opened / stats.total) * 100) : 0;

  return (
    <span className="truncate text-xs text-slate-400">
      {stats.total} sent · {openRate}% opened
    </span>
  );
}
