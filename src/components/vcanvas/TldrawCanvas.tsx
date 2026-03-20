"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { CanvasContext } from "@/lib/vcanvas/canvasConfig";
import { loadFeatures } from "@/lib/vcanvas/canvasConfig";
import type { CanvasFeatures } from "@/lib/vcanvas/canvasConfig";

// Dynamic import — tldraw doesn't support SSR
const Tldraw = dynamic(() => import("tldraw").then((mod) => ({ default: mod.Tldraw })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <Loader2 size={20} className="animate-spin text-slate-500" />
    </div>
  ),
});

// CSS loaded via side-effect import
let cssLoaded = false;
function ensureCSS() {
  if (cssLoaded || typeof document === "undefined") return;
  cssLoaded = true;
  // @ts-expect-error -- CSS module import
  import("tldraw/tldraw.css");
}

interface Props {
  /** Unique persistence key — each canvas gets its own storage */
  persistenceKey: string;
  /** Which context controls feature toggles */
  context: CanvasContext;
  /** Override features (optional — defaults loaded from config) */
  features?: Partial<CanvasFeatures>;
  /** Height class */
  className?: string;
}

/** Map features to tldraw component props */
function featuresToProps(features: CanvasFeatures) {
  // Build list of hidden tools
  const hiddenTools: string[] = [];
  if (!features.draw) hiddenTools.push("draw", "highlight");
  if (!features.shapes) hiddenTools.push("geo", "arrow", "line");
  if (!features.text) hiddenTools.push("text");
  if (!features.note) hiddenTools.push("note");
  if (!features.media) hiddenTools.push("asset");
  if (!features.frame) hiddenTools.push("frame");
  if (!features.hand) hiddenTools.push("hand");
  if (!features.eraser) hiddenTools.push("eraser");
  if (!features.laser) hiddenTools.push("laser");

  return {
    hiddenTools,
    hidePages: !features.pages,
    hideDebug: !features.debug,
  };
}

export function TldrawCanvas({ persistenceKey, context, features: featureOverrides, className = "h-full" }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ensureCSS();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center bg-slate-950 ${className}`}>
        <Loader2 size={20} className="animate-spin text-slate-500" />
      </div>
    );
  }

  const features = { ...loadFeatures(context), ...featureOverrides };
  const { hiddenTools, hidePages, hideDebug } = featuresToProps(features);

  return (
    <div className={className} style={{ position: "relative" }}>
      <style>{`
        .tl-container { background: var(--color-background, #0f172a) !important; }
        .tlui-layout { font-family: inherit; }
      `}</style>
      <Tldraw
        persistenceKey={persistenceKey}
        inferDarkMode
        options={{
          maxPages: hidePages ? 1 : 40,
        }}
      />
    </div>
  );
}
