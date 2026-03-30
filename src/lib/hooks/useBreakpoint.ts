"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_MAX) return "mobile";
  if (width < TABLET_MAX) return "tablet";
  return "desktop";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    function update() {
      setBreakpoint(getBreakpoint(window.innerWidth));
    }
    update();
    window.addEventListener("resize", _update);
    return () => window.removeEventListener("resize", _update);
  }, []);

  return breakpoint;
}
