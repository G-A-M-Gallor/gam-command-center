"use client";
// ===================================================
// GAM Command Center — Tasks Screen
// Full table with filters + quick add
// ===================================================

import { useState, useMemo } from "react";
import { Search, Filter, _Plus, Calendar, _Clock, User, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllTasks, useActiveSprints, useQuickCapture } from "@/lib/pm-queries";
import { statusColor, priorityColor, sortByPriority } from "@/lib/pm-utils";
import { TASK_STATUSES, PRIORITIES, WORKERS, type TaskFilters } from "@/lib/pm-types";

interface TasksScreenProps {
  className?: string;
}

export function TasksScreen({ className }: TasksScreenProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: allTasks = [] } = useAllTasks(filters);
  const { data: activeSprints = [] } = useActiveSprints();

  // Create sprint lookup map for O(1) access
  const sprintMap = useMemo(
    () => new Map(activeSprints.map(s => [s.notion_id, s])),
    [activeSprints]
  );

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = allTasks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.worker?.toLowerCase().includes(query) ||
          task.notes?.toLowerCase().includes(query)
      );
    }

    return sortByPriority(filtered);
  }, [allTasks, searchQuery]);

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-white">משימות</h1>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          הוסף משימה
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="חיפוש משימות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              dir="rtl"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status?.[0] || ""}
            onChange={(e) =>
              updateFilter("status", e.target.value ? [e.target.value] : undefined)
            }
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            dir="rtl"
          >
            <option value="">כל הסטטוסים</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Worker Filter */}
          <select
            value={filters.worker || ""}
            onChange={(e) => updateFilter("worker", e.target.value || undefined)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            dir="rtl"
          >
            <option value="">כל העובדים</option>
            {WORKERS.map((worker) => (
              <option key={worker} value={worker}>
                {worker}
              </option>
            ))}
          </select>

          {/* Sprint Filter */}
          <select
            value={filters.sprintId || ""}
            onChange={(e) => updateFilter("sprintId", e.target.value || undefined)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            dir="rtl"
          >
            <option value="">כל הספרינטים</option>
            {activeSprints.map((sprint) => (
              <option key={sprint.notion_id} value={sprint.notion_id}>
                {sprint.title}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Summary */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            מציג {filteredTasks.length} מתוך {allTasks.length} משימות
          </span>
          {(filters.status || filters.worker || filters.sprintId || searchQuery) && (
            <button
              onClick={() => {
                setFilters({});
                setSearchQuery("");
              }}
              className="text-purple-400 hover:text-purple-300"
            >
              נקה פילטרים
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">לא נמצאו משימות</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table w-full">
              <thead className="bg-slate-700/50 border-b border-slate-600">
                <tr>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">משימה</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">סטטוס</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">עדיפות</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">עובד</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">ספרינט</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">תאריך יעד</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-300">שעות</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => {
                  const sprint = sprintMap.get(task.sprint_notion_id!);
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        "border-b border-slate-700 hover:bg-slate-700/30",
                        index % 2 === 0 ? "bg-slate-800/20" : ""
                      )}
                    >
                      <td className="p-4">
                        <div className="space-y-1">
                          <h4 className="text-white font-medium line-clamp-2">{task.title}</h4>
                          {task.blocked_by && (
                            <p className="text-xs text-red-400">חסום: {task.blocked_by}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 text-xs rounded-full", statusColor(task.status))}>
                          {task.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 text-xs rounded-full border", priorityColor(task.priority))}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{task.worker || "—"}</td>
                      <td className="p-4 text-slate-300">{sprint?.title || "—"}</td>
                      <td className="p-4">
                        {task.due_date ? (
                          <span className="text-slate-300">
                            {new Date(task.due_date).toLocaleDateString("he-IL")}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">
                        {task.estimated_hours ? `${task.estimated_hours}h` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {filteredTasks.map((task) => {
                const sprint = sprintMap.get(task.sprint_notion_id!);
                return (
                  <div
                    key={task.id}
                    className="bg-slate-700/30 rounded-lg border border-slate-600 p-4"
                  >
                    <h4 className="text-white font-medium mb-2 line-clamp-2">{task.title}</h4>

                    <div className="flex gap-2 mb-3">
                      <span className={cn("px-2 py-1 text-xs rounded-full", statusColor(task.status))}>
                        {task.status}
                      </span>
                      <span className={cn("px-2 py-1 text-xs rounded-full border", priorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-3 h-3" />
                        <span>{task.worker || "לא משויך"}</span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.due_date).toLocaleDateString("he-IL")}</span>
                        </div>
                      )}
                      {sprint && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Flag className="w-3 h-3" />
                          <span className="truncate">{sprint.title}</span>
                        </div>
                      )}
                      {task.estimated_hours && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <_Clock className="w-3 h-3" />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      )}
                    </div>

                    {task.blocked_by && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                        חסום: {task.blocked_by}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
}

function QuickAddModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("רגיל");
  const [worker, setWorker] = useState("");
  const [sprintId, setSprintId] = useState("");

  const { data: activeSprints = [] } = useActiveSprints();
  const { mutate: addTask, isPending } = useQuickCapture();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask(
      {
        type: "משימה",
        title: title.trim(),
        priority,
        sprintId: sprintId || undefined
      },
      {
        onSuccess: () => {
          setTitle("");
          setPriority("רגיל");
          setWorker("");
          setSprintId("");
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">הוסף משימה חדשה</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">שם המשימה</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="תאר את המשימה..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              dir="rtl"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-2">עדיפות</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                dir="rtl"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">ספרינט</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                dir="rtl"
              >
                <option value="">ללא ספרינט</option>
                {activeSprints.map((s) => (
                  <option key={s.notion_id} value={s.notion_id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "שומר..." : "צור משימה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}