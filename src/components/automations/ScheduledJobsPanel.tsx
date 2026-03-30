'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, ExternalLink, RefreshCw, Loader2, Play, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ScheduledJobsPanelProps {
  t: Record<string, string>;
}

interface CronJob {
  name: string;
  nameKey: string;
  cron: string;
  scheduleKey: string;
  active: boolean;
}

interface CronHistoryEntry {
  jobname: string;
  status: string;
  start_time: string;
  end_time: string | null;
  return_message: string | null;
}

const CRON_JOBS: CronJob[] = [
  {
    name: 'clean-old-notifications',
    nameKey: 'cleanNotifications',
    cron: '0 0 * * *',
    scheduleKey: 'cleanNotificationsSchedule',
    active: true,
  },
  {
    name: 'weekly-recurring-tasks',
    nameKey: 'weeklyRecurringTasks',
    cron: '0 8 * * 0',
    scheduleKey: 'weeklyRecurringSchedule',
    active: true,
  },
  {
    name: 'origami-sync',
    nameKey: 'origamiSync',
    cron: '0 * * * *',
    scheduleKey: 'origamiSyncSchedule',
    active: true,
  },
];

// Map pg_cron job names to our display names
const CRON_NAME_MAP: Record<string, string> = {
  'daily-health-recalc': 'clean-old-notifications',
  'weekly-soft-delete-cleanup': 'weekly-recurring-tasks',
  'monthly-audit-cleanup': 'origami-sync',
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

const supabaseClient = createClient();

export function ScheduledJobsPanel({ t }: ScheduledJobsPanelProps) {
  const [showIframe, setShowIframe] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [cronHistory, setCronHistory] = useState<Record<string, CronHistoryEntry>>({});
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;

  // Fetch cron history on mount
  useEffect(() => {
    async function fetchCronHistory() {
      try {
        const res = await fetch('/api/automations/cron-history');
        const data = await res.json();
        if (data.jobs && Array.isArray(data.jobs)) {
          const map: Record<string, CronHistoryEntry> = {};
          for (const entry of data.jobs) {
            const displayName = CRON_NAME_MAP[entry.jobname] || entry.jobname;
            // Keep only the most recent run per job
            if (!map[displayName] || new Date(entry.start_time) > new Date(map[displayName].start_time)) {
              map[displayName] = entry;
            }
          }
          setCronHistory(map);
        }
      } catch {
        // Graceful — cron history is optional
      }
    }
    fetchCronHistory();
  }, []);

  const handleRunJob = useCallback(async (jobName: string) => {
    setRunningJob(jobName);

    // Map display job names to API job names
    const apiJobMap: Record<string, string> = {
      'origami-sync': 'origami-sync',
      'clean-old-notifications': 'health-check',
      'weekly-recurring-tasks': 'test-notification',
    };
    const apiJob = apiJobMap[jobName] || jobName;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      await fetch('/api/automations/run-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ job: apiJob }),
      });
    } catch {
      // Error handled by run-job route recording
    } finally {
      setRunningJob(null);
    }
  }, []);

  return (
    <div className="space-y-6" data-cc-id="automations.scheduledJobs">
      <div>
        <h3 className="text-sm font-semibold text-slate-200">{t.scheduledJobs}</h3>
        <p className="text-xs text-slate-500">{t.scheduledJobsDesc}</p>
      </div>
      {/* pg_cron section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">{t.pgCronJobs}</h3>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700/50">
          <table className="w-full text-xs" dir="ltr">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.jobName}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.schedule}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.status}</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">{t.lastRun || 'Last Run'}</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {CRON_JOBS.map((job, i) => {
                const isRunning = runningJob === job.name;
                const lastRun = cronHistory[job.name];
                return (
                  <tr key={job.name} className={`border-b border-slate-700/20 ${i % 2 === 0 ? 'bg-slate-800/10' : ''}`}>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-200">{t[job.nameKey]}</span>
                      <span className="ms-2 font-mono text-[10px] text-slate-500">{job.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-slate-300">{t[job.scheduleKey]}</span>
                      <span className="ms-2 font-mono text-[10px] text-slate-500">{job.cron}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        job.active
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${job.active ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {job.active ? t.active : t.paused}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {lastRun ? (
                        <span className="flex items-center gap-1.5 text-[10px]">
                          {lastRun.status === 'succeeded' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-400" />
                          )}
                          <span className="font-mono text-slate-500">{timeAgo(lastRun.start_time)}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">{t.lastRunNever || 'Never'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleRunJob(job.name)}
                        disabled={!!runningJob}
                        className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200 disabled:opacity-50"
                      >
                        {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        {t.runNow}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* n8n section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-200">{t.n8nWorkflows}</h3>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {n8nUrl ? t.n8nOpenDashboard : t.n8nConfigureUrl}
            </p>
            {n8nUrl && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowIframe(!showIframe)}
                  className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition-colors hover:bg-orange-500/20"
                >
                  {showIframe ? t.collapse || 'Close' : t.n8nOpenDashboard}
                </button>
                <a
                  href={n8nUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {showIframe && n8nUrl && (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-700/50">
              <div className="relative bg-slate-900" style={{ height: '500px' }}>
                <iframe
                  src={n8nUrl}
                  className="h-full w-full border-0"
                  title="n8n"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
