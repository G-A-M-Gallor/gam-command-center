"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VBlockMode, VBlockSize, VBlockEvent } from "./vBlock.types";
import { VBLOCK_BREAKPOINTS } from "./vBlock.types";

const DEFAULT_SIZE: VBlockSize = { width: 300, height: 200 };
const DEFAULT_MIN: VBlockSize = { width: 120, height: 80 };
const DEFAULT_MAX: VBlockSize = { width: 1200, height: 900 };

function computeMode(size: VBlockSize): VBlockMode {
  const { _compact, standard, expanded } = VBLOCK_BREAKPOINTS;
  if (size.width <= compact.maxWidth && size.height <= _compact.maxHeight) return "compact";
  if (size.width <= standard.maxWidth && size.height <= standard.maxHeight) return "standard";
  if (size.width <= expanded.maxWidth && size.height <= expanded.maxHeight) return "expanded";
  return "expanded"; // fullscreen is set explicitly
}

interface UseVBlockOptions {
  blockId: string;
  initialSize?: VBlockSize;
  controlledSize?: VBlockSize;
  minSize?: VBlockSize;
  maxSize?: VBlockSize;
  onEvent?: (event: VBlockEvent) => void;
}

export function useVBlock({
  blockId,
  initialSize,
  controlledSize,
  minSize = DEFAULT_MIN,
  maxSize = DEFAULT_MAX,
  onEvent,
}: UseVBlockOptions) {
  const [internalSize, setInternalSize] = useState<VBlockSize>(
    controlledSize ?? initialSize ?? DEFAULT_SIZE,
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [frozenMode, setFrozenMode] = useState<VBlockMode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const size = controlledSize ?? internalSize;
  const mode: VBlockMode = isFullscreen
    ? "fullscreen"
    : frozenMode ?? computeMode(size);

  // Sync controlled size
  useEffect(() => {
    if (controlledSize) setInternalSize(controlledSize);
  }, [controlledSize]);

  // ResizeObserver for actual DOM size
  useEffect(() => {
    const el = containerRef.current;
    if (!el || controlledSize) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && !isResizing) {
          setInternalSize({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [controlledSize, isResizing]);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Freeze mode during resize
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    setFrozenMode(computeMode(size));
  }, [size]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setFrozenMode(null);
    onEvent?.({
      type: "block.resized",
      blockId,
      size,
      mode: computeMode(size),
    });
  }, [blockId, size, onEvent]);

  const handleResize = useCallback(
    (newSize: VBlockSize) => {
      const clamped: VBlockSize = {
        width: Math.max(minSize.width, Math.min(maxSize.width, newSize.width)),
        height: Math.max(minSize.height, Math.min(maxSize.height, newSize.height)),
      };
      setInternalSize(clamped);
    },
    [minSize, maxSize],
  );

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    onEvent?.({ type: "block.fullscreen.requested", blockId });
  }, [blockId, onEvent]);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    onEvent?.({ type: "block.fullscreen.exited", blockId });
  }, [blockId, onEvent]);

  return {
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
  };
}
