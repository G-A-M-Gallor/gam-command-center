"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const isSupported =
    typeof navigator !== "undefined" && "wakeLock" in navigator;

  const request = useCallback(async () => {
    if (!isSupported) return false;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      lockRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener("release", () => {
        lockRef.current = null;
        setIsActive(false);
      });

      return true;
    } catch {
      return false;
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (lockRef.current) {
      await lockRef.current.release();
      lockRef.current = null;
      setIsActive(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isActive) {
      await release();
    } else {
      await request();
    }
  }, [isActive, request, release]);

  // Release on unmount
  useEffect(() => {
    return () => {
      lockRef.current?.release();
    };
  }, []);

  return { isActive, isSupported, request, release, toggle };
}
