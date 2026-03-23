"use client";
// ===================================================
// GAM Command Center — PM Queries
// Supabase queries with React Query hooks + polling
// ===================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type {
  PmGoal,
  PmApp,
  PmPortfolio,
  PmProject,
  PmSprint,
  PmTask,
  PmTeamMember,
  TaskFilters,
} from "@/lib/pm-types";

// Different polling intervals for different data types
const STATIC_DATA_POLL = 5 * 60 * 1000; // 5 minutes for goals, apps, portfolios, team
const DYNAMIC_DATA_POLL = 60 * 1000; // 1 minute for projects, sprints, tasks

// ─── Goals ──────────────────────────────────────────

export function useGoals() {
  return useQuery<PmGoal[]>({
    queryKey: ["pm_goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_goals")
        .select("*")
        .is("deleted_at", null)
        .order("priority");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: STATIC_DATA_POLL,
  });
}

// ─── Apps ───────────────────────────────────────────

export function useApps() {
  return useQuery<PmApp[]>({
    queryKey: ["pm_apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_apps")
        .select("*")
        .is("deleted_at", null)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: STATIC_DATA_POLL,
  });
}

// ─── Portfolios ─────────────────────────────────────

export function usePortfolios() {
  return useQuery<PmPortfolio[]>({
    queryKey: ["pm_portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_portfolios")
        .select("*")
        .is("deleted_at", null)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: STATIC_DATA_POLL,
  });
}

// ─── Projects ───────────────────────────────────────

export function useProjects() {
  return useQuery<PmProject[]>({
    queryKey: ["pm_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_projects")
        .select("*")
        .is("deleted_at", null)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: DYNAMIC_DATA_POLL,
  });
}

// ─── Sprints ────────────────────────────────────────

export function useSprints() {
  return useQuery<PmSprint[]>({
    queryKey: ["pm_sprints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_sprints")
        .select("*, pm_projects(title, portfolio_notion_id)")
        .is("deleted_at", null)
        .order("sprint_number");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: DYNAMIC_DATA_POLL,
  });
}

export function useActiveSprints() {
  return useQuery<PmSprint[]>({
    queryKey: ["pm_sprints_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_sprints")
        .select("*, pm_projects(title, portfolio_notion_id)")
        .eq("status", "פעיל")
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: DYNAMIC_DATA_POLL,
  });
}

// ─── Tasks ──────────────────────────────────────────

export function useOpenTasks(filters?: TaskFilters) {
  return useQuery<PmTask[]>({
    queryKey: ["pm_tasks_open", filters],
    queryFn: async () => {
      let q = supabase
        .from("pm_tasks")
        .select("*")
        .is("deleted_at", null)
        .neq("status", "הושלם");

      if (filters?.status?.length) q = q.in("status", filters.status);
      if (filters?.worker) q = q.eq("worker", filters.worker);
      if (filters?.sprintId)
        q = q.eq("sprint_notion_id", filters.sprintId);
      if (filters?.priority) q = q.eq("priority", filters.priority);

      const { data, error } = await q.order("due_date", {
        ascending: true,
        nullsFirst: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: DYNAMIC_DATA_POLL,
  });
}

export function useAllTasks(filters?: TaskFilters) {
  return useQuery<PmTask[]>({
    queryKey: ["pm_tasks_all", filters],
    queryFn: async () => {
      let q = supabase
        .from("pm_tasks")
        .select("*")
        .is("deleted_at", null);

      if (filters?.status?.length) q = q.in("status", filters.status);
      if (filters?.worker) q = q.eq("worker", filters.worker);
      if (filters?.sprintId)
        q = q.eq("sprint_notion_id", filters.sprintId);
      if (filters?.priority) q = q.eq("priority", filters.priority);

      const { data, error } = await q.order("due_date", {
        ascending: true,
        nullsFirst: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: DYNAMIC_DATA_POLL,
  });
}

// ─── Team ───────────────────────────────────────────

export function useTeam() {
  return useQuery<PmTeamMember[]>({
    queryKey: ["pm_team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_team")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: STATIC_DATA_POLL,
  });
}

// ─── Quick Capture Mutation ─────────────────────────

export function useQuickCapture() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      title,
      sprintId,
      priority,
    }: {
      type: "משימה" | "פרויקט" | "רעיון";
      title: string;
      sprintId?: string;
      priority?: string;
    }) => {
      if (type === "משימה") {
        const { error } = await supabase.from("pm_tasks").insert({
          notion_id: `quick-${Date.now()}`,
          title,
          status: "טרם התחיל",
          priority: priority || "רגיל",
          sprint_notion_id: sprintId || null,
        });
        if (error) throw error;
      } else if (type === "פרויקט") {
        const { error } = await supabase.from("pm_projects").insert({
          notion_id: `quick-${Date.now()}`,
          title,
          status: "טרם התחיל",
          priority: "רגיל",
        });
        if (error) throw error;
      }
      // "רעיון" — saved as task with note
      else {
        const { error } = await supabase.from("pm_tasks").insert({
          notion_id: `quick-${Date.now()}`,
          title: `💡 ${title}`,
          status: "טרם התחיל",
          priority: "נמוך",
          notes: "רעיון — נוצר מ-Quick Capture",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pm_tasks_open"] });
      qc.invalidateQueries({ queryKey: ["pm_tasks_all"] });
      qc.invalidateQueries({ queryKey: ["pm_projects"] });
    },
  });
}
