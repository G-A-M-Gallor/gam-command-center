"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type {
  StatusCount,
  TimelinePoint,
  EntityTypeCount,
} from "@/lib/supabase/hubQueries";

const STATUS_COLORS: Record<string, string> = {
  active: "#4ade80",
  draft: "#94a3b8",
  completed: "#60a5fa",
  archived: "#a78bfa",
  "on-hold": "#fbbf24",
  unknown: "#64748b",
};

const ENTITY_COLORS = [
  "#a78bfa", "#60a5fa", "#4ade80", "#fbbf24", "#f87171",
  "#38bdf8", "#c084fc", "#34d399", "#fb923c", "#e879f9",
];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    fontSize: 12,
    color: "#cbd5e1",
  },
  itemStyle: { color: "#cbd5e1" },
};

type ChartTab = "status" | "timeline" | "breakdown";

interface BiChartsProps {
  statusData: StatusCount[];
  timelineData: TimelinePoint[];
  entityData: EntityTypeCount[];
  timeRange: 7 | 30;
  onTimeRangeChange: (range: 7 | 30) => void;
  t: Record<string, string>;
}

export function BiCharts({
  statusData,
  timelineData,
  entityData,
  timeRange,
  onTimeRangeChange,
  t,
}: BiChartsProps) {
  const [tab, setTab] = useState<ChartTab>("status");

  const tabs: { id: ChartTab; label: string }[] = [
    { id: "status", label: t.statusDistribution },
    { id: "timeline", label: t.activityTimeline },
    { id: "breakdown", label: t.entityBreakdown },
  ];

  return (
    <div data-cc-id="hub.biCharts">
      {/* Tab bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex rounded-lg bg-slate-800/50 p-0.5">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                tab === tb.id
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab === "timeline" && (
          <div className="ms-auto flex rounded-lg bg-slate-800/50 p-0.5">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onTimeRangeChange(r)}
                className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                  timeRange === r
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {r === 7 ? t.last7Days : t.last30Days}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="h-[260px]">
        {tab === "status" && (
          <StatusDistributionChart data={statusData} />
        )}
        {tab === "timeline" && (
          <ActivityTimelineChart data={timelineData} />
        )}
        {tab === "breakdown" && (
          <EntityBreakdownChart data={entityData} />
        )}
      </div>
    </div>
  );
}

function StatusDistributionChart({ data }: { data: StatusCount[] }) {
  if (data.length === 0) {
    return <EmptyChart />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="count"
          nameKey="status"
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] || STATUS_COLORS.unknown}
            />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ActivityTimelineChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  const formatDate = (date: string | number | React.ReactNode) => {
    if (typeof date !== "string") return String(date ?? "");
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={formatDate}
        />
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="count"
          stroke="#a78bfa"
          fill="url(#activityGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EntityBreakdownChart({ data }: { data: EntityTypeCount[] }) {
  if (data.length === 0) {
    return <EmptyChart />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
        />
        <YAxis
          dataKey="entityType"
          type="category"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={ENTITY_COLORS[i % ENTITY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-600">
      No data available
    </div>
  );
}
