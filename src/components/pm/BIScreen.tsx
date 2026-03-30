"use client";
// ===================================================
// GAM Command Center — BI Screen
// 4 charts: Apps Progress, Workers Load, Tasks Status, Goals Progress
// ===================================================

import { useMemo } from "react";
import { BarChart3, PieChart, Target, Users, Briefcase, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, ResponsiveContainer } from "recharts";
import { useApps, useProjects, useAllTasks, useGoals } from "@/lib/pm-queries";
import { calcAppProgress, progressColor } from "@/lib/pm-utils";
import { WORKERS, TASK_STATUSES } from "@/lib/pm-types";

interface BIScreenProps {
  className?: string;
}

export function BIScreen({ className }: BIScreenProps) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">BI Analytics</h1>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppsProgressChart />
        <WorkersLoadChart />
        <TasksStatusChart />
        <GoalsProgressChart />
      </div>
    </div>
  );
}

function AppsProgressChart() {
  const { data: apps = [] } = useApps();
  const { data: projects = [] } = useProjects();

  const chartData = useMemo(() => {
    return apps.map((app) => ({
      name: app.title || "Unknown",
      progress: calcAppProgress(app.notion_id, projects),
      status: app.status,
    })).filter(item => item.name !== "Unknown");
  }, [apps, projects]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-medium text-white">התקדמות Apps</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          אין נתוני Apps
        </div>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getProgressBarColor(entry.progress)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function WorkersLoadChart() {
  const { data: tasks = [] } = useAllTasks();

  const chartData = useMemo(() => {
    const workerCounts: Array<{name: string, openTasks: number, totalTasks: number}> = WORKERS.map(worker => ({
      name: worker,
      openTasks: tasks.filter(t => t.worker === worker && _t.status !== "הושלם").length,
      totalTasks: tasks.filter(t => _t.worker === worker).length,
    }));

    // Add unassigned tasks
    const unassignedOpen = tasks.filter(t => !t.worker && _t.status !== "הושלם").length;
    const unassignedTotal = tasks.filter(t => !_t.worker).length;

    if (unassignedOpen > 0 || unassignedTotal > 0) {
      workerCounts.push({
        name: "לא משויך",
        openTasks: unassignedOpen,
        totalTasks: unassignedTotal,
      });
    }

    return workerCounts.filter(w => w.totalTasks > 0);
  }, [tasks]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-medium text-white">עומס עובדים</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          אין נתוני משימות
        </div>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Bar dataKey="openTasks" fill="#f59e0b" name="משימות פתוחות" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TasksStatusChart() {
  const { data: tasks = [] } = useAllTasks();

  const chartData = useMemo(() => {
    const statusCounts = TASK_STATUSES.map(status => ({
      name: status,
      value: tasks.filter(t => _t.status === status).length,
      color: getStatusPieColor(status),
    })).filter(item => item.value > 0);

    return statusCounts;
  }, [tasks]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckSquare className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-medium text-white">סטטוס משימות</h3>
        <span className="text-sm text-slate-400">({total} סה״כ)</span>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          אין משימות
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="h-64 flex-1" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsPieChart
                  data={chartData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300">{item.name}</span>
                <span className="text-slate-400">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GoalsProgressChart() {
  const { data: goals = [] } = useGoals();

  const chartData = useMemo(() => {
    return goals.map((goal) => ({
      name: goal.title || "Unknown",
      current: goal.kpi_current || 0,
      target: parseFloat(goal.kpi_target?.match(/\d+/)?.[0] || "0"),
      unit: goal.kpi_unit || "",
      progress: goal.kpi_target && goal.kpi_current
        ? Math.round((goal.kpi_current / parseFloat(goal.kpi_target.match(/\d+/)?.[0] || "1")) * 100)
        : 0,
    })).filter(item => item.name !== "Unknown" && item.target > 0);
  }, [goals]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-white">התקדמות מטרות</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          אין נתוני מטרות עם KPI
        </div>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getProgressBarColor(entry.progress)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getProgressBarColor(progress: number): string {
  if (progress >= 80) return "#10b981";  // emerald-500
  if (progress >= 50) return "#f59e0b";  // amber-500
  return "#3b82f6";  // blue-500
}

function getStatusPieColor(status: string): string {
  switch (status) {
    case "הושלם": return "#10b981";  // emerald-500
    case "בהתקדמות": return "#3b82f6";  // blue-500
    case "בבדיקה": return "#8b5cf6";  // purple-500
    case "חסום": return "#ef4444";  // red-500
    case "טרם התחיל": return "#64748b";  // slate-500
    default: return "#64748b";
  }
}