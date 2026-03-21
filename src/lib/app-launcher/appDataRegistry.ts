// ===================================================
// App Launcher — App Data Registry
// Maps app IDs to their Supabase data source config
// Apps not in this registry use visit history fallback
// ===================================================

export interface AppDataConfig {
  table: string;
  titleField: string;
  subtitleField?: string;
  timestampField: string;
  filterColumn?: string;
  filterValue?: string;
  href: (id: string) => string;
  icon?: string; // emoji fallback
}

/**
 * Registry of apps that have Supabase data.
 * Key = page key from catalog (e.g., "entities", "editor", "comms")
 */
export const APP_DATA_REGISTRY: Record<string, AppDataConfig> = {
  entities: {
    table: "vb_records",
    titleField: "title",
    subtitleField: "entity_type",
    timestampField: "updated_at",
    href: (id) => `/dashboard/entities?id=${id}`,
    icon: "📋",
  },
  editor: {
    table: "vb_records",
    titleField: "title",
    subtitleField: "entity_type",
    timestampField: "updated_at",
    filterColumn: "entity_type",
    filterValue: "doc",
    href: (id) => `/dashboard/editor/${id}`,
    icon: "📝",
  },
  comms: {
    table: "comm_messages",
    titleField: "subject",
    subtitleField: "channel",
    timestampField: "created_at",
    href: (id) => `/dashboard/comms?id=${id}`,
    icon: "💬",
  },
  documents: {
    table: "doc_submissions",
    titleField: "title",
    subtitleField: "status",
    timestampField: "created_at",
    href: (id) => `/dashboard/documents/${id}`,
    icon: "📄",
  },
  wiki: {
    table: "vb_records",
    titleField: "title",
    subtitleField: "entity_type",
    timestampField: "updated_at",
    filterColumn: "entity_type",
    filterValue: "wiki",
    href: (id) => `/dashboard/wiki/${id}`,
    icon: "📖",
  },
  grid: {
    table: "grid_sheets",
    titleField: "title",
    subtitleField: "description",
    timestampField: "updated_at",
    href: (id) => `/dashboard/grid?sheet=${id}`,
    icon: "📊",
  },
  feeds: {
    table: "rss_articles",
    titleField: "title",
    subtitleField: "feed_name",
    timestampField: "published_at",
    href: (id) => `/dashboard/feeds?article=${id}`,
    icon: "📰",
  },
  "story-map": {
    table: "story_contexts",
    titleField: "title",
    subtitleField: "description",
    timestampField: "updated_at",
    href: (id) => `/dashboard/story-map?ctx=${id}`,
    icon: "🗺️",
  },
};

/** Check if an app has a Supabase data source */
export function hasAppData(pageKey: string): boolean {
  return pageKey in APP_DATA_REGISTRY;
}
