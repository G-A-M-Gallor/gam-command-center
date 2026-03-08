/**
 * Update the app badge count (PWA installed apps).
 * Falls back silently if Badge API is not available.
 */
export async function updateAppBadge(count: number): Promise<void> {
  // App Badge API (installed PWA)
  if ("setAppBadge" in navigator) {
    try {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    } catch {
      // Not supported or permission denied — ignore
    }
  }

  // Also tell the SW so it can update badge on its end
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "SET_BADGE", count });
  }
}
