"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { VBlockErrorBoundary } from "@/components/vBlock";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { useVNote } from "./useVNote";
import { VNoteUniversalFields } from "./VNoteUniversalFields";
import { VNoteEntityView } from "./VNoteEntityView";
import { StoryMap } from "./StoryMap";
import { VNoteBlocksContainer } from "./VNoteBlocksContainer";
import { VNoteCanvasZone } from "./VNoteCanvasZone";
import { VNoteSidebar } from "./VNoteSidebar";
import { VNoteMobileNav } from "./VNoteMobileNav";
import { trackRecentItem } from "@/lib/hooks/useRecentItems";
import type { VNotePageProps } from "./vNote.types";

export function VNotePage({ entityId }: VNotePageProps) {
  const { entity, blocks, isLoading, error, selectedBlockId, setSelectedBlockId } = useVNote(entityId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  const handleEntityUpdate = useCallback(() => {
    // React Query will auto-refetch; placeholder for optimistic updates
  }, []);

  // Track recent visit
  useEffect(() => {
    if (!entity) return;
    trackRecentItem({
      record_id: entityId,
      entity_type: entity.entity_type ?? "unknown",
      title: entity.title,
      route: `/dashboard/vnote/${entityId}`,
      icon: (entity.meta as Record<string, unknown>)?.icon as string ?? "",
    });
  }, [entityId, entity?.title, entity?.entity_type]);

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
      {/* Sidebar (desktop: side panel, mobile: bottom sheet) */}
      <VNoteSidebar
        entity={entity}
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        onClearBlock={() => setSelectedBlockId(null)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isMobile={isMobile}
      />

      {/* Main content — shifts on desktop when sidebar opens, no shift on mobile */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ marginInlineEnd: !isMobile && sidebarOpen ? 280 : 0 }}
      >
        <div
          className={`mx-auto space-y-5 ${
            isMobile ? "px-3 pt-12 pb-20" : "max-w-5xl px-4 py-6"
          }`}
        >
          {/* Zone 1: Universal Fields */}
          <div id="zone-fields">
            <VBlockErrorBoundary blockId="zone-universal-fields">
              <VNoteUniversalFields entity={entity} onUpdate={handleEntityUpdate} />
            </VBlockErrorBoundary>
          </div>

          {/* Zone 2: Entity View */}
          <VBlockErrorBoundary blockId="zone-entity-view">
            <VNoteEntityView entity={entity} />
          </VBlockErrorBoundary>

          {/* Zone 3: Story Map */}
          <div id="zone-story">
            <VBlockErrorBoundary blockId="zone-story-map">
              <StoryMap contextId={entityId} blocks={blocks} />
            </VBlockErrorBoundary>
          </div>

          {/* Zone 4: Blocks Container */}
          <div id="zone-blocks">
            <VBlockErrorBoundary blockId="zone-blocks-container">
              <VNoteBlocksContainer
                blocks={blocks}
                entityId={entityId}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
              />
            </VBlockErrorBoundary>
          </div>

          {/* Zone 5: Canvas Zone */}
          <div id="zone-canvas">
            <VBlockErrorBoundary blockId="zone-canvas">
              <VNoteCanvasZone />
            </VBlockErrorBoundary>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <VNoteMobileNav
          onSidebarOpen={() => setSidebarOpen(true)}
          entityTitle={entity.title}
          entityType={entity.entity_type ?? undefined}
        />
      )}
    </div>
  );
}
