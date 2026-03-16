"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type SidebarCustomization,
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
} from "./sidebarCustomization";

export function useSidebarCustomization() {
  const [data, setData] = useState<SidebarCustomization>(loadCustomization);
  const [editMode, setEditMode] = useState(false);

  // Sync across tabs
  useEffect(() => {
    const handler = () => setData(loadCustomization());
    window.addEventListener(CUSTOMIZATION_EVENT, handler);
    return () => window.removeEventListener(CUSTOMIZATION_EVENT, handler);
  }, []);

  const update = useCallback((next: SidebarCustomization) => {
    setData(next);
    saveCustomization(next);
  }, []);

  const actions = useMemo(() => ({
    reorder: (groupId: string, itemKeys: string[]) => {
      setData((prev) => {
        const next = reorderItems(prev, groupId, itemKeys);
        saveCustomization(next);
        return next;
      });
    },
    createFolder: (name: string, groupId: string) => {
      let folderId = "";
      setData((prev) => {
        const result = createCustomFolder(prev, name, groupId);
        folderId = result.folderId;
        saveCustomization(result.customization);
        return result.customization;
      });
      return folderId;
    },
    deleteFolder: (folderId: string) => {
      setData((prev) => {
        const next = deleteCustomFolder(prev, folderId);
        saveCustomization(next);
        return next;
      });
    },
    moveToFolder: (itemKey: string, folderId: string) => {
      setData((prev) => {
        const next = moveToFolder(prev, itemKey, folderId);
        saveCustomization(next);
        return next;
      });
    },
    removeFromFolder: (itemKey: string) => {
      setData((prev) => {
        const next = removeFromFolder(prev, itemKey);
        saveCustomization(next);
        return next;
      });
    },
    toggleHide: (key: string) => {
      setData((prev) => {
        const next = toggleHideItem(prev, key);
        saveCustomization(next);
        return next;
      });
    },
    trackUsage: (key: string) => {
      setData((prev) => {
        const next = recordUsage(prev, key);
        saveCustomization(next);
        return next;
      });
    },
    toggleAutoSort: () => {
      setData((prev) => {
        const next = toggleAutoSort(prev);
        saveCustomization(next);
        return next;
      });
    },
    toggleEditMode: () => setEditMode((v) => !v),
    setEditMode,
    reset: () => {
      const next = resetCustomization();
      setData(next);
      saveCustomization(next);
      setEditMode(false);
    },
  }), []);

  return { customization: data, editMode, ...actions };
}
