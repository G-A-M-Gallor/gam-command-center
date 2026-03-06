"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  getLayersContext,
  getEditorContext,
  getStoryMapContext,
  getFunctionalMapContext,
} from "./contextProvider";

const PAGE_CONTEXT_MAP: Record<string, () => Promise<string>> = {
  "/dashboard": getLayersContext,
  "/dashboard/layers": getLayersContext,
  "/dashboard/story-map": getStoryMapContext,
  "/dashboard/functional-map": getFunctionalMapContext,
};

/**
 * Hook that builds rich AI contexts based on the current page.
 * Appends real data from Supabase to the label-based contexts.
 */
export function usePageContext() {
  const pathname = usePathname();

  const buildRichContexts = useCallback(
    async (baseContexts: string[]): Promise<string[]> => {
      const richContexts = [...baseContexts];

      // Check if current page has a data provider
      const provider = PAGE_CONTEXT_MAP[pathname];
      if (provider) {
        try {
          const data = await provider();
          if (data) richContexts.push(data);
        } catch {
          // Silently fail — context is optional
        }
      }

      // Editor context needs the document ID from the URL
      if (pathname.startsWith("/dashboard/editor/")) {
        const docId = pathname.split("/").pop();
        if (docId && docId !== "editor") {
          try {
            const data = await getEditorContext(docId);
            if (data) richContexts.push(data);
          } catch {
            // Silently fail
          }
        }
      }

      return richContexts;
    },
    [pathname]
  );

  return { buildRichContexts };
}
