"use client";
// ===================================================
// GAM Command Center — Home Screen
// Stats + Active Sprint + Risks + Urgent Tasks
// ===================================================

import { Activity, Clock, Target, AlertTriangle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { RiskPanel } from "./RiskPanel";
import { useActiveSprints, useOpenTasks, useApps, useProjects } from "@/lib/pm-queries";
import { buildPMContext, calcAppProgress, calcSprintVelocity } from "@/lib/pm-utils";
import { statusColor, priorityColor } from "@/lib/pm-utils";
import type { TabId } from "./TabNav";

interface HomeScreenProps {
  onNavigate: (tab: TabId) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { data: activeSprints = [] } = useActiveSprints();
  const { data: openTasks = [] } = useOpenTasks();
  const { data: apps = [] } = useApps();
  const { data: projects = [] } = useProjects();

  const context = buildPMContext(openTasks, activeSprints);
  const activeSprint = activeSprints[0]; // First active sprint

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Sprint Card */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="font-medium text-white">Sprint פעיל</h3>
          </div>
          {activeSprint ? (
            <div className="space-y-3">
              <h4 className="text-slate-300 font-medium">{activeSprint.title}</h4>
              <ProgressBar
                value={calcSprintVelocity(activeSprint)}
                size="sm"
                showLabel={true}
                label="התקדמות"
              />
              <div className="text-sm text-slate-400">
                {activeSprint.tasks_done || 0} מתוך {activeSprint.tasks_total || 0} משימות
              </div>
            </div>
          ) : (
            <p className="text-slate-400">אין ספרינט פעיל</p>
          )}
        </div>

        {/* Open Tasks Card */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="font-medium text-white">משימות פתוחות</h3>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">{openTasks.length}</div>
            <div className="flex gap-2">
              {context.blockedTasks.length > 0 && (
                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                  {context.blockedTasks.length} חסום
                </span>
              )}
              {context.urgentTasks.length > 0 && (
                <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                  {context.urgentTasks.length} דחוף
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Apps Progress Card */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-medium text-white">Apps</h3>
          </div>
          <div className="space-y-2">
            {apps.slice(0, 3).map((app) => {
              const progress = calcAppProgress(app.notion_id, projects);
              return (
                <div key={app.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 truncate">
                    {app.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-left">
                      {progress}%
                    </span>
                  </div>
                </div>
              );
            })}
            {apps.length === 0 && (
              <p className="text-slate-400 text-sm">אין Apps</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risks Panel */}
        <RiskPanel risks={context.risks} />

        {/* Urgent Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-medium text-white">משימות דחופות</h3>
              <span className="text-sm text-slate-400">
                ({context.urgentTasks.length})
              </span>
            </div>
            <button
              onClick={() => onNavigate("tasks")}
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
            >
              <span>כל המשימות</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {context.urgentTasks.length === 0 ? (
              <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700 text-center">
                <p className="text-slate-400">✅ אין משימות דחופות</p>
              </div>
            ) : (
              context.urgentTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium flex-1 line-clamp-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0 mr-3">
                      <span className={cn("px-2 py-1 text-xs rounded-full", statusColor(task.status))}>
                        {task.status}
                      </span>
                      <span className={cn("px-2 py-1 text-xs rounded-full border", priorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{task.worker || "לא משויך"}</span>
                    {task.due_date && (
                      <span className="text-amber-400">
                        📅 {new Date(task.due_date).toLocaleDateString("he-IL")}
                      </span>
                    )}
                    {task.estimated_hours && (
                      <span>⏱️ {task.estimated_hours}h</span>
                    )}
                  </div>
                  {task.blocked_by && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                      חסום: {task.blocked_by}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}