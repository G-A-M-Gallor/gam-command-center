"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { LayoutBlock } from "./storyMap.types";

interface Props {
  blocks: LayoutBlock[];
  mainEntityId?: string;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
}

function useGraphData(blocks: LayoutBlock[], mainEntityId?: string) {
  return useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Main entity node (center)
    if (mainEntityId) {
      nodes.push({
        id: `main:${mainEntityId}`,
        type: "default",
        position: { x: 300, y: 200 },
        data: {
          label: "📌 מופע ראשי",
        },
        style: {
          background: "rgba(139, 92, 246, 0.15)",
          border: "2px solid rgba(139, 92, 246, 0.5)",
          borderRadius: 12,
          color: "#e2e8f0",
          fontSize: 12,
          fontWeight: 600,
          padding: "8px 16px",
          width: 140,
          textAlign: "center" as const,
        },
      });
    }

    // Block nodes arranged in a circle
    const radius = 200;
    const centerX = 300;
    const centerY = 200;

    blocks.forEach((block, i) => {
      const angle = (2 * Math.PI * i) / Math.max(blocks.length, 1) - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const label = block.storyMapConfig?.label ?? block.blockId;
      const typeEmoji = block.entityType === "contact" ? "👤"
        : block.entityType === "project" ? "📁"
        : block.entityType === "deal" ? "💰"
        : "📦";

      nodes.push({
        id: block.blockId,
        type: "default",
        position: { x, y },
        data: {
          label: `${typeEmoji} ${label}`,
        },
        style: {
          background: "rgba(30, 41, 59, 0.8)",
          border: "1px solid rgba(100, 116, 139, 0.3)",
          borderRadius: 10,
          color: "#cbd5e1",
          fontSize: 11,
          padding: "6px 12px",
          width: 130,
          textAlign: "center" as const,
        },
      });

      // Edge from main to block
      if (mainEntityId) {
        edges.push({
          id: `edge-main-${block.blockId}`,
          source: `main:${mainEntityId}`,
          target: block.blockId,
          type: "default",
          animated: true,
          style: { stroke: "rgba(139, 92, 246, 0.3)", strokeWidth: 1.5 },
          label: block.entityType ?? "",
          labelStyle: { fontSize: 9, fill: "#64748b" },
        });
      }
    });

    return { nodes, edges };
  }, [blocks, mainEntityId]);
}

export function VNoteGraphView({ blocks, mainEntityId, selectedBlockId, onSelectBlock }: Props) {
  const router = useRouter();
  const { nodes, edges } = useGraphData(blocks, mainEntityId);

  // Highlight selected node
  const styledNodes = useMemo(() =>
    nodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        ...(n.id === selectedBlockId
          ? { border: "2px solid #3b82f6", boxShadow: "0 0 12px rgba(59, 130, 246, 0.3)" }
          : {}),
      },
    })),
  [nodes, selectedBlockId]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.id.startsWith("main:")) return;
      onSelectBlock?.(node.id);
    },
    [onSelectBlock],
  );

  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const block = blocks.find((b) => b.blockId === node.id);
      if (block?.entityId) {
        router.push(`/dashboard/vnote/${block.entityId}`);
      }
    },
    [blocks, router],
  );

  const handlePaneClick = useCallback(() => {
    onSelectBlock?.(null);
  }, [onSelectBlock]);

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-slate-500">
        אין בלוקים להצגה בגרף
      </div>
    );
  }

  return (
    <div className="h-[400px] rounded-lg overflow-hidden" dir="ltr">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        fitView
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} />
        <Controls
          position="bottom-left"
          style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}
