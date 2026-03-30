"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useSlidesStore } from "@/lib/slides/slidesStore";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@/lib/slides/types";
import { SlideElementComponent } from "./SlideElement";

export function SlideCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const slide = useSlidesStore((s) => {
    const active = s.presentation.slides.find((sl) => sl.id === s.activeSlideId);
    return active || s.presentation.slides[0];
  });
  const selectedElementId = useSlidesStore((s) => s.selectedElementId);
  const selectElement = useSlidesStore((s) => s.selectElement);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const removeElement = useSlidesStore((s) => s.removeElement);

  // Auto-scale to fit container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const sx = (width - 40) / SLIDE_WIDTH;
      const sy = (height - 40) / SLIDE_HEIGHT;
      setScale(Math.min(sx, sy, 1));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleCanvasClick = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  // Handle image drop onto canvas
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const store = useSlidesStore.getState();
        store.addImageElement(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
      return;
    }
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url && /^https?:\/\//.test(url)) {
      const store = useSlidesStore.getState();
      store.addImageElement(url);
    }
  }, []);

  // Keyboard shortcuts for element manipulation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.contentEditable === "true") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeElement(selectedElementId);
      }
      if (e.key === "Escape") {
        selectElement(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedElementId, removeElement, selectElement]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 items-center justify-center overflow-hidden bg-slate-950/50"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        className="relative overflow-hidden rounded-lg shadow-2xl"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          background: slide.background || "#1e293b",
        }}
        onClick={handleCanvasClick}
      >
        {/* Background image */}
        {slide.backgroundImage && (
          <img
            src={slide.backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
        )}

        {/* Elements */}
        {slide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => (
            <SlideElementComponent
              key={el.id}
              element={el}
              isSelected={selectedElementId === el.id}
              scale={scale}
              onSelect={selectElement}
              onUpdate={updateElement}
            />
          ))}
      </div>
    </div>
  );
}
