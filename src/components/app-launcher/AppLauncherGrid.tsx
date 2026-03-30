"use client";

import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { useAppLauncher } from "@/lib/app-launcher/useAppLauncher";
import { GRID_COLS, GRID_ROWS } from "@/lib/app-launcher/constants";
import type { LauncherItem, LauncherFolder } from "@/lib/app-launcher/types";
import { AppLauncherItem } from "./AppLauncherItem";
import { AppLauncherFolder, FolderOverlay } from "./AppLauncherFolder";
import { AppLauncherSearch } from "./AppLauncherSearch";
import { AppLauncherPreview } from "./AppLauncherPreview";
import { AppLauncherHistory } from "./AppLauncherHistory";

/** Droppable cell wrapper */
function GridCell({ row, col, page, children }: { row: number; col: number; page: number; children?: React.ReactNode }) {
  const cellId = `cell:${page}:${row}:${col}`;
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
    data: { row, col, page },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative flex items-center justify-center rounded-2xl transition-colors min-h-[110px]
        ${isOver ? "bg-purple-500/10 ring-1 ring-purple-500/20" : ""}
      `}
    >
      {children}
    </div>
  );
}

export function AppLauncherGrid() {
  const _router = useRouter();
  const { language } = useSettings();
  const _t = getTranslations(language);
  const tabsT = t.tabs as Record<string, string>;

  const launcher = useAppLauncher();
  const {
    catalog,
    filteredCatalog,
    allPagesItems,
    currentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    setDragActiveId,
    expandedFolderId,
    setExpandedFolderId,
    moveItem,
    createFolder,
    setLaunchMode,
    getLaunchMode,
    setCurrentPage,
    layout,
  } = launcher;

  const [historyOpen, setHistoryOpen] = useState(false);
  const isRtl = language === "he";

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Resolve label from i18n tabs
  const getLabel = useCallback(
    (item: LauncherItem) => {
      if (item.type === "page") {
        const key = item.id.replace("page:", "");
        return tabsT[key] || item.label[language] || item.label.en;
      }
      return item.label[language] || item.label.en;
    },
    [tabsT, language]
  );

  const getDescription = useCallback(
    (item: LauncherItem) => {
      if (item.type === "page") {
        const key = item.id.replace("page:", "");
        const pagesT = (_t.pages || {}) as Record<string, { title?: string; description?: string }>;
        return pagesT[key]?.description || item.description?.[language] || "";
      }
      return item.description?.[language] || item.description?.en || "";
    },
    [_t, language]
  );

  // Launch an item
  const handleLaunch = useCallback(
    (itemId: string) => {
      const item = catalog.find((c) => c.id === itemId);
      if (!item || item.status === "coming-soon") return;
      const mode = getLaunchMode(itemId);
      if (mode === "full-page" && item.href) {
        router.push(item.href);
      }
    },
    [catalog, getLaunchMode, router]
  );

  // DnD handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => { setDragActiveId(String(event.active.id)); },
    [setDragActiveId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActiveId(null);
      const { active, over } = event;
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);

      if (overId.startsWith("cell:")) {
        const parts = overId.split(":");
        moveItem(activeId, { page: parseInt(parts[1]), row: parseInt(parts[2]), col: parseInt(parts[3]) });
      } else if (overId.startsWith("folder:")) {
        // TODO: add item to folder
      } else if (overId !== activeId) {
        createFolder(activeId, overId);
      }
    },
    [setDragActiveId, moveItem, createFolder]
  );

  // Scroll to page programmatically with smooth animation
  const scrollToPage = useCallback((pageIndex: number) => {
    const container = scrollRef.current;
    if (!container) return;
    isScrollingProgrammatically.current = true;
    const pageEl = pageRefs.current[pageIndex];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    } else {
      const targetX = pageIndex * container.clientWidth;
      container.scrollTo({ left: targetX, behavior: "smooth" });
    }
    // Reset flag after animation
    setTimeout(() => { isScrollingProgrammatically.current = false; }, 500);
  }, []);

  // Track current page from scroll position via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || totalPages <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setCurrentPage(idx);
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    for (const ref of pageRefs.current) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, [totalPages, setCurrentPage]);

  // Arrow navigation
  const goNext = useCallback(() => {
    const next = Math.min(currentPage + 1, totalPages - 1);
    setCurrentPage(next);
    scrollToPage(next);
  }, [currentPage, totalPages, setCurrentPage, scrollToPage]);

  const goPrev = useCallback(() => {
    const prev = Math.max(currentPage - 1, 0);
    setCurrentPage(prev);
    scrollToPage(prev);
  }, [currentPage, setCurrentPage, scrollToPage]);

  // Keyboard nav (swap arrows for RTL)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") isRtl ? goNext() : goPrev();
      if (e.key === "ArrowRight") isRtl ? goPrev() : goNext();
      if (e.key === "Escape") setSelectedItemId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, setSelectedItemId, isRtl]);

  // Dot click
  const goToPage = useCallback((idx: number) => {
    setCurrentPage(idx);
    scrollToPage(idx);
  }, [setCurrentPage, scrollToPage]);

  // Get folder's items
  const getFolderItems = useCallback(
    (folder: LauncherFolder) =>
      folder.itemIds.map((id) => catalog.find((c) => c.id === id)).filter(Boolean) as LauncherItem[],
    [catalog]
  );

  const expandedFolder = expandedFolderId
    ? layout.folders.find((f) => f.id === expandedFolderId)
    : null;

  const isSearching = searchQuery.trim().length > 0;

  // Render a single page grid
  const renderPage = useMemo(() => {
    return (pageIndex: number, grid: (LauncherItem | LauncherFolder | null)[][]) => (
      <div
        key={pageIndex}
        ref={(el) => { pageRefs.current[pageIndex] = el; }}
        className="grid shrink-0 gap-2 snap-center"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          width: "100%",
          minWidth: "100%",
          height: "100%",
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <GridCell key={`${pageIndex}-${rowIdx}-${colIdx}`} row={rowIdx} col={colIdx} page={pageIndex}>
              {cell && "itemIds" in cell ? (
                <AppLauncherFolder
                  folder={cell as LauncherFolder}
                  items={getFolderItems(cell as LauncherFolder)}
                  isSelected={selectedItemId === (cell as LauncherFolder).id}
                  isExpanded={expandedFolderId === (cell as LauncherFolder).id}
                  onClick={() => setExpandedFolderId((cell as LauncherFolder).id)}
                  language={language}
                />
              ) : cell ? (
                <AppLauncherItem
                  item={cell as LauncherItem}
                  isSelected={selectedItemId === (cell as LauncherItem).id}
                  onClick={() => setSelectedItemId((cell as LauncherItem).id)}
                  onDoubleClick={() => handleLaunch((cell as LauncherItem).id)}
                  language={language}
                  labelOverride={getLabel(cell as LauncherItem)}
                />
              ) : null}
            </GridCell>
          ))
        )}
      </div>
    );
   
  }, [selectedItemId, expandedFolderId, language, getFolderItems, getLabel, handleLaunch, setSelectedItemId, setExpandedFolderId]);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex h-full flex-1 overflow-hidden">
      {/* History panel (left side) */}
      {historyOpen && (
        <AppLauncherHistory
          selectedItem={selectedItem ?? null}
          onClose={() => setHistoryOpen(false)}
          language={language}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search */}
        <div className="shrink-0 px-6 pt-6 pb-4">
          <AppLauncherSearch
            query={searchQuery}
            onChange={setSearchQuery}
            language={language}
            resultCount={filteredCatalog.length}
            historyOpen={historyOpen}
            onHistoryToggle={() => setHistoryOpen((prev) => !prev)}
          />
        </div>

        {/* Grid area */}
        <div className="relative flex-1 overflow-hidden px-6 pb-2">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {isSearching ? (
              /* Search results — flat grid with scroll */
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-9 gap-3">
                  {filteredCatalog.map((item) => (
                    <AppLauncherItem
                      key={item.id}
                      item={item}
                      isSelected={selectedItemId === item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => handleLaunch(item.id)}
                      language={language}
                      labelOverride={getLabel(item)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Horizontal scroll-snap pages */
              <div
                ref={scrollRef}
                className="flex h-full overflow-x-auto"
                style={{
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}
              >
                {allPagesItems.map((grid, pageIndex) => renderPage(pageIndex, grid))}
              </div>
            )}
          </DndContext>

          {/* Page arrows — swap sides for RTL */}
          {!isSearching && totalPages > 1 && (
            <>
              {currentPage > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className={`absolute ${isRtl ? "right-1" : "left-1"} top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800/80 p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-all backdrop-blur-sm shadow-lg border border-white/[0.06]`}
                >
                  {isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
              )}
              {currentPage < totalPages - 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className={`absolute ${isRtl ? "left-1" : "right-1"} top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800/80 p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-all backdrop-blur-sm shadow-lg border border-white/[0.06]`}
                >
                  {isRtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              )}
            </>
          )}
        </div>

        {/* Page dots */}
        {!isSearching && totalPages > 1 && (
          <div className="flex shrink-0 items-center justify-center gap-2 pb-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPage
                    ? "h-2.5 w-7 bg-purple-500"
                    : "h-2 w-2 bg-slate-700 hover:bg-slate-500"
                }`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview panel (right side) */}
      {selectedItem && (
        <AppLauncherPreview
          item={selectedItem}
          currentMode={getLaunchMode(selectedItem.id)}
          onLaunchModeChange={(mode) => setLaunchMode(selectedItem.id, mode)}
          onLaunch={() => handleLaunch(selectedItem.id)}
          onClose={() => setSelectedItemId(null)}
          language={language}
          labelOverride={getLabel(selectedItem)}
          descriptionOverride={getDescription(selectedItem)}
          compact={historyOpen}
        />
      )}

      {/* Folder overlay */}
      {expandedFolder && (
        <FolderOverlay
          folder={expandedFolder}
          items={getFolderItems(expandedFolder)}
          onClose={() => setExpandedFolderId(null)}
          onItemClick={(itemId) => {
            setExpandedFolderId(null);
            handleLaunch(itemId);
          }}
          language={language}
        />
      )}
    </div>
  );
}
