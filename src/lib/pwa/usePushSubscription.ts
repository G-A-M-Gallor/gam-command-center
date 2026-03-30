"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushState = "unsupported" | "denied" | "prompt" | "subscribed" | "loading";

export function usePushSubscription() {
  const [state, setState] = useState<PushState>("loading");
  const [hasVapidKey, setHasVapidKey] = useState(!!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const vapidKeyRef = useRef<string | null>(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
  );

  const browserSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  // Fetch VAPID key from server if not available at build time
  useEffect(() => {
    if (!browserSupported) {
      setState("unsupported");
      return;
    }

    async function init() {
      // If key wasn't baked in at build time, fetch from server
      if (!vapidKeyRef.current) {
        try {
          const res = await fetch("/api/push/config");
          const data = await res.json();
          if (data.vapidPublicKey) {
            vapidKeyRef.current = data.vapidPublicKey;
            setHasVapidKey(true);
          }
        } catch {
          // Server unreachable — push unsupported
        }
      }

      if (!vapidKeyRef.current) {
        setState("unsupported");
        return;
      }

      const permission = Notification.permission;
      if (permission === "denied") {
        setState("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "prompt");
    }

    init();
  }, [browserSupported]);

  const subscribe = useCallback(async () => {
    if (!browserSupported || !vapidKeyRef.current) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKeyRef.current)
          .buffer as ArrayBuffer,
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
        }),
      });

      if (res.ok) {
        setState("subscribed");
        return true;
      }
      return false;
    } catch {
      if (Notification.permission === "denied") {
        setState("denied");
      }
      return false;
    }
  }, [browserSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          _headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setState("prompt");
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    state,
    isSupported: browserSupported && hasVapidKey,
    subscribe,
    unsubscribe,
  };
}
