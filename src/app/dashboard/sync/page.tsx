"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, _Clock, _ExternalLink, Play, Database, Zap, TrendingUp } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";

// ─── Types ──────────────────────────────────────────────

interface SyncConfig {
  id: string;
  name: string;
  source_type: string;
  target_table: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_records: number;
  last_sync_cursor: string | null;
}

interface SyncRun {
  id: string;
  config_id: string;
  status: 'running' | 'completed' | 'failed' | 'partial' | 'skipped';
  trigger_type: 'scheduled' | 'manual' | 'webhook' | 'retry';
  records_processed: number;
  records_failed: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
}

interface SyncUsage {
  month: string;
  total_runs: number;
  total_records: number;
  total_errors: number;
}

interface SyncData {
  configs: SyncConfig[];
  recentRuns: SyncRun[];
  usage: SyncUsage | null;
}

// ─── Status helpers ──────────────────────────────────────

const getStatusColor = (status: string | null) => {
  switch (status) {
    case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "failed": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "partial": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "running": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "skipped": return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
};

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case "completed": return CheckCircle2;
    case "failed": return AlertTriangle;
    case "partial": return Clock;
    case "running": return RefreshCw;
    default: return Activity;
  }
};

// ─── Main Component ───────────────────────────────────────

export default function SyncPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const [data, setData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/status');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/origami/sync', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      // Show result and refresh status
      await fetchSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [fetchSyncStatus]);

  // Load data on mount
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "זה עתה";
    if (diffMins < 60) return `${diffMins} דקות`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} שעות`;
    return `${Math.floor(diffMins / 1440)} ימים`;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <PageHeader pageKey="admin" />
        <div className="px-3 py-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <PageHeader pageKey="admin" />
        <div className="px-3 py-4 sm:p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">שגיאה: {error}</span>
              <button
                onClick={fetchSyncStatus}
                className="mr-auto text-red-400 hover:text-red-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const configs = data?.configs || [];
  const recentRuns = data?.recentRuns || [];
  const usage = data?.usage;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="admin" />

      <div className="px-3 py-4 sm:p-6 space-y-6">

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Active Configs */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-lg font-semibold text-slate-200">
                  {configs.filter(c => c.is_active).length}
                </div>
                <div className="text-xs text-slate-400">חיבורים פעילים</div>
              </div>
            </div>
          </div>

          {/* Recent Success Rate */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-lg font-semibold text-slate-200">
                  {recentRuns.length ?
                    `${Math.round((recentRuns.filter(r => r.status === 'completed').length / recentRuns.length) * 100)}%`
                    : "—"
                  }
                </div>
                <div className="text-xs text-slate-400">הצלחות (10 אחרונות)</div>
              </div>
            </div>
          </div>

          {/* Monthly Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-lg font-semibold text-slate-200">
                  {usage?.total_runs || 0}
                </div>
                <div className="text-xs text-slate-400">ריצות החודש</div>
              </div>
            </div>
          </div>

          {/* Manual Sync */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="flex items-center gap-2 w-full justify-center px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {syncing ? "מסנכרן..." : "סינכרון ידני"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Sync Configurations */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-200">הגדרות סינכרון</h2>
              <button
                onClick={fetchSyncStatus}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {configs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  אין הגדרות סינכרון
                </div>
              ) : (
                configs.map((config) => {
                  const StatusIcon = getStatusIcon(config.last_sync_status);
                  return (
                    <div key={config.id} className="border border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${config.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                          <span className="font-medium text-slate-200">{config.name}</span>
                          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                            {config.source_type}
                          </span>
                        </div>
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(config.last_sync_status).split(' ')[0]}`} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>→ {config.target_table}</span>
                        <span>{config.last_sync_records} רשומות</span>
                        <span>{formatRelativeTime(config.last_sync_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Runs */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">ריצות אחרונות</h2>

            <div className="space-y-2">
              {recentRuns.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  אין ריצות אחרונות
                </div>
              ) : (
                recentRuns.map((run) => {
                  const StatusIcon = getStatusIcon(run.status);
                  return (
                    <div key={run.id} className="flex items-center gap-3 p-3 border border-slate-700 rounded-lg">
                      <StatusIcon className={`w-4 h-4 ${run.status === 'running' ? 'animate-spin' : ''} ${getStatusColor(run.status).split(' ')[0]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(run.status)}`}>
                            {run.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {run.trigger_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                          <span>{run.records_processed} רשומות</span>
                          <span>{formatDuration(run.duration_ms)}</span>
                          <span>{formatRelativeTime(run.started_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Usage Statistics (if available) */}
        {usage && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">סטטיסטיקות חודשיות</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{usage.total_runs}</div>
                <div className="text-xs text-slate-400">ריצות בסה"כ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{usage.total_records.toLocaleString()}</div>
                <div className="text-xs text-slate-400">רשומות עובדו</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{usage.total_errors}</div>
                <div className="text-xs text-slate-400">שגיאות</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}