"use client";
// ===================================================
// GAM Command Center — Hierarchy Screen
// Tree view: Goals → Apps → Portfolios → Projects → Sprints → Tasks
// ===================================================

import { useState } from "react";
import { ChevronDown, ChevronRight, Target, Smartphone, FolderOpen, Folder, Zap, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniProgressBar } from "./ProgressBar";
import { useGoals, useApps, usePortfolios, useProjects, useSprints, useAllTasks } from "@/lib/pm-queries";
import { calcAppProgress, calcSprintVelocity } from "@/lib/pm-utils";
import { statusColor, priorityColor } from "@/lib/pm-utils";

interface HierarchyScreenProps {
  className?: string;
}

export function HierarchyScreen({ className }: HierarchyScreenProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const { data: goals = [] } = useGoals();
  const { data: apps = [] } = useApps();
  const { data: portfolios = [] } = usePortfolios();
  const { data: projects = [] } = useProjects();
  const { data: sprints = [] } = useSprints();
  const { data: tasks = [] } = useAllTasks();

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const isExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  return (
    <div className={cn("p-6", className)}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">היררכיה</h1>

        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalNode
              key={goal.id}
              goal={goal}
              apps={apps}
              portfolios={portfolios}
              projects={projects}
              sprints={sprints}
              tasks={tasks}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}

          {/* Unlinked items */}
          <UnlinkedSection
            apps={apps}
            portfolios={portfolios}
            projects={projects}
            sprints={sprints}
            tasks={tasks}
            isExpanded={isExpanded}
            toggleExpanded={toggleExpanded}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
          />
        </div>
      </div>

      {/* Task Details Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={tasks.find(t => t.id === selectedTask)!}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

function GoalNode({ goal, apps, portfolios, projects, sprints, tasks, isExpanded, toggleExpanded, selectedTask, setSelectedTask }: any) {
  const goalApps = apps.filter((app: any) => app.goal_notion_id === goal.notion_id);
  const nodeId = `goal-${goal.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        {goalApps.length > 0 && (
          <button
            onClick={() => toggleExpanded(nodeId)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded(nodeId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <Target className="w-5 h-5 text-purple-400" />
        <span className="text-white font-medium flex-1">{goal.title}</span>
        <span className={cn("px-2 py-1 text-xs rounded-full", statusColor(goal.status))}>
          {goal.status}
        </span>
      </div>

      {isExpanded(nodeId) && goalApps.length > 0 && (
        <div className="mr-6 space-y-2">
          {goalApps.map((app: any) => (
            <AppNode
              key={app.id}
              app={app}
              portfolios={portfolios}
              projects={projects}
              sprints={sprints}
              tasks={tasks}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppNode({ app, portfolios, projects, sprints, tasks, isExpanded, toggleExpanded, selectedTask, setSelectedTask }: any) {
  const appPortfolios = portfolios.filter((p: any) => p.app_notion_id === app.notion_id);
  const progress = calcAppProgress(app.notion_id, projects);
  const nodeId = `app-${app.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-slate-800/20 rounded-lg">
        {appPortfolios.length > 0 && (
          <button
            onClick={() => toggleExpanded(nodeId)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded(nodeId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <Smartphone className="w-4 h-4 text-blue-400" />
        <span className="text-white flex-1">{app.title}</span>
        <MiniProgressBar value={progress} />
      </div>

      {isExpanded(nodeId) && appPortfolios.length > 0 && (
        <div className="mr-6 space-y-2">
          {appPortfolios.map((portfolio: any) => (
            <PortfolioNode
              key={portfolio.id}
              portfolio={portfolio}
              projects={projects}
              sprints={sprints}
              tasks={tasks}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioNode({ portfolio, projects, sprints, tasks, isExpanded, toggleExpanded, selectedTask, setSelectedTask }: any) {
  const portfolioProjects = projects.filter((p: any) => p.portfolio_notion_id === portfolio.notion_id);
  const nodeId = `portfolio-${portfolio.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-slate-700/20 rounded-lg">
        {portfolioProjects.length > 0 && (
          <button
            onClick={() => toggleExpanded(nodeId)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded(nodeId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <FolderOpen className="w-4 h-4 text-amber-400" />
        <span className="text-white flex-1">{portfolio.title}</span>
        <span className="px-2 py-1 text-xs bg-slate-600/50 text-slate-300 rounded">
          {portfolio.category}
        </span>
        {portfolio.progress && <MiniProgressBar value={portfolio.progress} />}
      </div>

      {isExpanded(nodeId) && portfolioProjects.length > 0 && (
        <div className="mr-6 space-y-2">
          {portfolioProjects.map((project: any) => (
            <ProjectNode
              key={project.id}
              project={project}
              sprints={sprints}
              tasks={tasks}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectNode({ project, sprints, tasks, isExpanded, toggleExpanded, selectedTask, setSelectedTask }: any) {
  const projectSprints = sprints.filter((s: any) => s.project_notion_id === project.notion_id);
  const nodeId = `project-${project.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-slate-600/20 rounded-lg">
        {projectSprints.length > 0 && (
          <button
            onClick={() => toggleExpanded(nodeId)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded(nodeId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <Folder className="w-4 h-4 text-green-400" />
        <span className="text-white flex-1">{project.title}</span>
        {project.phase && (
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
            Phase {project.phase}
          </span>
        )}
        {project.progress && <MiniProgressBar value={project.progress} />}
      </div>

      {isExpanded(nodeId) && projectSprints.length > 0 && (
        <div className="mr-6 space-y-2">
          {projectSprints.map((sprint: any) => (
            <SprintNode
              key={sprint.id}
              sprint={sprint}
              tasks={tasks}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SprintNode({ sprint, tasks, isExpanded, toggleExpanded, selectedTask, setSelectedTask }: any) {
  const sprintTasks = tasks.filter((t: any) => t.sprint_notion_id === sprint.notion_id);
  const velocity = calcSprintVelocity(sprint);
  const nodeId = `sprint-${sprint.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-slate-500/20 rounded-lg">
        {sprintTasks.length > 0 && (
          <button
            onClick={() => toggleExpanded(nodeId)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded(nodeId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-white flex-1">{sprint.title}</span>
        <span className={cn("px-2 py-1 text-xs rounded-full", statusColor(sprint.status))}>
          {sprint.status}
        </span>
        <MiniProgressBar value={velocity} />
      </div>

      {isExpanded(nodeId) && sprintTasks.length > 0 && (
        <div className="mr-6 space-y-1">
          {sprintTasks.map((task: any) => (
            <TaskNode
              key={task.id}
              task={task}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskNode({ task, selectedTask, setSelectedTask }: any) {
  const isSelected = selectedTask === task.id;

  return (
    <button
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        "w-full flex items-center gap-2 p-2 rounded-lg text-right transition-colors",
        isSelected
          ? "bg-purple-500/20 border border-purple-500/30"
          : "bg-slate-400/10 hover:bg-slate-400/20"
      )}
    >
      <CheckSquare className="w-3 h-3 text-slate-400 flex-shrink-0" />
      <span className="text-white text-sm flex-1 truncate">{task.title}</span>
      <span className="text-xs text-slate-400 flex-shrink-0">{task.worker}</span>
      <span className={cn("px-1 py-0.5 text-xs rounded", priorityColor(task.priority))}>
        {task.priority}
      </span>
    </button>
  );
}

function UnlinkedSection({ apps, portfolios, projects, sprints, tasks, isExpanded, toggleExpanded, selectedTask, setSelectedTask }: any) {
  const unlinkedApps = apps.filter((app: any) => !app.goal_notion_id);
  const unlinkedPortfolios = portfolios.filter((p: any) => !p.app_notion_id);
  const unlinkedProjects = projects.filter((p: any) => !p.portfolio_notion_id);
  const unlinkedSprints = sprints.filter((s: any) => !s.project_notion_id);
  const unlinkedTasks = tasks.filter((t: any) => !t.sprint_notion_id);

  const hasUnlinked = unlinkedApps.length || unlinkedPortfolios.length || unlinkedProjects.length || unlinkedSprints.length || unlinkedTasks.length;

  if (!hasUnlinked) return null;

  return (
    <div className="space-y-2 pt-4 border-t border-slate-700">
      <h3 className="text-slate-400 font-medium">פריטים לא מקושרים</h3>

      {unlinkedTasks.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm text-slate-500">משימות</h4>
          {unlinkedTasks.slice(0, 10).map((task: any) => (
            <TaskNode
              key={task.id}
              task={task}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          ))}
          {unlinkedTasks.length > 10 && (
            <p className="text-xs text-slate-500 pr-2">ועוד {unlinkedTasks.length - 10}...</p>
          )}
        </div>
      )}
    </div>
  );
}

function TaskDrawer({ task, onClose }: any) {
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-96 bg-slate-900 border-r border-slate-700 shadow-2xl">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">פרטי משימה</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-medium text-white mb-2">{task.title}</h4>
          <div className="flex gap-2 mb-3">
            <span className={cn("px-2 py-1 text-xs rounded-full", statusColor(task.status))}>
              {task.status}
            </span>
            <span className={cn("px-2 py-1 text-xs rounded-full border", priorityColor(task.priority))}>
              {task.priority}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">עובד:</span>
            <span className="text-white">{task.worker || "לא משויך"}</span>
          </div>
          {task.due_date && (
            <div className="flex justify-between">
              <span className="text-slate-400">תאריך יעד:</span>
              <span className="text-white">{new Date(task.due_date).toLocaleDateString("he-IL")}</span>
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex justify-between">
              <span className="text-slate-400">שעות מוערכות:</span>
              <span className="text-white">{task.estimated_hours}h</span>
            </div>
          )}
        </div>

        {task.blocked_by && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
            <h5 className="text-sm font-medium text-red-300 mb-1">חסום על ידי:</h5>
            <p className="text-sm text-red-400">{task.blocked_by}</p>
          </div>
        )}

        {task.notes && (
          <div>
            <h5 className="text-sm font-medium text-slate-300 mb-2">הערות:</h5>
            <p className="text-sm text-slate-400 whitespace-pre-wrap">{task.notes}</p>
          </div>
        )}

        {task.definition_of_done && (
          <div>
            <h5 className="text-sm font-medium text-slate-300 mb-2">הגדרת סיום:</h5>
            <p className="text-sm text-slate-400 whitespace-pre-wrap">{task.definition_of_done}</p>
          </div>
        )}
      </div>
    </div>
  );
}