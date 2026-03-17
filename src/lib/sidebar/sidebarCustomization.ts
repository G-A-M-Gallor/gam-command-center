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

export type IconPosition = "start" | "end" | "above";
export type LabelLanguage = "he" | "en" | "ru" | "custom";

export interface ItemCustomization {
  /** Custom nickname/label (used when labelLanguage is "custom") */
  customLabel?: string;
  /** Which language to show for the label, or "custom" for customLabel */
  labelLanguage?: LabelLanguage;
  /** Where to show the icon relative to the label */
  iconPosition?: IconPosition;
  /** Lucide icon name override */
  customIcon?: string;
}

/** User-created section (group) */
export interface CustomSection {
  id: string;
  name: string;
  /** Item keys assigned to this section */
  itemKeys: string[];
  /** Sort order relative to other sections (lower = higher) */
  sortOrder: number;
  /** Collapsed by default */
  defaultCollapsed: boolean;
  /** Custom emoji/icon prefix for section header */
  emoji?: string;
}

/** Override for a built-in section (rename, reorder, collapse state) */
export interface SectionOverride {
  /** Custom display name (overrides i18n) */
  customName?: string;
  /** Custom emoji prefix */
  emoji?: string;
  /** Sort order override (lower = higher) */
  sortOrder?: number;
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
  /** Per-item customizations (label, icon, position) */
  itemCustomizations: Record<string, ItemCustomization>;
  /** Collapsed section IDs */
  collapsedSections: string[];
  /** Overrides for built-in sections (rename, emoji, reorder) */
  sectionOverrides: Record<string, SectionOverride>;
  /** User-created custom sections */
  customSections: CustomSection[];
}

export interface DisplayGroup {
  id: string;
  labelKey: string;
  isCustomFolder?: boolean;
  customFolderName?: string;
  /** Whether this is a user-created section */
  isCustomSection?: boolean;
  /** Display name (resolved from overrides/custom) */
  displayName?: string;
  /** Emoji prefix */
  emoji?: string;
  items: NavEntry[];
}

// ─── Constants ─────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "cc-sidebar-custom";
const EVENT_NAME = "cc-sidebar-custom-change";

function storageKey(language?: string): string {
  return language ? `${STORAGE_KEY_PREFIX}-${language}` : STORAGE_KEY_PREFIX;
}

function defaultCustomization(): SidebarCustomization {
  return {
    itemOrder: {},
    customFolders: [],
    hiddenItems: [],
    usageCounts: {},
    autoSortByUsage: false,
    itemCustomizations: {},
    collapsedSections: [],
    sectionOverrides: {},
    customSections: [],
  };
}

// ─── Persistence ───────────────────────────────────────────

export function loadCustomization(language?: string): SidebarCustomization {
  try {
    const key = storageKey(language);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultCustomization(), ...parsed };
    }
    // Migrate: if language-specific key doesn't exist, try loading the old shared key
    if (language) {
      const shared = localStorage.getItem(STORAGE_KEY_PREFIX);
      if (shared) {
        const parsed = JSON.parse(shared);
        return { ...defaultCustomization(), ...parsed };
      }
    }
  } catch {}
  return defaultCustomization();
}

export function saveCustomization(data: SidebarCustomization, language?: string): void {
  try {
    localStorage.setItem(storageKey(language), JSON.stringify(data));
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
  const { itemOrder, customFolders, hiddenItems, usageCounts, autoSortByUsage, sectionOverrides, customSections } = customization;
  const hiddenSet = new Set(hiddenItems);

  // Build a set of item keys that belong to custom sections (to exclude from built-in groups)
  const customSectionItemKeys = new Set<string>();
  for (const cs of customSections) {
    for (const k of cs.itemKeys) customSectionItemKeys.add(k);
  }

  // Build global entry map for lookups
  const globalEntryMap = new Map<string, NavEntry>();
  for (const group of navGroups) {
    for (const entry of group.items) {
      globalEntryMap.set(entry.key, entry);
      if (isFolder(entry)) {
        for (const child of entry.children) globalEntryMap.set(child.key, child);
      }
    }
  }

  const result: DisplayGroup[] = [];

  // Helper: filter + sort entries for a group
  function processEntries(allEntries: NavEntry[]): NavEntry[] {
    let sorted = [...allEntries];
    if (autoSortByUsage) {
      sorted.sort((a, b) => (usageCounts[b.key] ?? 0) - (usageCounts[a.key] ?? 0));
    }

    const filtered = sorted.filter((entry) => {
      if (permissions.visiblePages && !permissions.visiblePages.includes(entry.key)) return false;

      // "hidden" filter: show ONLY hidden/disabled items
      if (filter === "hidden") {
        return hiddenSet.has(entry.key) || entry.status === "coming-soon";
      }

      // "me" and "team": hide hidden items (unless edit mode)
      if (hiddenSet.has(entry.key) && !editMode) return false;

      // "team": show only active items in default order (ignore user customization)
      if (filter === "team" && entry.status !== "active") return false;

      // "me": show active items in user's custom order (default behavior)
      if (filter === "me" && entry.status !== "active") return false;

      if (filter === "favorites") {
        if (isFolder(entry)) return entry.children.some((c) => favHrefs.has(c.href)) || favHrefs.has(entry.href);
        return favHrefs.has((entry as NavItem).href);
      }
      return true;
    });

    return filtered.map((entry) => {
      if (isFolder(entry)) {
        const filteredChildren = entry.children.filter((child) => {
          if (permissions.visiblePages && !permissions.visiblePages.includes(child.key)) return false;
          if (filter === "hidden") {
            return hiddenSet.has(child.key) || child.status === "coming-soon";
          }
          if (hiddenSet.has(child.key) && !editMode) return false;
          if (filter === "team" && child.status !== "active") return false;
          if (filter === "me" && child.status !== "active") return false;
          if (filter === "favorites") return favHrefs.has(child.href);
          return true;
        });
        return { ...entry, children: filteredChildren } as NavFolder;
      }
      return entry;
    });
  }

  // ── Built-in groups ──
  for (const group of navGroups) {
    const allEntries: NavEntry[] = [];
    const entryMap = new Map<string, NavEntry>();

    for (const entry of group.items) {
      entryMap.set(entry.key, entry);
      if (isFolder(entry)) {
        for (const child of entry.children) entryMap.set(child.key, child);
      }
    }

    const savedOrder = itemOrder[group.id];
    if (savedOrder && savedOrder.length > 0) {
      const seen = new Set<string>();
      for (const key of savedOrder) {
        if (entryMap.has(key) && !seen.has(key)) {
          allEntries.push(entryMap.get(key)!);
          seen.add(key);
        }
      }
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
      for (const entry of group.items) {
        allEntries.push(entry);
      }
    }

    // Exclude items that moved to custom sections
    const withoutMoved = allEntries.filter((e) => !customSectionItemKeys.has(e.key));
    const finalItems = processEntries(withoutMoved);

    const so = sectionOverrides[group.id];
    if (finalItems.length > 0) {
      result.push({
        id: group.id,
        labelKey: group.labelKey,
        displayName: so?.customName || undefined,
        emoji: so?.emoji || undefined,
        items: finalItems,
      });
    }

    // Custom folders that belong to this group
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

  // ── Custom sections ──
  const sortedCustomSections = [...customSections].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const cs of sortedCustomSections) {
    const entries: NavEntry[] = [];
    for (const key of cs.itemKeys) {
      const entry = globalEntryMap.get(key);
      if (entry) entries.push(entry);
    }
    const finalItems = processEntries(entries);
    if (finalItems.length > 0 || editMode) {
      result.push({
        id: cs.id,
        labelKey: cs.id,
        isCustomSection: true,
        displayName: cs.name,
        emoji: cs.emoji,
        items: finalItems,
      });
    }
  }

  // ── Sort all groups by section overrides ──
  result.sort((a, b) => {
    const aOrder = sectionOverrides[a.id]?.sortOrder ?? (a.isCustomSection ? 50 : getBuiltinOrder(a.id));
    const bOrder = sectionOverrides[b.id]?.sortOrder ?? (b.isCustomSection ? 50 : getBuiltinOrder(b.id));
    return aOrder - bOrder;
  });

  return result;
}

/** Default sort order for built-in groups */
function getBuiltinOrder(id: string): number {
  if (id === "core") return 10;
  if (id === "tools") return 20;
  if (id === "system") return 30;
  return 25; // custom folders
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

// ─── Section Actions ─────────────────────────────────────

export function toggleSectionCollapse(
  customization: SidebarCustomization,
  sectionId: string,
): SidebarCustomization {
  const set = new Set(customization.collapsedSections);
  if (set.has(sectionId)) set.delete(sectionId); else set.add(sectionId);
  return { ...customization, collapsedSections: [...set] };
}

export function updateSectionOverride(
  customization: SidebarCustomization,
  sectionId: string,
  patch: Partial<SectionOverride>,
): SidebarCustomization {
  const existing = customization.sectionOverrides[sectionId] || {};
  return {
    ...customization,
    sectionOverrides: {
      ...customization.sectionOverrides,
      [sectionId]: { ...existing, ...patch },
    },
  };
}

export function createSection(
  customization: SidebarCustomization,
  name: string,
  emoji?: string,
): { customization: SidebarCustomization; sectionId: string } {
  const id = `section-${Date.now()}`;
  const maxOrder = customization.customSections.reduce((m, s) => Math.max(m, s.sortOrder), 50);
  return {
    customization: {
      ...customization,
      customSections: [
        ...customization.customSections,
        { id, name, itemKeys: [], sortOrder: maxOrder + 10, defaultCollapsed: false, emoji },
      ],
    },
    sectionId: id,
  };
}

export function isSectionEmpty(
  customization: SidebarCustomization,
  sectionId: string,
): boolean {
  const cs = customization.customSections.find((s) => s.id === sectionId);
  return cs ? cs.itemKeys.length === 0 : true;
}

export function deleteSection(
  customization: SidebarCustomization,
  sectionId: string,
): SidebarCustomization {
  // Only allow deleting empty sections
  if (!isSectionEmpty(customization, sectionId)) return customization;
  return {
    ...customization,
    customSections: customization.customSections.filter((s) => s.id !== sectionId),
    collapsedSections: customization.collapsedSections.filter((id) => id !== sectionId),
  };
}

export function renameSection(
  customization: SidebarCustomization,
  sectionId: string,
  name: string,
): SidebarCustomization {
  // For custom sections, update the name directly
  const isCustom = customization.customSections.some((s) => s.id === sectionId);
  if (isCustom) {
    return {
      ...customization,
      customSections: customization.customSections.map((s) =>
        s.id === sectionId ? { ...s, name } : s
      ),
    };
  }
  // For built-in sections, use sectionOverrides
  return updateSectionOverride(customization, sectionId, { customName: name });
}

export function moveItemToSection(
  customization: SidebarCustomization,
  itemKey: string,
  sectionId: string,
): SidebarCustomization {
  // Remove from all custom sections first
  const updatedSections = customization.customSections.map((s) => ({
    ...s,
    itemKeys: s.itemKeys.filter((k) => k !== itemKey),
  }));
  // Add to target section
  return {
    ...customization,
    customSections: updatedSections.map((s) =>
      s.id === sectionId ? { ...s, itemKeys: [...s.itemKeys, itemKey] } : s
    ),
  };
}

export function removeItemFromSection(
  customization: SidebarCustomization,
  itemKey: string,
): SidebarCustomization {
  return {
    ...customization,
    customSections: customization.customSections.map((s) => ({
      ...s,
      itemKeys: s.itemKeys.filter((k) => k !== itemKey),
    })),
  };
}

// ─── Item Actions ────────────────────────────────────────

export function updateItemCustomization(
  customization: SidebarCustomization,
  key: string,
  patch: Partial<ItemCustomization>,
): SidebarCustomization {
  const existing = customization.itemCustomizations[key] || {};
  return {
    ...customization,
    itemCustomizations: {
      ...customization.itemCustomizations,
      [key]: { ...existing, ...patch },
    },
  };
}

export function clearItemCustomization(
  customization: SidebarCustomization,
  key: string,
): SidebarCustomization {
  const next = { ...customization.itemCustomizations };
  delete next[key];
  return { ...customization, itemCustomizations: next };
}

export function resetCustomization(): SidebarCustomization {
  return defaultCustomization();
}
