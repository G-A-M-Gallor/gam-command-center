"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// ── Types ────────────────────────────────────────────────

export type AppStatus = "built" | "in-progress" | "planned" | "idea" | "hidden";
export type AppType = "app" | "shared-service" | "catalog" | "system";

export interface DisplayMode {
  menu: boolean;
  top_widget: boolean;
  side_widget: boolean;
  block: boolean;
  bottom_bar: boolean;
}

const DEFAULT_DISPLAY_MODE: DisplayMode = {
  menu: true,
  top_widget: false,
  side_widget: false,
  block: false,
  bottom_bar: false,
};

export interface AppRecord {
  id: string;
  slug: string;
  name_he: string;
  name_en: string | null;
  icon: string; // emoji
  type: AppType;
  status: AppStatus;
  priority: number | null;
  sort_order: number;
  route: string;
  depends_on: string[] | null;
  section_id: string;
  display_mode: DisplayMode;
}

export interface AppSection {
  id: string;
  slug: string;
  name_he: string;
  name_en: string | null;
  icon: string; // emoji
  sort_order: number;
  apps: AppRecord[];
}

export interface AppsRegistry {
  sections: AppSection[];
  allApps: AppRecord[];
  isLoading: boolean;
  error: Error | null;
}

// ── Fetch ────────────────────────────────────────────────

async function fetchAppsRegistry(): Promise<AppSection[]> {
  const { data: sections, error: secErr } = await supabase
    .from("vb_app_sections")
    .select("*")
    .order("sort_order");

  if (secErr) throw secErr;

  const { data: apps, error: appErr } = await supabase
    .from("vb_apps")
    .select("*")
    .order("sort_order");

  if (appErr) throw appErr;

  // Group apps into sections, normalize display_mode
  const sectionMap = new Map<string, AppRecord[]>();
  for (const app of (apps ?? [])) {
    const list = sectionMap.get(app.section_id) ?? [];
    const raw = app.display_mode as Partial<DisplayMode> | null;
    const record: AppRecord = {
      ...(app as AppRecord),
      display_mode: { ...DEFAULT_DISPLAY_MODE, ...raw },
    };
    list.push(record);
    sectionMap.set(app.section_id, list);
  }

  return (sections ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name_he: s.name_he,
    name_en: s.name_en,
    icon: s.icon,
    sort_order: s.sort_order,
    apps: sectionMap.get(s.id) ?? [],
  }));
}

// ── Hook ─────────────────────────────────────────────────

export function useAppsRegistry(): AppsRegistry {
  const { data, isLoading, error } = useQuery({
    queryKey: ["apps-registry"],
    queryFn: fetchAppsRegistry,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const sections = data ?? [];
  const allApps = sections.flatMap((s) => s.apps);

  return {
    sections,
    allApps,
    isLoading,
    error: error as Error | null,
  };
}

// ── Helpers ──────────────────────────────────────────────

/** Get the DB status for a nav item by matching its route */
export function getAppStatusByRoute(
  allApps: AppRecord[],
  route: string
): AppStatus | null {
  const app = allApps.find((a) => a.route === route);
  return app?.status ?? null;
}

/** Status badge label (Hebrew) */
export function getStatusBadge(status: AppStatus): string | null {
  switch (status) {
    case "in-progress": return "בפיתוח";
    case "planned": return "מתוכנן";
    case "idea": return "רעיון";
    case "hidden": return null;
    case "built": return null;
  }
}
