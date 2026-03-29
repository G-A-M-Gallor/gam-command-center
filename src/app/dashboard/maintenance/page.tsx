"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  Download,
  Gauge,
  GitBranch,
  Play,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Wrench,
  FileText,
  Zap
} from "lucide-react";

interface CleanupReport {
  audit_timestamp: string;
  results: {
    [key: string]: {
      status: 'pass' | 'fail';
      count: number;
      threshold: number;
      details: string[];
    };
  };
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
  };
}

interface CronStatus {
  installed: boolean;
  nextRuns: {
    daily: string;
    weekly: string;
    monthly: string;
  };
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  status,
  trend,
  icon: Icon
}: {
  title: string;
  value: string | number;
  subtitle: string;
  status: 'good' | 'warning' | 'error';
  trend?: number;
  icon: React.ElementType;
}) {
  const statusColors = {
    good: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    error: 'border-red-500/20 bg-red-500/5 text-red-400'
  };

  return (
    <div className={`rounded-xl border ${statusColors[status]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5" />
            <p className="text-sm font-medium text-slate-300">{title}</p>
          </div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            <TrendingUp className={`h-3 w-3 ${trend > 0 ? 'rotate-0' : 'rotate-180'}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

// Action Button Component
function ActionButton({
  onClick,
  loading,
  icon: Icon,
  children,
  variant = 'primary'
}: {
  onClick: () => void;
  loading?: boolean;
  icon: React.ElementType;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variants = {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${variants[variant]} disabled:opacity-50`}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}

// Report Table Component
function ReportsTable({ reports }: { reports: CleanupReport[] }) {
  const [selectedReport, setSelectedReport] = useState<CleanupReport | null>(null);

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>אין דוחות זמינים</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">תאריך</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">סך בדיקות</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">עברו</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">נכשלו</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">סטטוס</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => {
              const date = new Date(report.audit_timestamp);
              const status = report.summary.failed === 0 ? 'good' : 'warning';

              return (
                <tr key={index} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {date.toLocaleDateString('he-IL')} {date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{report.summary.total_checks}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{report.summary.passed}</td>
                  <td className="px-4 py-3 text-sm text-red-400">{report.summary.failed}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      status === 'good'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {status === 'good' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {status === 'good' ? 'תקין' : 'זקוק לתשומת לב'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      צפה בפרטים
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">פירוט דוח ביקורת</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-4">
                {Object.entries(selectedReport.results).map(([check, result]) => (
                  <div key={check} className="border border-white/[0.06] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{check.replace(/_/g, ' ')}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'pass'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {result.count} / {result.threshold}
                      </span>
                    </div>
                    {result.details.length > 0 && (
                      <pre className="text-xs text-slate-400 bg-slate-800 p-2 rounded overflow-x-auto">
                        {result.details.slice(0, 10).join('\n')}
                        {result.details.length > 10 && '\n...'}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === 'he';

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<CleanupReport[]>([]);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load reports from .maintenance/reports/ directory
  const loadReports = async () => {
    try {
      // In a real implementation, this would fetch from the file system
      // For now, we'll simulate with localStorage or API
      const mockReports: CleanupReport[] = [
        {
          audit_timestamp: "2026-03-29T06:58:03Z",
          results: {
            unused_exports: { status: 'fail', count: 277, threshold: 10, details: ["next.config.ts:88", "playwright.config.ts:3"] },
            typescript_errors: { status: 'fail', count: 18, threshold: 0, details: ["Type error in src/app.tsx"] },
            eslint_issues: { status: 'fail', count: 73, threshold: 5, details: ["Warning in components/"] },
            tech_debt_markers: { status: 'pass', count: 2, threshold: 20, details: [] }
          },
          summary: { total_checks: 12, passed: 4, failed: 8 }
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  // Load cron status
  const loadCronStatus = async () => {
    try {
      const mockStatus: CronStatus = {
        installed: true,
        nextRuns: {
          daily: "2026-03-30T06:00:00Z",
          weekly: "2026-03-31T08:00:00Z",
          monthly: "2026-04-01T09:00:00Z"
        }
      };
      setCronStatus(mockStatus);
    } catch (error) {
      console.error('Failed to load cron status:', error);
    }
  };

  // Run manual audit
  const runAudit = async (withFix = false) => {
    setLoading(true);
    try {
      // In a real implementation, this would trigger the audit script
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate
      await loadReports();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadCronStatus();
  }, []);

  // Calculate stats from latest report
  const stats = useMemo(() => {
    if (reports.length === 0) {
      return {
        health: { value: 0, status: 'warning' as const },
        issues: { value: 0, status: 'good' as const },
        lastAudit: { value: 'אף פעם', status: 'warning' as const },
        nextScheduled: { value: 'לא מתוזמן', status: 'warning' as const }
      };
    }

    const latest = reports[0];
    const healthScore = Math.round((latest.summary.passed / latest.summary.total_checks) * 100);

    return {
      health: {
        value: `${healthScore}%`,
        status: (healthScore >= 80 ? 'good' : healthScore >= 60 ? 'warning' : 'error') as 'good' | 'warning' | 'error'
      },
      issues: {
        value: latest.summary.failed,
        status: (latest.summary.failed === 0 ? 'good' : latest.summary.failed <= 3 ? 'warning' : 'error') as 'good' | 'warning' | 'error'
      },
      lastAudit: {
        value: new Date(latest.audit_timestamp).toLocaleDateString('he-IL'),
        status: 'good' as const
      },
      nextScheduled: {
        value: cronStatus ? new Date(cronStatus.nextRuns.daily).toLocaleDateString('he-IL') : 'לא ידוע',
        status: (cronStatus?.installed ? 'good' : 'warning') as 'good' | 'warning' | 'error'
      }
    };
  }, [reports, cronStatus]);

  return (
    <div className={`min-h-screen bg-slate-950 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader pageKey="maintenance" />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="בריאות כללית"
            value={stats.health.value}
            subtitle="ציון איכות קוד"
            status={stats.health.status}
            icon={Gauge}
          />
          <StatsCard
            title="בעיות פעילות"
            value={stats.issues.value}
            subtitle="דורשות תשומת לב"
            status={stats.issues.status}
            icon={AlertTriangle}
          />
          <StatsCard
            title="ביקורת אחרונה"
            value={stats.lastAudit.value}
            subtitle="סריקה מלאה"
            status={stats.lastAudit.status}
            icon={Clock}
          />
          <StatsCard
            title="הבאה מתוזמנת"
            value={stats.nextScheduled.value}
            subtitle="ביקורת אוטומטית"
            status={stats.nextScheduled.status}
            icon={Activity}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <ActionButton
            onClick={() => runAudit(false)}
            loading={loading}
            icon={Play}
          >
            הרץ ביקורת
          </ActionButton>
          <ActionButton
            onClick={() => runAudit(true)}
            loading={loading}
            icon={Wrench}
            variant="secondary"
          >
            ביקורת + תיקון
          </ActionButton>
          <ActionButton
            onClick={loadReports}
            icon={RefreshCw}
            variant="secondary"
          >
            רענן נתונים
          </ActionButton>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-slate-900/50 rounded-xl border border-white/[0.06] p-6">
          <div className="border-b border-white/[0.06] mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">דוחות ביקורת</h2>
            <p className="text-sm text-slate-400">היסטוריה מלאה של בדיקות איכות קוד</p>
          </div>

          <ReportsTable reports={reports} />
        </div>

        {/* System Status */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-xl border border-white/[0.06] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              סטטוס מערכת
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Cron Jobs</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  cronStatus?.installed
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {cronStatus?.installed ? 'פעיל' : 'לא מותקן'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Git Hooks</span>
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                  פעיל
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">דוחות JSON</span>
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                  {reports.length} קבצים
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-white/[0.06] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              מידע נוסף
            </h3>
            <div className="space-y-3 text-sm text-slate-400">
              <p>עדכון אחרון: {lastRefresh.toLocaleString('he-IL')}</p>
              <p>תיקיית דוחות: <code className="bg-slate-800 px-1 rounded">.maintenance/reports/</code></p>
              <p>תיקיית לוגים: <code className="bg-slate-800 px-1 rounded">.maintenance/logs/</code></p>
              <div className="flex gap-2 mt-4">
                <button className="text-purple-400 hover:text-purple-300 text-xs">
                  📁 פתח תיקיה
                </button>
                <button className="text-purple-400 hover:text-purple-300 text-xs">
                  📄 צפה בקונפיגורציה
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}