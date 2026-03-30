"use client";

import React, {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { VBlockErrorBoundary } from "./vBlockErrorBoundary";
import { VBlockHeader } from "./vBlockHeader";
import { VBlockResize } from "./vBlockResize";
import { VBlockContextMenu } from "./vBlockContextMenu";
import { useVBlock } from "./useVBlock";
import { VBLOCK_Z } from "./vBlockZIndex";
import type {
  VBlockShellProps,
  VBlockAction,
  VBlockSize,
} from "./vBlock.types";

// ─── Memoized content wrapper ───────────────────────────────
const VBlockContent = React.memo(function VBlockContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
});

// ─── Skeleton placeholder for lazy-loaded content ───────────
function VBlockSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="h-6 w-6 animate-pulse rounded-full bg-slate-700" />
    </div>
  );
}

// ─── Main Shell ─────────────────────────────────────────────
export const VBlockShell = forwardRef<HTMLDivElement, VBlockShellProps>(
  function VBlockShell(props, externalRef) {
    const {
      blockId,
      title,
      icon,
      initialSize,
      size: controlledSize,
      minSize = { width: 120, height: 80 },
      maxSize = { width: 1200, height: 900 },
      resizable = true,
      draggable = false,
      flip,
      contextActions,
      onSettings,
      showSettings = false,
      onFullscreen: fullscreenMode,
      onEvent,
      children,
    } = props;

    const uid = useId();
    const [flipPage, setFlipPage] = useState<"front" | "back">("front");
    const [isFlipped, setIsFlipped] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
    } | null>(null);

    const {
      containerRef,
      size,
      mode,
      isResizing,
      isFullscreen,
      isVisible,
      handleResize,
      handleResizeStart,
      handleResizeEnd,
      enterFullscreen,
      exitFullscreen,
    } = useVBlock({
      blockId,
      initialSize,
      controlledSize,
      minSize,
      maxSize,
      onEvent,
    });

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof externalRef === "function") externalRef(node);
        else if (externalRef)
          (
            externalRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
      },
      [containerRef, externalRef],
    );

    // Flip logic
    const handleFlip = useCallback(() => {
      setIsFlipped((prev) => !prev);
      setFlipPage((prev) => (prev === "front" ? "back" : "front"));
    }, []);

    // Determine which page to show
    const page = useMemo(() => {
      if (!flip?.enabled) return "front" as const;
      if (mode === "expanded") return "both" as const;
      return flipPage;
    }, [flip?.enabled, mode, flipPage]);

    // Context menu
    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      },
      [],
    );

    const defaultActions: VBlockAction[] = useMemo(
      () => [
        {
          id: "fullscreen",
          label: "מסך מלא",
          icon: "⛶",
          shortcut: "F11",
          onClick: enterFullscreen,
        },
        ...(showSettings && onSettings
          ? [
              {
                id: "settings",
                label: "הגדרות",
                icon: "⚙",
                onClick: () => {
                  onSettings();
                  onEvent?.({
                    type: "block.settings.opened" as const,
                    blockId,
                  });
                },
              },
            ]
          : []),
        {
          id: "duplicate",
          label: "שכפל",
          icon: "📋",
          dividerBefore: true,
          onClick: () =>
            onEvent?.({
              type: "block._context.action",
              blockId,
              actionId: "duplicate",
            }),
        },
        {
          id: "delete",
          label: "מחק",
          icon: "🗑",
          danger: true,
          onClick: () =>
            onEvent?.({
              type: "block._context.action",
              blockId,
              actionId: "delete",
            }),
        },
      ],
      [enterFullscreen, showSettings, onSettings, onEvent, blockId],
    );

    const allActions = useMemo(
      () => [...(contextActions ?? []), ...defaultActions],
      [contextActions, defaultActions],
    );

    // Keyboard handlers
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          if (isFullscreen) exitFullscreen();
          else if (contextMenu) setContextMenu(null);
        }
        if (e.key === "F11") {
          e.preventDefault();
          if (isFullscreen) exitFullscreen();
          else enterFullscreen();
        }
      },
      [isFullscreen, contextMenu, enterFullscreen, exitFullscreen],
    );

    // Resolve children
    const renderedContent = useMemo(() => {
      if (!isVisible) return <VBlockSkeleton />;
      if (typeof children === "function") {
        return children({ mode, size, page });
      }
      return children;
    }, [isVisible, children, mode, size, page]);

    // Flip CSS
    const flipStyle: React.CSSProperties =
      flip?.enabled && isFlipped && mode !== "expanded"
        ? {
            transform: "rotateY(180deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s ease",
          }
        : flip?.enabled
          ? {
              transform: "rotateY(0deg)",
              transformStyle: "preserve-3d",
              transition: "transform 0.5s ease",
            }
          : {};

    // Block inner content
    const blockContent = (
      <div
        ref={!isFullscreen ? setRefs : undefined}
        data-block-id={blockId}
        data-block-mode={mode}
        data-cc-id={`vblock.${blockId}`}
        role="region"
        aria-label={`${title} block`}
        aria-labelledby={`${uid}-title`}
        tabIndex={0}
        className={`relative flex flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/90 text-slate-100 outline-none transition-shadow duration-200 ${
          isFullscreen
            ? "h-full w-full rounded-none border-0"
            : "hover:shadow-lg hover:shadow-black/20 focus-visible:ring-1 focus-visible:ring-purple-500/50"
        }`}
        style={{
          ...(isFullscreen
            ? {}
            : {
                width: size.width,
                height: size.height,
                contain: "layout style paint",
              }),
          ...flipStyle,
          zIndex: isResizing
            ? VBLOCK_Z.blockDragging
            : VBLOCK_Z.block,
        }}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <VBlockHeader
          title={title}
          icon={icon}
          mode={mode}
          flip={flip}
          showSettings={showSettings}
          onSettings={onSettings}
          onFullscreen={fullscreenMode ? enterFullscreen : undefined}
          onCloseFullscreen={isFullscreen ? exitFullscreen : undefined}
          onFlip={flip?.enabled ? handleFlip : undefined}
          draggable={draggable}
        />

        {/* Content */}
        <div
          className="relative flex-1 overflow-auto"
          style={
            flip?.enabled && mode !== "expanded"
              ? { backfaceVisibility: "hidden" }
              : undefined
          }
        >
          <VBlockContent>{renderedContent}</VBlockContent>
        </div>

        {/* Resize handles */}
        {resizable && !isFullscreen && (
          <VBlockResize
            onResize={handleResize}
            onResizeStart={handleResizeStart}
            onResizeEnd={handleResizeEnd}
            minSize={minSize}
            maxSize={maxSize}
            currentSize={size}
          />
        )}
      </div>
    );

    // Context menu portal
    const contextMenuPortal =
      contextMenu &&
      createPortal(
        <VBlockContextMenu
          position={contextMenu}
          actions={allActions}
          onClose={() => setContextMenu(null)}
        />,
        document.body,
      );

    // Fullscreen portal
    if (isFullscreen) {
      return (
        <>
          {createPortal(
            <div
              className="fixed inset-0 bg-slate-900"
              style={{ zIndex: VBLOCK_Z.fullscreenOverlay }}
            >
              <div
                ref={setRefs}
                className="h-full w-full"
                style={{ zIndex: VBLOCK_Z.fullscreenContent }}
              >
                <VBlockErrorBoundary blockId={blockId}>
                  {blockContent}
                </VBlockErrorBoundary>
              </div>
            </div>,
            document.body,
          )}
          {contextMenuPortal}
        </>
      );
    }

    return (
      <VBlockErrorBoundary blockId={blockId}>
        {blockContent}
        {contextMenuPortal}
      </VBlockErrorBoundary>
    );
  },
);
