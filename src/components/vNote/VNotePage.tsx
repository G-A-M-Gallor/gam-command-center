"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { VBlockErrorBoundary } from "@/components/vBlock";
import { useVNote } from "./useVNote";
import { VNoteUniversalFields } from "./VNoteUniversalFields";
import { VNoteEntityView } from "./VNoteEntityView";
import { StoryMap } from "./StoryMap";
import { VNoteBlocksContainer } from "./VNoteBlocksContainer";
import { VNoteCanvasZone } from "./VNoteCanvasZone";
import { VNoteSidebar } from "./VNoteSidebar";
import type { VNotePageProps } from "./vNote.types";

export function VNotePage({ entityId }: VNotePageProps) {
  const { entity, blocks, isLoading, error } = useVNote(entityId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleEntityUpdate = useCallback(() => {
    // React Query will auto-refetch; this is a placeholder for optimistic updates
  }, []);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-slate-500" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-2xl">⚠️</span>
        <p className="text-sm text-red-400">שגיאה בטעינת vNote</p>
        <p className="text-xs text-slate-500">{error.message}</p>
      </div>
    );
  }

  // Not found
  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-2xl">📭</span>
        <p className="text-sm text-slate-400">ישות לא נמצאה</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative min-h-screen">
      {/* Sidebar */}
      <VNoteSidebar
        entity={entity}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main content — shifts when sidebar opens */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ marginInlineEnd: sidebarOpen ? 280 : 0 }}
      >
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
          {/* Zone 1: Universal Fields */}
          <VBlockErrorBoundary blockId="zone-universal-fields">
            <VNoteUniversalFields entity={entity} onUpdate={handleEntityUpdate} />
          </VBlockErrorBoundary>

          {/* Zone 2: Entity View */}
          <VBlockErrorBoundary blockId="zone-entity-view">
            <VNoteEntityView entity={entity} />
          </VBlockErrorBoundary>

          {/* Zone 3: Story Map */}
          <VBlockErrorBoundary blockId="zone-story-map">
            <StoryMap contextId={entityId} blocks={blocks} />
          </VBlockErrorBoundary>

          {/* Zone 4: Blocks Container */}
          <VBlockErrorBoundary blockId="zone-blocks-container">
            <VNoteBlocksContainer blocks={blocks} />
          </VBlockErrorBoundary>

          {/* Zone 5: Canvas Zone */}
          <VBlockErrorBoundary blockId="zone-canvas">
            <VNoteCanvasZone />
          </VBlockErrorBoundary>
        </div>
      </div>
    </div>
  );
}
