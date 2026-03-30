"use client";

import { useState } from "react";
import {
  Type, ImagePlus, Square, Play, ArrowUp, ArrowDown,
  Trash2, Circle, MoveRight, Minus, Palette,
} from "lucide-react";
import { useSlidesStore } from "@/lib/slides/slidesStore";
import type { ShapeType } from "@/lib/slides/types";
import { ColorPickerPopover } from "@/components/grid/ColorPickerPopover";

interface SlideToolbarProps {
  t: Record<string, string>;
}

function ToolbarBtn({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active
          ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export function SlideToolbar({ _t }: SlideToolbarProps) {
  const addTextElement = useSlidesStore((s) => s.addTextElement);
  const addShapeElement = useSlidesStore((s) => s.addShapeElement);
  const addImageElement = useSlidesStore((s) => s.addImageElement);
  const bringForward = useSlidesStore((s) => s.bringForward);
  const sendBackward = useSlidesStore((s) => s.sendBackward);
  const removeElement = useSlidesStore((s) => s.removeElement);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const startPresenting = useSlidesStore((s) => s.startPresenting);
  const selectedElementId = useSlidesStore((s) => s.selectedElementId);
  const selectedEl = useSlidesStore((s) => s.getSelectedElement());

  const activeSlide = useSlidesStore((s) => s.getActiveSlide());
  const setSlideBackground = useSlidesStore((s) => s.setSlideBackground);
  const activeSlideId = useSlidesStore((s) => s.activeSlideId);

  const [showShapes, setShowShapes] = useState(false);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => addImageElement(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const shapes: { type: ShapeType; icon: React.ElementType; label: string }[] = [
    { type: "rectangle", icon: Square, label: t.rectangle || "Rectangle" },
    { type: "circle", icon: Circle, label: t.circle || "Circle" },
    { type: "arrow", icon: MoveRight, label: t.arrow || "Arrow" },
    { type: "line", icon: Minus, label: t.line || "Line" },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-700/50 bg-slate-800/50 px-3 py-1">
      {/* Insert tools */}
      <ToolbarBtn onClick={addTextElement} title={t.addText || "Add Text"}>
        <Type className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={handleImageUpload} title={_t.addImage || "Add Image"}>
        <ImagePlus className="h-4 w-4" />
      </ToolbarBtn>

      {/* Shapes dropdown */}
      <div className="relative">
        <ToolbarBtn onClick={() => setShowShapes(!showShapes)} title={t.addShape || "Add Shape"} active={showShapes}>
          <Square className="h-4 w-4" />
        </ToolbarBtn>
        {showShapes && (
          <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-white/[0.08] bg-slate-900 p-1 shadow-xl">
            {shapes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => { addShapeElement(type); setShowShapes(false); }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-1 h-5 w-px bg-slate-700/50" />

      {/* Slide background */}
      <ColorPickerPopover
        value={activeSlide.background}
        onChange={(c) => setSlideBackground(activeSlideId, c)}
      >
        <button
          type="button"
          title={t.fillColor || "Slide Background"}
          className="flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <Palette className="h-3.5 w-3.5" />
          <div className="h-3 w-3 rounded border border-slate-600" style={{ backgroundColor: activeSlide.background }} />
        </button>
      </ColorPickerPopover>

      {/* Element-specific tools (when selected) */}
      {selectedElementId && selectedEl && (
        <>
          <div className="mx-1 h-5 w-px bg-slate-700/50" />

          {selectedEl.type === "text" && (
            <>
              <input
                type="number"
                value={selectedEl.fontSize || 24}
                onChange={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) || 24 })}
                className="h-7 w-12 rounded border border-slate-700/50 bg-slate-900 px-1 text-center text-xs text-slate-200 outline-none"
                min={8}
                max={200}
                title={t.fontSize || "Font Size"}
              />
              <ColorPickerPopover
                value={selectedEl.color}
                onChange={(c) => updateElement(selectedElementId, { color: c })}
              >
                <button
                  type="button"
                  title={t.textColor || "Text Color"}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800"
                >
                  <span className="text-sm font-bold" style={{ color: selectedEl.color || "#e2e8f0" }}>A</span>
                </button>
              </ColorPickerPopover>
            </>
          )}

          {selectedEl.type === "shape" && (
            <ColorPickerPopover
              value={selectedEl.fill}
              onChange={(c) => updateElement(selectedElementId, { fill: c })}
            >
              <button
                type="button"
                title={t.fillColor || "Fill Color"}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800"
              >
                <div className="h-3.5 w-3.5 rounded border border-slate-600" style={{ backgroundColor: selectedEl.fill || "#3b82f6" }} />
              </button>
            </ColorPickerPopover>
          )}

          <ToolbarBtn onClick={() => bringForward(selectedElementId)} title={t.bringForward || "Bring Forward"}>
            <ArrowUp className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => sendBackward(selectedElementId)} title={t.sendBackward || "Send Backward"}>
            <ArrowDown className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => removeElement(selectedElementId)} title={t.deleteElement || "Delete"}>
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </ToolbarBtn>
        </>
      )}

      {/* Spacer + Present button */}
      <div className="flex-1" />
      <button
        type="button"
        onClick={startPresenting}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)]"
      >
        <Play className="h-3.5 w-3.5" />
        {t.present || "Present"}
      </button>
    </div>
  );
}
