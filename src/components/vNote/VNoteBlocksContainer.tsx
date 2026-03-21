"use client";

import { useState, useCallback } from "react";
import { VBlockShell } from "@/components/vBlock";
import type { VBlockEvent } from "@/components/vBlock";
import { EntityCard } from "@/components/vBlock/blocks/EntityCard";
import type { LayoutBlock } from "./storyMap.types";

interface Props {
  blocks: LayoutBlock[];
  onEvent?: (event: VBlockEvent) => void;
}

type ViewMode = "vnote" | "whiteboard" | "graph";

export function VNoteBlocksContainer({ blocks, onEvent }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("vnote");

  const handleEvent = useCallback(
    (e: VBlockEvent) => {
      onEvent?.(e);
    },
    [onEvent],
  );

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      {/* Toggle bar */}
      <div className="flex items-center gap-1 border-b border-slate-700/50 px-4 py-2">
        {(
          [
            { id: "vnote", label: "vNote", enabled: true },
            { id: "whiteboard", label: "Whiteboard", enabled: false },
            { id: "graph", label: "Graph", enabled: false },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            onClick={() => tab.enabled && setViewMode(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === tab.id
                ? "bg-purple-500/20 text-purple-300"
                : tab.enabled
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                  : "text-slate-600 cursor-not-allowed"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Blocks area */}
      <div className="p-4">
        {viewMode === "vnote" && (
          <>
            {blocks.length > 0 ? (
              <div className="flex flex-col md:flex-row md:flex-wrap gap-4 items-stretch md:items-start">
                {blocks.map((block) => (
                  <VBlockShell
                    key={block.blockId}
                    blockId={block.blockId}
                    title={block.storyMapConfig?.label ?? block.blockId}
                    icon={block.entityType ? "👤" : "📦"}
                    initialSize={{ width: 350, height: 280 }}
                    flip={
                      block.entityId
                        ? { enabled: true, frontLabel: "פרטים", backLabel: "מידע נוסף" }
                        : undefined
                    }
                    onEvent={handleEvent}
                    onFullscreen="expand"
                  >
                    {({ mode, page }) =>
                      block.entityId ? (
                        <EntityCard
                          entityType={block.entityType ?? "contact"}
                          entityId={block.entityId}
                          page={page ?? "front"}
                          mode={mode}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full p-4">
                          <span className="text-xs text-slate-500">
                            block: {block.blockId}
                          </span>
                        </div>
                      )
                    }
                  </VBlockShell>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                אין בלוקים — לחץ על &quot;+ הוסף block&quot;
              </p>
            )}

            {/* Add block button */}
            <button
              type="button"
              className="mt-4 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs text-slate-400 hover:border-purple-500/40 hover:text-purple-300 transition-colors"
              onClick={() =>
                handleEvent({
                  type: "block.context.action",
                  blockId: "__new__",
                  actionId: "add-block",
                })
              }
            >
              <span>+</span>
              הוסף block
            </button>
          </>
        )}

        {viewMode !== "vnote" && (
          <div className="flex items-center justify-center py-12 text-xs text-slate-500">
            {viewMode === "whiteboard" ? "Whiteboard" : "Graph"} — יגיע בגרסה הבאה
          </div>
        )}
      </div>
    </div>
  );
}
