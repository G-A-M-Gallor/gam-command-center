"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type SidebarCustomization,
  type ItemCustomization,
  type SectionOverride,
  loadCustomization,
  saveCustomization,
  CUSTOMIZATION_EVENT,
  reorderItems,
  createCustomFolder,
  deleteCustomFolder,
  moveToFolder,
  removeFromFolder,
  toggleHideItem,
  recordUsage,
  toggleAutoSort,
  resetCustomization,
  updateItemCustomization,
  clearItemCustomization,
  toggleSectionCollapse,
  updateSectionOverride,
  createSection,
  deleteSection,
  isSectionEmpty,
  renameSection,
  moveItemToSection,
  removeItemFromSection,
} from "./sidebarCustomization";

export function useSidebarCustomization(language?: string) {
  const [data, setData] = useState<SidebarCustomization>(() => loadCustomization(language));
  const [editMode, setEditMode] = useState(false);

  // Reload when language changes
  useEffect(() => {
    setData(loadCustomization(language));
  }, [language]);

  // Sync across tabs
  useEffect(() => {
    const handler = () => setData(loadCustomization(language));
    window.addEventListener(CUSTOMIZATION_EVENT, handler);
    return () => window.removeEventListener(CUSTOMIZATION_EVENT, handler);
  }, [language]);

  const update = useCallback((next: SidebarCustomization) => {
    setData(next);
    saveCustomization(next, language);
  }, [language]);

  const actions = useMemo(() => ({
    reorder: (groupId: string, itemKeys: string[]) => {
      setData((prev) => {
        const next = reorderItems(prev, groupId, itemKeys);
        saveCustomization(next, language);
        return next;
      });
    },
    createFolder: (name: string, groupId: string) => {
      let folderId = "";
      setData((prev) => {
        const result = createCustomFolder(prev, name, groupId);
        folderId = result.folderId;
        saveCustomization(result.customization, language);
        return result.customization;
      });
      return folderId;
    },
    deleteFolder: (folderId: string) => {
      setData((prev) => {
        const next = deleteCustomFolder(prev, folderId);
        saveCustomization(next, language);
        return next;
      });
    },
    moveToFolder: (itemKey: string, folderId: string) => {
      setData((prev) => {
        const next = moveToFolder(prev, itemKey, folderId);
        saveCustomization(next, language);
        return next;
      });
    },
    removeFromFolder: (itemKey: string) => {
      setData((prev) => {
        const next = removeFromFolder(prev, itemKey);
        saveCustomization(next, language);
        return next;
      });
    },
    toggleHide: (key: string) => {
      setData((prev) => {
        const next = toggleHideItem(prev, key);
        saveCustomization(next, language);
        return next;
      });
    },
    trackUsage: (key: string) => {
      setData((prev) => {
        const next = recordUsage(prev, key);
        saveCustomization(next, language);
        return next;
      });
    },
    toggleAutoSort: () => {
      setData((prev) => {
        const next = toggleAutoSort(prev);
        saveCustomization(next, language);
        return next;
      });
    },
    updateItem: (key: string, patch: Partial<ItemCustomization>) => {
      setData((prev) => {
        const next = updateItemCustomization(prev, key, patch);
        saveCustomization(next, language);
        return next;
      });
    },
    clearItem: (key: string) => {
      setData((prev) => {
        const next = clearItemCustomization(prev, key);
        saveCustomization(next, language);
        return next;
      });
    },
    // Section actions
    toggleSection: (sectionId: string) => {
      setData((prev) => {
        const next = toggleSectionCollapse(prev, sectionId);
        saveCustomization(next, language);
        return next;
      });
    },
    updateSection: (sectionId: string, patch: Partial<SectionOverride>) => {
      setData((prev) => {
        const next = updateSectionOverride(prev, sectionId, patch);
        saveCustomization(next, language);
        return next;
      });
    },
    createSection: (name: string, emoji?: string) => {
      let sectionId = "";
      setData((prev) => {
        const result = createSection(prev, name, emoji);
        sectionId = result.sectionId;
        saveCustomization(result.customization, language);
        return result.customization;
      });
      return sectionId;
    },
    deleteSection: (sectionId: string) => {
      setData((prev) => {
        const next = deleteSection(prev, sectionId);
        saveCustomization(next, language);
        return next;
      });
    },
    isSectionEmpty: (sectionId: string) => isSectionEmpty(data, sectionId),
    renameSection: (sectionId: string, name: string) => {
      setData((prev) => {
        const next = renameSection(prev, sectionId, name);
        saveCustomization(next, language);
        return next;
      });
    },
    moveItemToSection: (itemKey: string, sectionId: string) => {
      setData((prev) => {
        const next = moveItemToSection(prev, itemKey, sectionId);
        saveCustomization(next, language);
        return next;
      });
    },
    removeItemFromSection: (itemKey: string) => {
      setData((prev) => {
        const next = removeItemFromSection(prev, itemKey);
        saveCustomization(next, language);
        return next;
      });
    },
    toggleEditMode: () => setEditMode((v) => !v),
    setEditMode,
    reset: () => {
      const next = resetCustomization();
      setData(next);
      saveCustomization(next, language);
      setEditMode(false);
    },
  }), [language]);

  return { customization: data, editMode, ...actions };
}
