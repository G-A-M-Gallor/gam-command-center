"use client";

import { useGibberishDetect } from "@/lib/hooks/useGibberishDetect";

/** Renderless component that activates gibberish auto-detection. */
export function GibberishDetector() {
  useGibberishDetect();
  return null;
}
