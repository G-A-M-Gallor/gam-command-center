// ===================================================
// App Launcher — Build Catalog
// Merges NAV_GROUPS + widgetRegistry into LauncherItem[]
// ===================================================

import { NAV_GROUPS } from "@/components/command-center/Sidebar";
import { widgetRegistry } from "@/components/command-center/widgets/WidgetRegistry";
import type { LauncherItem, LauncherCategory } from "./types";

// Map Sidebar group IDs to launcher categories
const GROUP_TO_CATEGORY: Record<string, LauncherCategory> = {
  core: "core",
  tools: "tools",
  system: "system",
};

import { Circle } from "lucide-react";

// Resolve icon component — pass through if valid, fallback to Circle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIcon(icon: any): React.ComponentType<{ className?: string }> {
  if (!icon) return Circle;
  return icon;
}

export function buildCatalog(): LauncherItem[] {
  const items: LauncherItem[] = [];
  const seenHrefs = new Set<string>();

  // 1. Pages from NAV_GROUPS
  for (const group of NAV_GROUPS) {
    const category = GROUP_TO_CATEGORY[group.id] || "tools";

    const processItem = (item: (typeof group.items)[number]) => {
      if ("type" in item && item.type === "folder") {
        // Process folder children
        if (item.children) {
          for (const child of item.children) {
            if (seenHrefs.has(child.href)) continue;
            seenHrefs.add(child.href);
            items.push({
              id: `page:${child.key}`,
              type: "page",
              href: child.href,
              icon: getIcon(child.icon),
              label: { he: child.key, en: child.key, ru: child.key }, // resolved at render via i18n
              description: undefined,
              status: child.status || "active",
              defaultLaunchMode: "full-page",
              category,
            });
          }
        }
        // Also add the folder parent as a page
        if (!seenHrefs.has(item.href)) {
          seenHrefs.add(item.href);
          items.push({
            id: `page:${item.key}`,
            type: "page",
            href: item.href,
            icon: getIcon(item.icon),
            label: { he: item.key, en: item.key, ru: item.key },
            description: undefined,
            status: item.status || "active",
            defaultLaunchMode: "full-page",
            category,
          });
        }
      } else {
        if (seenHrefs.has(item.href)) return;
        seenHrefs.add(item.href);
        items.push({
          id: `page:${item.key}`,
          type: "page",
          href: item.href,
          icon: getIcon(item.icon),
          label: { he: item.key, en: item.key, ru: item.key },
          description: undefined,
          status: item.status || "active",
          defaultLaunchMode: "full-page",
          category,
        });
      }
    };

    for (const item of group.items) {
      processItem(item);
    }
  }

  // 2. Widgets from widgetRegistry
  for (const widget of widgetRegistry) {
    items.push({
      id: `widget:${widget.id}`,
      type: "widget",
      icon: getIcon(widget.icon),
      label: widget.label,
      description: widget.description,
      status: widget.status,
      defaultLaunchMode:
        widget.panelMode === "side-panel"
          ? "side-panel"
          : widget.panelMode === "modal"
            ? "popup"
            : "popup",
      category: "widgets",
      widgetId: widget.id,
    });
  }

  return items;
}
