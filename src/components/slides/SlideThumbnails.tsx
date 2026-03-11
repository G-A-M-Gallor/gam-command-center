"use client";

import { Plus, Copy, Trash2 } from "lucide-react";
import { useSlidesStore } from "@/lib/slides/slidesStore";
import { SLIDE_WIDTH, SLIDE_HEIGHT, THUMBNAIL_SCALE } from "@/lib/slides/types";
import { SlideElementComponent } from "./SlideElement";

interface SlideThumbnailsProps {
  t: Record<string, string>;
}

export function SlideThumbnails({ t }: SlideThumbnailsProps) {
  const slides = useSlidesStore((s) => s.presentation.slides);
  const activeSlideId = useSlidesStore((s) => s.activeSlideId);
  const setActiveSlide = useSlidesStore((s) => s.setActiveSlide);
  const addSlide = useSlidesStore((s) => s.addSlide);
  const removeSlide = useSlidesStore((s) => s.removeSlide);
  const duplicateSlide = useSlidesStore((s) => s.duplicateSlide);

  const thumbW = SLIDE_WIDTH * THUMBNAIL_SCALE;
  const thumbH = SLIDE_HEIGHT * THUMBNAIL_SCALE;

  return (
    <div className="flex w-52 shrink-0 flex-col border-r border-slate-700/50 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          {t.slides || "Slides"}
        </span>
        <button
          type="button"
          onClick={addSlide}
          title={t.addSlide || "Add Slide"}
          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`group relative cursor-pointer rounded-lg border-2 transition-colors ${
              slide.id === activeSlideId
                ? "border-[var(--cc-accent-500)]"
                : "border-transparent hover:border-slate-600"
            }`}
            onClick={() => setActiveSlide(slide.id)}
          >
            {/* Slide number */}
            <div className="absolute left-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded bg-black/50 text-[8px] font-bold text-white">
              {idx + 1}
            </div>

            {/* Thumbnail */}
            <div
              className="relative overflow-hidden rounded"
              style={{
                width: thumbW,
                height: thumbH,
                background: slide.background || "#1e293b",
              }}
            >
              {slide.backgroundImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.backgroundImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              )}
              <div
                style={{
                  transform: `scale(${THUMBNAIL_SCALE})`,
                  transformOrigin: "top left",
                  width: SLIDE_WIDTH,
                  height: SLIDE_HEIGHT,
                  position: "relative",
                }}
              >
                {slide.elements.map((el) => (
                  <SlideElementComponent
                    key={el.id}
                    element={el}
                    isSelected={false}
                    scale={THUMBNAIL_SCALE}
                    onSelect={() => {}}
                    onUpdate={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* Hover actions */}
            <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }}
                title={t.duplicateSlide || "Duplicate"}
                className="rounded bg-black/50 p-0.5 text-slate-300 hover:text-white"
              >
                <Copy className="h-3 w-3" />
              </button>
              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}
                  title={t.deleteSlide || "Delete"}
                  className="rounded bg-black/50 p-0.5 text-slate-300 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
