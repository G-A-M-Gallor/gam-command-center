'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Building2,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ServiceStatus {
  status: 'online' | 'offline' | 'configured' | 'unconfigured';
  checks?: Record<string, string>;
}

interface StatusData {
  supabase: ServiceStatus;
  n8n: ServiceStatus;
  origami: ServiceStatus;
  wati: ServiceStatus;
  notion: ServiceStatus;
  timestamp: string;
}

interface CardDef {
  key: keyof Omit<StatusData, 'timestamp'>;
  icon: LucideIcon;
  color: string;
  borderColor: string;
  name: string;
  desc: string;
}

const statusDot = (status: string) => {
  if (status === 'online') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === 'configured') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  if (status === 'unconfigured') return <XCircle className="h-4 w-4 text-slate-500" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
};

const statusLabel = (status: string, t: Record<string, string>) => {
  if (status === 'online') return t.online;
  if (status === 'configured') return t.configured;
  if (status === 'unconfigured') return t.unconfigured;
  return t.offline;
};

interface ConnectionCardsProps {
  t: Record<string, string>;
}

export function ConnectionCards({ t }: ConnectionCardsProps) {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingCard, setTestingCard] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/automations/status');
      if (res.ok) {
        setData(await res.json());
        setLastCheckedTime(new Date().toLocaleTimeString());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTest = async (key: string) => {
    setTestingCard(key);
    await fetchStatus();
    setTestingCard(null);
  };

  const cards: CardDef[] = [
    { key: 'supabase', icon: Database, color: 'text-emerald-400', borderColor: 'border-emerald-500/20', name: t.supabase, desc: t.supabaseDesc },
    { key: 'n8n', icon: RefreshCw, color: 'text-orange-400', borderColor: 'border-orange-500/20', name: t.n8n, desc: t.n8nDesc },
    { key: 'origami', icon: Building2, color: 'text-blue-400', borderColor: 'border-blue-500/20', name: t.origami, desc: t.origamiDesc },
    { key: 'wati', icon: MessageSquare, color: 'text-green-400', borderColor: 'border-green-500/20', name: t.wati, desc: t.watiDesc },
    { key: 'notion', icon: FileText, color: 'text-slate-300', borderColor: 'border-slate-500/20', name: t.notion, desc: t.notionDesc },
  ];

  if (loading) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200">{t.connections}</h3>
          <span className="text-[10px] text-slate-500">{t.checking}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.key} className={`animate-pulse rounded-xl border ${c.borderColor} bg-white/[0.02] p-4`}>
              <div className="h-10 w-10 rounded-lg bg-slate-800" />
              <div className="mt-3 h-4 w-20 rounded bg-slate-800" />
              <div className="mt-1 h-3 w-16 rounded bg-slate-800/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-cc-id="automations.connections">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-200">{t.connections}</h3>
        {lastCheckedTime && (
          <span className="text-[10px] text-slate-500">{t.lastChecked}: {lastCheckedTime}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const service = data?.[c.key];
        const status = service?.status || 'unconfigured';
        const Icon = c.icon;
        const isTesting = testingCard === c.key;

        return (
          <div
            key={c.key}
            className={`group rounded-xl border ${c.borderColor} bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]`}
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] ${c.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              {statusDot(status)}
            </div>
            <h3 className="mt-3 text-sm font-medium text-slate-200">{c.name}</h3>
            <p className="text-[11px] text-slate-500">{c.desc}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-[10px] font-medium ${
                status === 'online' ? 'text-emerald-400' :
                status === 'configured' ? 'text-amber-400' :
                status === 'unconfigured' ? 'text-slate-500' : 'text-red-400'
              }`}>
                {statusLabel(status, t)}
              </span>
              <button
                onClick={() => handleTest(c.key)}
                disabled={isTesting}
                className="text-[10px] text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : t.testConnection}
              </button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
