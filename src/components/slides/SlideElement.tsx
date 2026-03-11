"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SlideElement as SlideElementType } from "@/lib/slides/types";

interface SlideElementProps {
  element: SlideElementType;
  isSelected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SlideElementType>) => void;
}

export function SlideElementComponent({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: SlideElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing || isResizing) return;
    e.stopPropagation();
    onSelect(element.id);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, elX: element.x, elY: element.y };
  }, [element.id, element.x, element.y, isEditing, isResizing, onSelect]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      onUpdate(element.id, {
        x: dragStart.current.elX + dx,
        y: dragStart.current.elY + dy,
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, element.id, scale, onUpdate]);

  // Resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: element.width, h: element.height };
  }, [element.width, element.height]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStart.current.x) / scale;
      const dy = (e.clientY - resizeStart.current.y) / scale;
      onUpdate(element.id, {
        width: Math.max(20, resizeStart.current.w + dx),
        height: Math.max(20, resizeStart.current.h + dy),
      });
    };
    const handleUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing, element.id, scale, onUpdate]);

  // Double-click to edit text
  const handleDoubleClick = useCallback(() => {
    if (element.type === "text") {
      setIsEditing(true);
      setTimeout(() => textRef.current?.focus(), 0);
    }
  }, [element.type]);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
    if (textRef.current) {
      onUpdate(element.id, { content: textRef.current.innerText });
    }
  }, [element.id, onUpdate]);

  // Render element content
  const renderContent = () => {
    switch (element.type) {
      case "text":
        return isEditing ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsEditing(false);
                textRef.current?.blur();
              }
            }}
            className="h-full w-full outline-none"
            style={{
              fontFamily: element.fontFamily || "Inter",
              fontSize: element.fontSize || 24,
              fontWeight: element.fontWeight || 400,
              fontStyle: element.fontStyle || "normal",
              textAlign: element.textAlign || "left",
              color: element.color || "#e2e8f0",
              lineHeight: 1.3,
            }}
          >
            {element.content}
          </div>
        ) : (
          <div
            className="h-full w-full overflow-hidden"
            style={{
              fontFamily: element.fontFamily || "Inter",
              fontSize: element.fontSize || 24,
              fontWeight: element.fontWeight || 400,
              fontStyle: element.fontStyle || "normal",
              textAlign: element.textAlign || "left",
              color: element.color || "#e2e8f0",
              lineHeight: 1.3,
            }}
          >
            {element.content || ""}
          </div>
        );

      case "image":
        return element.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.src}
            alt=""
            className="h-full w-full pointer-events-none"
            style={{ objectFit: element.objectFit || "cover" }}
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500 text-xs">
            Image
          </div>
        );

      case "shape":
        return renderShape();

      default:
        return null;
    }
  };

  const renderShape = () => {
    const { shapeType, fill = "#3b82f6", stroke = "#3b82f6", strokeWidth = 2 } = element;

    switch (shapeType) {
      case "rectangle":
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
            <rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={element.width - strokeWidth}
              height={element.height - strokeWidth}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              rx={4}
            />
          </svg>
        );
      case "circle":
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
            <ellipse
              cx={element.width / 2}
              cy={element.height / 2}
              rx={element.width / 2 - strokeWidth / 2}
              ry={element.height / 2 - strokeWidth / 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      case "arrow":
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
            <defs>
              <marker id={`arrow-${element.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
              </marker>
            </defs>
            <line
              x1="0"
              y1={element.height / 2}
              x2={element.width - 10}
              y2={element.height / 2}
              stroke={stroke}
              strokeWidth={strokeWidth}
              markerEnd={`url(#arrow-${element.id})`}
            />
          </svg>
        );
      case "line":
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
            <line
              x1="0"
              y1={element.height / 2}
              x2={element.width}
              y2={element.height / 2}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}

      {/* Selection border + resize handles */}
      {isSelected && (
        <>
          <div className="absolute inset-0 border-2 border-[var(--cc-accent-500)] pointer-events-none rounded-sm" />
          {/* Resize handle (bottom-right) */}
          <div
            className="absolute -bottom-1 -right-1 h-3 w-3 rounded-sm bg-[var(--cc-accent-500)] cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          />
          {/* Corner indicators */}
          <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-[var(--cc-accent-500)] pointer-events-none" />
          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--cc-accent-500)] pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-[var(--cc-accent-500)] pointer-events-none" />
        </>
      )}
    </div>
  );
}
