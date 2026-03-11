import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Slide, SlideElement, SlidePresentation, ShapeType } from "./types";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "./types";

// ─── Helpers ────────────────────────────────────────────────

function uid(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptySlide(): Slide {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    background: "#1e293b",
    elements: [],
  };
}

// ─── Store Interface ────────────────────────────────────────

interface SlidesStore {
  presentation: SlidePresentation;
  activeSlideId: string;
  selectedElementId: string | null;
  isPresenting: boolean;
  presentingSlideIndex: number;

  // Presentation
  setName: (name: string) => void;

  // Slide actions
  addSlide: () => void;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  setActiveSlide: (id: string) => void;
  reorderSlides: (fromIdx: number, toIdx: number) => void;
  setSlideBackground: (slideId: string, bg: string) => void;
  setSlideBackgroundImage: (slideId: string, url: string | undefined) => void;

  // Element actions
  addElement: (el: Partial<SlideElement> & { type: SlideElement["type"] }) => void;
  updateElement: (elId: string, updates: Partial<SlideElement>) => void;
  removeElement: (elId: string) => void;
  selectElement: (elId: string | null) => void;
  bringForward: (elId: string) => void;
  sendBackward: (elId: string) => void;

  // Quick add helpers
  addTextElement: () => void;
  addImageElement: (src: string) => void;
  addShapeElement: (shapeType: ShapeType) => void;

  // Presenter
  startPresenting: () => void;
  stopPresenting: () => void;
  nextSlide: () => void;
  prevSlide: () => void;

  // Helpers
  getActiveSlide: () => Slide;
  getSelectedElement: () => SlideElement | null;
}

// ─── Default ────────────────────────────────────────────────

const defaultSlide = createEmptySlide();
const defaultPresentation: SlidePresentation = {
  id: `pres-${Date.now()}`,
  name: "Untitled Presentation",
  slides: [defaultSlide],
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
};

// ─── Store ──────────────────────────────────────────────────

export const useSlidesStore = create<SlidesStore>()(
  persist(
    (set, get) => ({
      presentation: defaultPresentation,
      activeSlideId: defaultSlide.id,
      selectedElementId: null,
      isPresenting: false,
      presentingSlideIndex: 0,

      setName: (name) => set((s) => ({
        presentation: { ...s.presentation, name },
      })),

      // ── Slide actions ─────────────────────────────────────
      addSlide: () => set((s) => {
        const newSlide = createEmptySlide();
        return {
          presentation: {
            ...s.presentation,
            slides: [...s.presentation.slides, newSlide],
          },
          activeSlideId: newSlide.id,
          selectedElementId: null,
        };
      }),

      removeSlide: (id) => set((s) => {
        if (s.presentation.slides.length <= 1) return s;
        const filtered = s.presentation.slides.filter((sl) => sl.id !== id);
        return {
          presentation: { ...s.presentation, slides: filtered },
          activeSlideId: s.activeSlideId === id ? filtered[0].id : s.activeSlideId,
          selectedElementId: null,
        };
      }),

      duplicateSlide: (id) => set((s) => {
        const src = s.presentation.slides.find((sl) => sl.id === id);
        if (!src) return s;
        const dup: Slide = {
          ...JSON.parse(JSON.stringify(src)),
          id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        const idx = s.presentation.slides.findIndex((sl) => sl.id === id);
        const slides = [...s.presentation.slides];
        slides.splice(idx + 1, 0, dup);
        return {
          presentation: { ...s.presentation, slides },
          activeSlideId: dup.id,
          selectedElementId: null,
        };
      }),

      setActiveSlide: (id) => set({ activeSlideId: id, selectedElementId: null }),

      reorderSlides: (fromIdx, toIdx) => set((s) => {
        const slides = [...s.presentation.slides];
        const [moved] = slides.splice(fromIdx, 1);
        slides.splice(toIdx, 0, moved);
        return { presentation: { ...s.presentation, slides } };
      }),

      setSlideBackground: (slideId, bg) => set((s) => ({
        presentation: {
          ...s.presentation,
          slides: s.presentation.slides.map((sl) =>
            sl.id === slideId ? { ...sl, background: bg } : sl
          ),
        },
      })),

      setSlideBackgroundImage: (slideId, url) => set((s) => ({
        presentation: {
          ...s.presentation,
          slides: s.presentation.slides.map((sl) =>
            sl.id === slideId ? { ...sl, backgroundImage: url } : sl
          ),
        },
      })),

      // ── Element actions ───────────────────────────────────
      addElement: (partial) => set((s) => {
        const slide = s.presentation.slides.find((sl) => sl.id === s.activeSlideId);
        if (!slide) return s;
        const maxZ = slide.elements.reduce((max, e) => Math.max(max, e.zIndex), 0);
        const el: SlideElement = {
          id: uid(),
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          rotation: 0,
          zIndex: maxZ + 1,
          ...partial,
        };
        return {
          presentation: {
            ...s.presentation,
            slides: s.presentation.slides.map((sl) =>
              sl.id === s.activeSlideId
                ? { ...sl, elements: [...sl.elements, el] }
                : sl
            ),
          },
          selectedElementId: el.id,
        };
      }),

      updateElement: (elId, updates) => set((s) => ({
        presentation: {
          ...s.presentation,
          slides: s.presentation.slides.map((sl) =>
            sl.id === s.activeSlideId
              ? {
                  ...sl,
                  elements: sl.elements.map((e) =>
                    e.id === elId ? { ...e, ...updates } : e
                  ),
                }
              : sl
          ),
        },
      })),

      removeElement: (elId) => set((s) => ({
        presentation: {
          ...s.presentation,
          slides: s.presentation.slides.map((sl) =>
            sl.id === s.activeSlideId
              ? { ...sl, elements: sl.elements.filter((e) => e.id !== elId) }
              : sl
          ),
        },
        selectedElementId: s.selectedElementId === elId ? null : s.selectedElementId,
      })),

      selectElement: (elId) => set({ selectedElementId: elId }),

      bringForward: (elId) => set((s) => {
        const slide = s.presentation.slides.find((sl) => sl.id === s.activeSlideId);
        if (!slide) return s;
        const el = slide.elements.find((e) => e.id === elId);
        if (!el) return s;
        const maxZ = slide.elements.reduce((max, e) => Math.max(max, e.zIndex), 0);
        if (el.zIndex >= maxZ) return s;
        return {
          presentation: {
            ...s.presentation,
            slides: s.presentation.slides.map((sl) =>
              sl.id === s.activeSlideId
                ? {
                    ...sl,
                    elements: sl.elements.map((e) =>
                      e.id === elId ? { ...e, zIndex: e.zIndex + 1 } : e
                    ),
                  }
                : sl
            ),
          },
        };
      }),

      sendBackward: (elId) => set((s) => ({
        presentation: {
          ...s.presentation,
          slides: s.presentation.slides.map((sl) =>
            sl.id === s.activeSlideId
              ? {
                  ...sl,
                  elements: sl.elements.map((e) =>
                    e.id === elId ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e
                  ),
                }
              : sl
          ),
        },
      })),

      // ── Quick add helpers ─────────────────────────────────
      addTextElement: () => {
        get().addElement({
          type: "text",
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 100,
          width: 300,
          height: 60,
          content: "Double-click to edit",
          fontSize: 24,
          fontWeight: 400,
          color: "#e2e8f0",
          textAlign: "center",
          fontFamily: "Inter",
        });
      },

      addImageElement: (src) => {
        get().addElement({
          type: "image",
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          src,
          objectFit: "cover",
        });
      },

      addShapeElement: (shapeType) => {
        const isLine = shapeType === "line" || shapeType === "arrow";
        get().addElement({
          type: "shape",
          shapeType,
          x: 150 + Math.random() * 200,
          y: 150 + Math.random() * 100,
          width: isLine ? 200 : 150,
          height: isLine ? 4 : 150,
          fill: shapeType === "line" || shapeType === "arrow" ? "transparent" : "#3b82f6",
          stroke: "#3b82f6",
          strokeWidth: 2,
        });
      },

      // ── Presenter ─────────────────────────────────────────
      startPresenting: () => {
        const s = get();
        const idx = s.presentation.slides.findIndex((sl) => sl.id === s.activeSlideId);
        set({ isPresenting: true, presentingSlideIndex: Math.max(0, idx) });
      },

      stopPresenting: () => set({ isPresenting: false }),

      nextSlide: () => set((s) => ({
        presentingSlideIndex: Math.min(
          s.presentation.slides.length - 1,
          s.presentingSlideIndex + 1
        ),
      })),

      prevSlide: () => set((s) => ({
        presentingSlideIndex: Math.max(0, s.presentingSlideIndex - 1),
      })),

      // ── Helpers ───────────────────────────────────────────
      getActiveSlide: () => {
        const s = get();
        return s.presentation.slides.find((sl) => sl.id === s.activeSlideId) || s.presentation.slides[0];
      },

      getSelectedElement: () => {
        const s = get();
        if (!s.selectedElementId) return null;
        const slide = s.presentation.slides.find((sl) => sl.id === s.activeSlideId);
        return slide?.elements.find((e) => e.id === s.selectedElementId) || null;
      },
    }),
    {
      name: "cc-slides-store",
      partialize: (state) => ({
        presentation: state.presentation,
        activeSlideId: state.activeSlideId,
      }),
    }
  )
);
