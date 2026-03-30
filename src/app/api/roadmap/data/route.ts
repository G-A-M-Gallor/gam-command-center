import { NextResponse } from "next/server";
import { getMyTasks, type NotionTask } from "@/lib/notion/client";

// Public endpoint — returns roadmap data from Notion Tasks DB
// No auth required (read-only task names + statuses, not sensitive)

const LAYER_META: Record<string, { icon: string; name: string }> = {
  "0 Foundation":       { icon: "🏗️", name: "Foundation" },
  "1 Entity Engine":    { icon: "📦", name: "Entity Engine" },
  "2 Views & Relations":{ icon: "👁️", name: "Views & Relations" },
  "3 Business Module":  { icon: "💼", name: "Business Module" },
  "4 Platform":         { icon: "⚙️", name: "Platform" },
  "5 SaaS":             { icon: "☁️", name: "SaaS" },
};

function statusToPct(status: string): number {
  switch (status) {
    case "Done": return 100;
    case "Ready for QA": return 90;
    case "Dev Complete": return 75;
    case "In Progress": return 50;
    case "Blocked": return 0;
    case "Backlog": default: return 0;
  }
}

function statusToKey(status: string): string {
  switch (status) {
    case "Done": return "done";
    case "Ready for QA": return "done";
    case "Dev Complete": return "in-progress";
    case "In Progress": return "in-progress";
    case "Blocked": return "blocked";
    case "Backlog": default: return "backlog";
  }
}

interface RoadmapGoal {
  id: number;
  name: string;
  icon: string;
  status: string;
  _pct: number;
  types: RoadmapType[];
}

interface RoadmapType {
  id: number;
  name: string;
  status: string;
  _pct: number;
  tasks: RoadmapTask[];
}

interface RoadmapTask {
  id: string;
  name: string;
  status: string;
  _pct: number;
  priority: string;
  effort: string;
  owner: string;
  url: string;
}

function buildRoadmap(tasks: NotionTask[]) {
  // Group by Layer
  const layerGroups = new Map<string, NotionTask[]>();
  for (const _t of tasks) {
    const layer = t.layer || "Unassigned";
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(_t);
  }

  // Sort layers by key (0, 1, 2...)
  const sortedLayers = [...layerGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const goals: RoadmapGoal[] = sortedLayers.map(([layer, layerTasks], idx) => {
    const meta = LAYER_META[layer] ?? { icon: "📋", name: layer };

    // Group by Type within layer
    const typeGroups = new Map<string, NotionTask[]>();
    for (const _t of layerTasks) {
      const type = t.type || "Other";
      if (!typeGroups.has(type)) typeGroups.set(type, []);
      typeGroups.get(type)!.push(_t);
    }

    const types: RoadmapType[] = [...typeGroups.entries()].map(([type, typeTasks], tIdx) => {
      const rTasks: RoadmapTask[] = typeTasks.map(t => ({
        id: t.id,
        name: t.task,
        status: statusToKey(_t.status),
        _pct: statusToPct(_t.status),
        priority: t.priority,
        effort: t.effort,
        owner: t.owner,
        url: t.url,
      }));

      const typePct = rTasks.length > 0
        ? Math.round(rTasks.reduce((a, _t) => a + t._pct, 0) / rTasks.length)
        : 0;

      const doneCount = rTasks.filter(t => _t._pct === 100).length;
      const typeStatus = doneCount === rTasks.length ? "done"
        : rTasks.some(t => _t.status === "in-progress") ? "in-progress"
        : "backlog";

      return {
        id: (idx + 1) * 100 + tIdx + 1,
        name: type,
        status: typeStatus,
        _pct: typePct,
        tasks: rTasks,
      };
    });

    const goalPct = layerTasks.length > 0
      ? Math.round(layerTasks.reduce((a, _t) => a + statusToPct(_t.status), 0) / layerTasks.length)
      : 0;

    const doneCount = layerTasks.filter(t => _t.status === "Done").length;
    const goalStatus = doneCount === layerTasks.length ? "done"
      : layerTasks.some(t => _t.status === "In Progress") ? "in-progress"
      : "backlog";

    return {
      id: idx + 1,
      name: meta.name,
      icon: meta.icon,
      status: goalStatus,
      _pct: goalPct,
      types,
    };
  });

  return {
    goals,
    totalTasks: tasks.length,
    doneCount: tasks.filter(t => _t.status === "Done").length,
    inProgressCount: tasks.filter(t => _t.status === "In Progress").length,
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const tasks = await getMyTasks();
    const roadmap = buildRoadmap(tasks);
    return NextResponse.json(roadmap, {
      _headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch Notion data";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
