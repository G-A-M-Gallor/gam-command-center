"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSlidesStore } from "@/lib/slides/slidesStore";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@/lib/slides/types";
import { SlideElementComponent } from "./SlideElement";
import { _X } from "lucide-react";

interface SlidePresenterProps {
  t: Record<string, string>;
}

export function SlidePresenter({ _t }: SlidePresenterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isPresenting = useSlidesStore((s) => s.isPresenting);
  const slides = useSlidesStore((s) => s.presentation.slides);
  const slideIndex = useSlidesStore((s) => s.presentingSlideIndex);
  const stopPresenting = useSlidesStore((s) => s.stopPresenting);
  const nextSlide = useSlidesStore((s) => s.nextSlide);
  const prevSlide = useSlidesStore((s) => s.prevSlide);

  const slide = slides[slideIndex];

  // Enter fullscreen
  useEffect(() => {
    if (!isPresenting || !containerRef.current) return;
    containerRef.current.requestFullscreen?.().catch(() => {
      // Fullscreen not available, still show presenter overlay
    });
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => { /* no-op */ });
      }
    };
  }, [isPresenting]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isPresenting) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          nextSlide();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          prevSlide();
          break;
        case "Escape":
          stopPresenting();
          break;
      }
    },
    [isPresenting, nextSlide, prevSlide, stopPresenting]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Listen for fullscreen exit
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && isPresenting) {
        stopPresenting();
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [isPresenting, stopPresenting]);

  if (!isPresenting || !slide) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      onClick={nextSlide}
    >
      {/* Slide */}
      <div
        className="relative"
        style={{
          width: "100vw",
          height: "100vh",
          background: slide.background || "#1e293b",
        }}
      >
        {slide.backgroundImage && (
          <img
            src={slide.backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
        )}

        {/* Scale elements to fill viewport */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${Math.min(window.innerWidth / SLIDE_WIDTH, window.innerHeight / SLIDE_HEIGHT)})`,
            transformOrigin: "top left",
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
          }}
        >
          {slide.elements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => (
              <SlideElementComponent
                key={el.id}
                element={el}
                isSelected={false}
                scale={1}
                onSelect={() => { /* no-op */ }}
                onUpdate={() => { /* no-op */ }}
              />
            ))}
        </div>
      </div>

      {/* Exit button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); stopPresenting(); }}
        className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white/70 hover:text-white transition-colors"
        title={t.exitPresentation || "Exit"}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Slide counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70">
        {slideIndex + 1} / {slides.length}
      </div>
    </div>
  );
}
