// ===================================================
// App Launcher — Data Queries
// Fetches recent records from Supabase for apps with data
// ===================================================

import { supabase } from "@/lib/supabaseClient";
import type { AppDataConfig } from "./appDataRegistry";

export interface RecentRecord {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  href: string;
  icon?: string;
}

/**
 * Fetch recent records for an app based on its data config.
 * Returns up to `limit` records sorted by timestamp descending.
 */
export async function fetchRecentRecords(
  config: AppDataConfig,
  limit = 20
): Promise<RecentRecord[]> {
  try {
    let query = supabase
      .from(config.table)
      .select("*")
      .order(config.timestampField, { ascending: false })
      .limit(limit);

    if (config.filterColumn && config.filterValue) {
      query = query.eq(config.filterColumn, config.filterValue);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as any[]).map((row) => ({
      id: String(row.id ?? ""),
      title: String(row[config.titleField] ?? "ללא כותרת"),
      subtitle: config.subtitleField ? String(row[config.subtitleField] ?? "") : "",
      timestamp: String(row[config.timestampField] ?? ""),
      href: config.href(String(row.id ?? "")),
      icon: config.icon,
    }));
  } catch {
    return [];
  }
}
