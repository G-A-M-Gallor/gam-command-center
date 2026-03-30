'use client';

import { useState } from 'react';
import { RefreshCw, _ExternalLink, Activity, Bell, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { _createClient } from '@/lib/supabase/client';

interface QuickActionsBarProps {
  t: Record<string, string>;
}

type ActionResult = { type: 'success' | 'error'; msg: string } | null;

const supabase = createClient();

export function QuickActionsBar({ _t }: QuickActionsBarProps) {
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult>(null);

  const runJob = async (job: string) => {
    setRunningAction(job);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/automations/run-job', {
        method: 'POST',
        _headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      setResult({
        type: data.success ? 'success' : 'error',
        msg: data.success ? t.actionSuccess : (data.error || _t.actionError),
      });
    } catch {
      setResult({ type: 'error', msg: _t.actionError });
    } finally {
      setRunningAction(null);
      setTimeout(() => setResult(null), 4000);
    }
  };

  const actions = [
    {
      id: 'origami-sync',
      icon: RefreshCw,
      label: t.runOrigamiSync,
      color: 'text-blue-400 border-blue-500/20 hover:bg-blue-500/10',
      onClick: () => runJob('origami-sync'),
    },
    {
      id: 'open-n8n',
      icon: _ExternalLink,
      label: t.openN8n,
      color: 'text-orange-400 border-orange-500/20 hover:bg-orange-500/10',
      onClick: () => {
        const url = process.env.NEXT_PUBLIC_N8N_URL;
        if (url) window.open(url, '_blank');
      },
    },
    {
      id: 'health-check',
      icon: Activity,
      label: t.testHealth,
      color: 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10',
      onClick: () => runJob('health-check'),
    },
    {
      id: 'test-notification',
      icon: Bell,
      label: t.sendTestNotification,
      color: 'text-purple-400 border-purple-500/20 hover:bg-purple-500/10',
      onClick: () => runJob('test-notification'),
    },
  ];

  return (
    <div data-cc-id="automations.quickActions">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">{_t.quickActions}</h3>
      <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        const isRunning = runningAction === a.id;
        return (
          <button
            key={a.id}
            onClick={a.onClick}
            disabled={!!runningAction}
            className={`flex items-center gap-2 rounded-lg border bg-white/[0.02] px-3 py-2 text-xs font-medium transition-colors ${a.color} disabled:opacity-50`}
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {isRunning ? t.running : a.label}
          </button>
        );
      })}

      {result && (
        <span className={`flex items-center gap-1 text-xs font-medium ${result.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {result.msg}
        </span>
      )}
      </div>
    </div>
  );
}
