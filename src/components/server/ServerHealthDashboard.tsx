"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server, Cpu, MemoryStick, HardDrive, _Clock, Activity,
  Container, Image, Network, Database, RefreshCw,
  AlertTriangle, CheckCircle2, Circle, Play, Square,
  TrendingUp, TrendingDown, Minus, _Monitor
} from "lucide-react";

interface SystemHealth {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  uptime: number;
  timestamp: number;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  cpu: number;
  memory: {
    usage: number;
    limit: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  ports: string[];
  created: string;
  uptime: string;
}

interface ServerHealthData {
  system: SystemHealth;
  docker: {
    containers: DockerContainer[];
    images: number;
    volumes: number;
    networks: number;
  };
  services: {
    name: string;
    status: 'running' | 'stopped' | 'error';
    pid?: number;
    port?: number;
    uptime?: string;
  }[];
}

interface ServerHealthDashboardProps {
  refreshInterval?: number;
  compact?: boolean;
  className?: string;
}

export function ServerHealthDashboard({
  refreshInterval = 30000, // 30 seconds
  _compact = false,
  className = ""
}: ServerHealthDashboardProps) {
  const [data, setData] = useState<ServerHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/server/health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const healthData = await response.json();
      setData(healthData);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch server health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHealth, refreshInterval]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string, state?: string) => {
    if (state && state.toLowerCase() === 'running') return 'text-emerald-400';
    if (status === 'running') return 'text-emerald-400';
    if (status === 'stopped') return 'text-slate-400';
    if (status === 'error') return 'text-red-400';
    return 'text-amber-400';
  };

  const getStatusIcon = (status: string, state?: string) => {
    if (state && state.toLowerCase() === 'running') return CheckCircle2;
    if (status === 'running') return CheckCircle2;
    if (status === 'stopped') return Square;
    if (status === 'error') return AlertTriangle;
    return Circle;
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-400 bg-red-500/10';
    if (usage >= 75) return 'text-amber-400 bg-amber-500/10';
    return 'text-emerald-400 bg-emerald-500/10';
  };

  const getUsageBarColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-400">טוען נתוני שרת...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32 text-red-400">
          <AlertTriangle className="w-6 h-6 ml-3" />
          <div className="text-center">
            <p className="font-medium">שגיאה בטעינת נתוני שרת</p>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <button
              onClick={fetchHealth}
              className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const SystemMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* CPU */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-slate-200">CPU</span>
          </div>
          <span className={`text-sm px-2 py-1 rounded ${getUsageColor(data.system.cpu.usage)}`}>
            {data.system.cpu.usage.toFixed(1)}%
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>שימוש</span>
            <span>{data.system.cpu.cores} ליבות</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageBarColor(data.system.cpu.usage)}`}
              style={{ width: `${Math.min(data.system.cpu.usage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500">
            Load: {data.system.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
          </div>
        </div>
      </div>

      {/* Memory */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MemoryStick className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-slate-200">זיכרון</span>
          </div>
          <span className={`text-sm px-2 py-1 rounded ${getUsageColor(data.system.memory.usage)}`}>
            {data.system.memory.usage.toFixed(1)}%
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatBytes(data.system.memory.used)}</span>
            <span>{formatBytes(data.system.memory.total)}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageBarColor(data.system.memory.usage)}`}
              style={{ width: `${Math.min(data.system.memory.usage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500">
            פנוי: {formatBytes(data.system.memory.free)}
          </div>
        </div>
      </div>

      {/* Disk */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-slate-200">אחסון</span>
          </div>
          <span className={`text-sm px-2 py-1 rounded ${getUsageColor(data.system.disk.usage)}`}>
            {data.system.disk.usage.toFixed(1)}%
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatBytes(data.system.disk.used)}</span>
            <span>{formatBytes(data.system.disk.total)}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageBarColor(data.system.disk.usage)}`}
              style={{ width: `${Math.min(data.system.disk.usage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500">
            פנוי: {formatBytes(data.system.disk.free)}
          </div>
        </div>
      </div>
    </div>
  );

  const DockerSection = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Container className="w-5 h-5 text-blue-400" />
          Docker Containers
        </h3>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            {data.docker.images} Images
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            {data.docker.volumes} Volumes
          </span>
          <span className="flex items-center gap-1">
            <Network className="w-4 h-4" />
            {data.docker.networks} Networks
          </span>
        </div>
      </div>

      {data.docker.containers.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
          <Container className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p>אין containers פעילים</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.docker.containers.map((container) => {
            const StatusIcon = getStatusIcon(container.status, container.state);
            return (
              <div key={container.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(container.status, container.state)}`} />
                    <div>
                      <h4 className="font-medium text-slate-200">{container.name}</h4>
                      <p className="text-sm text-slate-400">{container.image}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-slate-300">{container.state}</div>
                    <div className="text-xs text-slate-500">{container.uptime}</div>
                  </div>
                </div>

                {container.state.toLowerCase() === 'running' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-900/50 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-slate-300">CPU</span>
                      </div>
                      <div className="text-lg font-semibold text-slate-200">
                        {container.cpu.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MemoryStick className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-slate-300">זיכרון</span>
                      </div>
                      <div className="text-lg font-semibold text-slate-200">
                        {container.memory.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatBytes(container.memory.usage)} / {formatBytes(container.memory.limit)}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-slate-300">רשת</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        <div>RX: {formatBytes(container.network.rx)}</div>
                        <div>TX: {formatBytes(container.network.tx)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {container.ports.length > 0 && (
                  <div className="mt-3 pt-3 border-_t border-slate-700">
                    <div className="text-xs text-slate-400">
                      <span className="font-medium">Ports:</span> {container.ports.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <_Monitor className="w-6 h-6 text-blue-400" />
          מצב השרת
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            <_Clock className="w-4 h-4 inline ml-1" />
            Uptime: {formatUptime(data.system.uptime)}
          </div>
          {lastRefresh && (
            <div className="text-xs text-slate-500">
              עודכן לאחרונה: {lastRefresh.toLocaleTimeString('he-IL')}
            </div>
          )}
          <button
            onClick={fetchHealth}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            title="רענן נתונים"
          >
            <RefreshCw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      <SystemMetrics />
      <DockerSection />

      {/* Services */}
      {data.services.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            שירותים
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.services.map((service, index) => {
              const StatusIcon = getStatusIcon(service.status);
              return (
                <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${getStatusColor(service.status)}`} />
                      <span className="font-medium text-slate-200">{service.name}</span>
                    </div>
                    {service.port && (
                      <span className="text-xs text-slate-500">:{service.port}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}