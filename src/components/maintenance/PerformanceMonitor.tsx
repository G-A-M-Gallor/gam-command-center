"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  Globe,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  _Clock,
  HardDrive,
  Cpu,
  Wifi,
  Package,
  AlertCircle,
  RefreshCw,
  MapPin,
  Users,
  Timer,
  BarChart3,
  Gauge
} from "lucide-react";

interface PageLoadMetrics {
  fcp: number;
  lcp: number;
  cls: number;
  inp: number;
  ttfb: number;
}

interface BundleMetrics {
  totalSize: number;
  chunks: Record<string, number>;
  heaviestComponents: Array<{
    name: string;
    size: number;
    loadTime: number;
  }>;
}

interface ApiMetrics {
  endpoints: Record<string, {
    avgResponseTime: number;
    lastResponseTime: number;
    errorRate: number;
    totalCalls: number;
  }>;
}

interface SystemMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
}

interface GeographicMetrics {
  israel: {
    users: number;
    avgPerformance: number;
    regions: Record<string, {
      users: number;
      performance: number;
    }>;
  };
  international: {
    users: number;
    avgPerformance: number;
    countries: Record<string, {
      users: number;
      performance: number;
    }>;
  };
}

interface ErrorMetrics {
  total: number;
  lastHour: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: string;
  }>;
}

interface PerformanceMetrics {
  timestamp: string;
  pageLoad: PageLoadMetrics;
  bundle: BundleMetrics;
  apis: ApiMetrics;
  system: SystemMetrics;
  geographic: GeographicMetrics;
  errors: ErrorMetrics;
}

interface PerformanceSummary {
  performanceScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  criticalIssues: string[];
  activeUsers: number;
}

interface PerformanceMonitorProps {
  isRtl: boolean;
}

function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  status,
  change,
  description
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  status: 'good' | 'warning' | 'critical';
  change?: number;
  description?: string;
}) {
  const statusConfig = {
    good: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' }
  };

  const config = statusConfig[status];

  return (
    <div className={`border rounded-lg p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.text}`} />
          <h4 className="font-medium text-white text-sm">{title}</h4>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${config.text}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const configs = {
    healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '✓ תקין', icon: Activity },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '⚠ אזהרה', icon: AlertTriangle },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', label: '✗ קריטי', icon: AlertCircle }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.bg} ${config.text}`}>
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}

function GeographicBreakdown({ geographic }: { geographic: GeographicMetrics }) {
  const israelRegions = Object.entries(geographic.israel.regions);
  const internationalCountries = Object.entries(geographic.international.countries);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          ישראל ({geographic.israel.users} משתמשים)
        </h4>
        <div className="space-y-2">
          {israelRegions.map(([region, data]) => (
            <div key={region} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
              <span className="text-sm text-slate-300">{region}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">{data.users} משתמשים</span>
                <span className={`${data.performance <= 1.5 ? 'text-emerald-400' : data.performance <= 2.5 ? 'text-amber-400' : 'text-red-400'}`}>
                  {data.performance.toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {internationalCountries.length > 0 && (
        <div>
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            בינלאומי ({geographic.international.users} משתמשים)
          </h4>
          <div className="space-y-2">
            {internationalCountries.map(([country, data]) => (
              <div key={country} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-sm text-slate-300">{country}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{data.users} משתמשים</span>
                  <span className={`${data.performance <= 2.0 ? 'text-emerald-400' : data.performance <= 3.0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {data.performance.toFixed(1)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BundleAnalysis({ bundle }: { bundle: BundleMetrics }) {
  const chunks = Object.entries(bundle.chunks).sort(([,a], [,b]) => b - a);
  const formatSize = (bytes: number) => (bytes / 1000000).toFixed(1);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          פילוח Bundle ({formatSize(bundle.totalSize)}MB)
        </h4>
        <div className="space-y-2">
          {chunks.map(([name, size]) => {
            const percentage = (size / bundle.totalSize) * 100;
            const isHeavy = percentage > 20;

            return (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{name}</span>
                  <span className={`${isHeavy ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formatSize(size)}MB ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${isHeavy ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-white mb-3">קומפוננטות כבדות</h4>
        <div className="space-y-2">
          {bundle.heaviestComponents.slice(0, 5).map((component) => (
            <div key={component.name} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
              <span className="text-sm text-slate-300">{component.name}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">{formatSize(component.size)}MB</span>
                <span className={`${component.loadTime <= 100 ? 'text-emerald-400' : component.loadTime <= 200 ? 'text-amber-400' : 'text-red-400'}`}>
                  {component.loadTime}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiPerformance({ apis }: { apis: ApiMetrics }) {
  const endpoints = Object.entries(apis.endpoints).sort(([,a], [,b]) => b.avgResponseTime - a.avgResponseTime);

  return (
    <div className="space-y-3">
      {endpoints.map(([endpoint, data]) => {
        const isSlow = data.avgResponseTime > 500;
        const hasErrors = data.errorRate > 0.05;

        return (
          <div key={endpoint} className={`p-3 rounded border ${isSlow || hasErrors ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-600/30 bg-slate-800/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{endpoint}</span>
              <div className="flex items-center gap-2">
                {hasErrors && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                {isSlow && <_Clock className="h-4 w-4 text-red-400" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">זמן תגובה ממוצע: </span>
                <span className={`${isSlow ? 'text-red-400' : 'text-emerald-400'}`}>
                  {data.avgResponseTime}ms
                </span>
              </div>
              <div>
                <span className="text-slate-400">שגיאות: </span>
                <span className={`${hasErrors ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(data.errorRate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">תגובה אחרונה: </span>
                <span className="text-slate-300">{data.lastResponseTime}ms</span>
              </div>
              <div>
                <span className="text-slate-400">קריאות: </span>
                <span className="text-slate-300">{data.totalCalls.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PerformanceMonitor({ isRtl }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = async (type: 'current' | 'summary' | 'history' = 'current') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/performance/metrics?type=${type}`);
      const result = await response.json();

      if (result.success) {
        if (type === 'current') {
          setMetrics(result.data);
          setLastUpdate(new Date());
        } else if (type === 'summary') {
          setSummary(result.data);
        } else if (type === 'history') {
          setHistory(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchMetrics('current');
    fetchMetrics('summary');
    fetchMetrics('history');
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics('current');
      fetchMetrics('summary');
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!metrics || !summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>טוען נתוני ביצועים...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`border rounded-lg p-4 ${summary.healthStatus === 'healthy' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white text-sm">ציון כללי</h3>
            </div>
            <HealthBadge status={summary.healthStatus} />
          </div>
          <p className={`text-3xl font-bold ${summary.performanceScore >= 80 ? 'text-emerald-400' : summary.performanceScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {summary.performanceScore}
          </p>
          <p className="text-xs text-slate-500">מתוך 100</p>
        </div>

        <MetricCard
          title="LCP (Largest Contentful Paint)"
          value={formatTime(metrics.pageLoad.lcp)}
          icon={Timer}
          status={metrics.pageLoad.lcp <= 2500 ? 'good' : metrics.pageLoad.lcp <= 4000 ? 'warning' : 'critical'}
          description="זמן טעינת התוכן הראשי"
        />

        <MetricCard
          title="זיכרון"
          value={metrics.system.memoryUsage.percentage.toFixed(1)}
          unit="%"
          icon={HardDrive}
          status={metrics.system.memoryUsage.percentage <= 70 ? 'good' : metrics.system.memoryUsage.percentage <= 85 ? 'warning' : 'critical'}
          description={`${(metrics.system.memoryUsage.used / 1000000).toFixed(0)}MB / ${(metrics.system.memoryUsage.total / 1000000).toFixed(0)}MB`}
        />

        <MetricCard
          title="משתמשים פעילים"
          value={summary.activeUsers}
          icon={Users}
          status="good"
          description="ישראל + בינלאומי"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchMetrics('current');
              fetchMetrics('summary');
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            רענן נתונים
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${autoRefresh ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            <Activity className="h-4 w-4" />
            {autoRefresh ? 'רענון אוטומטי פועל' : 'רענון אוטומטי כבוי'}
          </button>
        </div>

        {lastUpdate && (
          <div className="text-xs text-slate-500">
            עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}
          </div>
        )}
      </div>

      {/* Critical Issues */}
      {summary.criticalIssues.length > 0 && (
        <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
          <h3 className="font-medium text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            בעיות קריטיות ({summary.criticalIssues.length})
          </h3>
          <ul className="space-y-2">
            {summary.criticalIssues.map((issue, index) => (
              <li key={index} className="text-sm text-red-300 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Load Metrics */}
        <div className="border border-white/[0.06] rounded-lg p-6 bg-slate-800/50">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            מדדי טעינת דף
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <MetricCard
              title="FCP (First Contentful Paint)"
              value={formatTime(metrics.pageLoad.fcp)}
              icon={Timer}
              status={metrics.pageLoad.fcp <= 1800 ? 'good' : metrics.pageLoad.fcp <= 3000 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="INP (Interaction to Next Paint)"
              value={formatTime(metrics.pageLoad.inp)}
              icon={_Clock}
              status={metrics.pageLoad.inp <= 200 ? 'good' : metrics.pageLoad.inp <= 500 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="CLS (Cumulative Layout Shift)"
              value={metrics.pageLoad.cls.toFixed(3)}
              icon={BarChart3}
              status={metrics.pageLoad.cls <= 0.1 ? 'good' : metrics.pageLoad.cls <= 0.25 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="TTFB (Time To First Byte)"
              value={formatTime(metrics.pageLoad.ttfb)}
              icon={Server}
              status={metrics.pageLoad.ttfb <= 200 ? 'good' : metrics.pageLoad.ttfb <= 500 ? 'warning' : 'critical'}
            />
          </div>
        </div>

        {/* System Resources */}
        <div className="border border-white/[0.06] rounded-lg p-6 bg-slate-800/50">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-400" />
            משאבי מערכת
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <MetricCard
              title="CPU"
              value={metrics.system.cpuUsage.toFixed(1)}
              unit="%"
              icon={Cpu}
              status={metrics.system.cpuUsage <= 70 ? 'good' : metrics.system.cpuUsage <= 85 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="חיבורים פעילים"
              value={metrics.system.activeConnections}
              icon={Wifi}
              status="good"
            />
          </div>
        </div>

        {/* Bundle Analysis */}
        <div className="border border-white/[0.06] rounded-lg p-6 bg-slate-800/50">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            ניתוח Bundle
          </h3>
          <BundleAnalysis bundle={metrics.bundle} />
        </div>

        {/* Geographic Distribution */}
        <div className="border border-white/[0.06] rounded-lg p-6 bg-slate-800/50">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-400" />
            תפוצה גיאוגרפית
          </h3>
          <GeographicBreakdown geographic={metrics.geographic} />
        </div>

        {/* API Performance */}
        <div className="border border-white/[0.06] rounded-lg p-6 bg-slate-800/50 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            ביצועי API
          </h3>
          <ApiPerformance apis={metrics.apis} />
        </div>

        {/* Errors */}
        {metrics.errors.topErrors.length > 0 && (
          <div className="border border-red-500/20 rounded-lg p-6 bg-red-500/5 lg:col-span-2">
            <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              שגיאות אחרונות ({metrics.errors.total} כולל, {metrics.errors.lastHour} בשעה האחרונה)
            </h3>
            <div className="space-y-3">
              {metrics.errors.topErrors.map((error, index) => (
                <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm text-red-300 font-medium">{error.message}</span>
                    <span className="text-xs text-red-400">{error.count} פעמים</span>
                  </div>
                  <span className="text-xs text-red-500">
                    נראתה לאחרונה: {new Date(error.lastSeen).toLocaleString('he-IL')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}