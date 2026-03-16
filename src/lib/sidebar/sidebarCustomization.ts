/**
 * Sidebar Customization — Pure logic + localStorage persistence
 * Handles: item reorder, custom folders, hide/show, usage tracking
 */

import type { NavGroup, NavEntry, NavItem, NavFolder } from "@/components/command-center/Sidebar";

// ─── Types ─────────────────────────────────────────────────

export interface CustomFolder {
  id: string;
  name: string;
  groupId: string;
  itemKeys: string[];
}

export interface SidebarCustomization {
  /** Ordered list of item keys per group */
  itemOrder: Record<string, string[]>;
  /** User-created folders */
  customFolders: CustomFolder[];
  /** Hidden item keys */
  hiddenItems: string[];
  /** Usage counts per item key */
  usageCounts: Record<string, number>;
  /** Auto-sort by usage enabled */
  autoSortByUsage: boolean;
}

export interface DisplayGroup {
  id: string;
  labelKey: string;
  isCustomFolder?: boolean;
  customFolderName?: string;
  items: NavEntry[];
}

// ─── Constants ─────────────────────────────────────────────

const STORAGE_KEY = "cc-sidebar-custom";
const EVENT_NAME = "cc-sidebar-custom-change";

function defaultCustomization(): SidebarCustomization {
  return {
    itemOrder: {},
    customFolders: [],
    hiddenItems: [],
    usageCounts: {},
    autoSortByUsage: false,
  };
}

// ─── Persistence ───────────────────────────────────────────

export function loadCustomization(): SidebarCustomization {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultCustomization(), ...parsed };
    }
  } catch {}
  return defaultCustomization();
}

export function saveCustomization(data: SidebarCustomization): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {}
}

export { EVENT_NAME as CUSTOMIZATION_EVENT };

// ─── Helpers ───────────────────────────────────────────────

function isFolder(entry: NavEntry): entry is NavFolder {
  return "type" in entry && entry.type === "folder";
}

/** Get all flat item keys from a NavGroup (including folder children) */
function flatKeys(group: NavGroup): string[] {
  const keys: string[] = [];
  for (const entry of group.items) {
    keys.push(entry.key);
    if (isFolder(entry)) {
      for (const child of entry.children) keys.push(child.key);
    }
  }
  return keys;
}

/** Find an entry by key across all groups */
function findEntry(navGroups: NavGroup[], key: string): NavEntry | NavItem | undefined {
  for (const group of navGroups) {
    for (const entry of group.items) {
      if (entry.key === key) return entry;
      if (isFolder(entry)) {
        for (const child of entry.children) {
          if (child.key === key) return child;
        }
      }
    }
  }
  return undefined;
}

// ─── Build Display Groups ──────────────────────────────────

export function buildDisplayGroups(
  navGroups: NavGroup[],
  customization: SidebarCustomization,
  filter: string,
  favHrefs: Set<string>,
  permissions: { visiblePages?: string[] | null },
  editMode: boolean,
): DisplayGroup[] {
  const { itemOrder, customFolders, hiddenItems, usageCounts, autoSortByUsage } = customization;
  const hiddenSet = new Set(hiddenItems);

  const result: DisplayGroup[] = [];

  for (const group of navGroups) {
    // Get all flat items for this group (respecting built-in folders)
    const allEntries: NavEntry[] = [];
    const entryMap = new Map<string, NavEntry>();

    for (const entry of group.items) {
      entryMap.set(entry.key, entry);
      if (isFolder(entry)) {
        for (const child of entry.children) {
          entryMap.set(child.key, child);
        }
      }
    }

    // Determine item order for this group
    const savedOrder = itemOrder[group.id];
    if (savedOrder && savedOrder.length > 0) {
      // Use saved order, append any new items not in saved order
      const seen = new Set<string>();
      for (const key of savedOrder) {
        if (entryMap.has(key) && !seen.has(key)) {
          allEntries.push(entryMap.get(key)!);
          seen.add(key);
        }
      }
      // Append new items not in saved order
      for (const entry of group.items) {
        if (!seen.has(entry.key)) {
          allEntries.push(entry);
          seen.add(entry.key);
        }
        if (isFolder(entry)) {
          for (const child of entry.children) {
            if (!seen.has(child.key)) {
              allEntries.push(child);
              seen.add(child.key);
            }
          }
        }
      }
    } else {
      // Default order — flatten folders into items for reordering
      for (const entry of group.items) {
        allEntries.push(entry);
      }
    }

    // Auto-sort by usage if enabled
    let sorted = [...allEntries];
    if (autoSortByUsage) {
      sorted.sort((a, b) => (usageCounts[b.key] ?? 0) - (usageCounts[a.key] ?? 0));
    }

    // Filter entries
    const filtered = sorted.filter((entry) => {
      // Permissions check
      if (permissions.visiblePages && !permissions.visiblePages.includes(entry.key)) return false;
      // Hidden check — show in edit mode (faded), hide otherwise
      if (hiddenSet.has(entry.key) && !editMode) return false;
      // Filter tabs
      if (filter === "active" && entry.status !== "active") return false;
      if (filter === "coming-soon" && entry.status !== "coming-soon") return false;
      if (filter === "favorites") {
        if (isFolder(entry)) return entry.children.some((c) => favHrefs.has(c.href)) || favHrefs.has(entry.href);
        return favHrefs.has((entry as NavItem).href);
      }
      return true;
    });

    // Filter folder children too
    const finalItems = filtered.map((entry) => {
      if (isFolder(entry)) {
        const filteredChildren = entry.children.filter((child) => {
          if (permissions.visiblePages && !permissions.visiblePages.includes(child.key)) return false;
          if (hiddenSet.has(child.key) && !editMode) return false;
          if (filter === "active" && child.status !== "active") return false;
          if (filter === "coming-soon" && child.status !== "coming-soon") return false;
          if (filter === "favorites") return favHrefs.has(child.href);
          return true;
        });
        return { ...entry, children: filteredChildren } as NavFolder;
      }
      return entry;
    });

    if (finalItems.length > 0) {
      result.push({
        id: group.id,
        labelKey: group.labelKey,
        items: finalItems,
      });
    }

    // Add custom folders that belong to this group
    for (const cf of customFolders) {
      if (cf.groupId !== group.id) continue;
      const folderItems: NavItem[] = [];
      for (const key of cf.itemKeys) {
        const entry = findEntry(navGroups, key);
        if (entry && !isFolder(entry)) {
          if (hiddenSet.has(key) && !editMode) continue;
          folderItems.push(entry as NavItem);
        }
      }
      if (folderItems.length > 0 || editMode) {
        result.push({
          id: cf.id,
          labelKey: cf.id,
          isCustomFolder: true,
          customFolderName: cf.name,
          items: folderItems,
        });
      }
    }
  }

  return result;
}

// ─── Actions (pure functions) ──────────────────────────────

export function reorderItems(
  customization: SidebarCustomization,
  groupId: string,
  itemKeys: string[],
): SidebarCustomization {
  return {
    ...customization,
    itemOrder: { ...customization.itemOrder, [groupId]: itemKeys },
  };
}

export function createCustomFolder(
  customization: SidebarCustomization,
  name: string,
  groupId: string,
): { customization: SidebarCustomization; folderId: string } {
  const id = `custom-folder-${Date.now()}`;
  return {
    customization: {
      ...customization,
      customFolders: [...customization.customFolders, { id, name, groupId, itemKeys: [] }],
    },
    folderId: id,
  };
}

export function deleteCustomFolder(
  customization: SidebarCustomization,
  folderId: string,
): SidebarCustomization {
  return {
    ...customization,
    customFolders: customization.customFolders.filter((f) => f.id !== folderId),
  };
}

export function moveToFolder(
  customization: SidebarCustomization,
  itemKey: string,
  folderId: string,
): SidebarCustomization {
  const folders = customization.customFolders.map((f) => {
    // Remove from all folders first
    const filtered = f.itemKeys.filter((k) => k !== itemKey);
    // Add to target folder
    if (f.id === folderId) return { ...f, itemKeys: [...filtered, itemKey] };
    return { ...f, itemKeys: filtered };
  });
  return { ...customization, customFolders: folders };
}

export function removeFromFolder(
  customization: SidebarCustomization,
  itemKey: string,
): SidebarCustomization {
  const folders = customization.customFolders.map((f) => ({
    ...f,
    itemKeys: f.itemKeys.filter((k) => k !== itemKey),
  }));
  return { ...customization, customFolders: folders };
}

export function toggleHideItem(
  customization: SidebarCustomization,
  key: string,
): SidebarCustomization {
  const hidden = new Set(customization.hiddenItems);
  if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
  return { ...customization, hiddenItems: [...hidden] };
}

export function recordUsage(
  customization: SidebarCustomization,
  key: string,
): SidebarCustomization {
  return {
    ...customization,
    usageCounts: {
      ...customization.usageCounts,
      [key]: (customization.usageCounts[key] ?? 0) + 1,
    },
  };
}

export function toggleAutoSort(
  customization: SidebarCustomization,
): SidebarCustomization {
  return { ...customization, autoSortByUsage: !customization.autoSortByUsage };
}

export function resetCustomization(): SidebarCustomization {
  return defaultCustomization();
}
