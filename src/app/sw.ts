import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Static assets — immutable, cache-first
    {
      matcher: ({ _request, url }) =>
        url.pathname.startsWith("/_next/static/") ||
        request.destination === "font" ||
        /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/.test(url.pathname),
      handler: new (await import("serwist")).CacheFirst({
        cacheName: "static-assets",
        plugins: [
          new (await import("serwist")).ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // API: AI & Git — always network, never cache
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/ai/") ||
        url.pathname.startsWith("/api/git/"),
      handler: new (await import("serwist")).NetworkOnly(),
    },
    // API GET — stale-while-revalidate
    {
      matcher: ({ url, _request }) =>
        url.pathname.startsWith("/api/") && request.method === "GET",
      handler: new (await import("serwist")).StaleWhileRevalidate({
        cacheName: "api-cache",
        plugins: [
          new (await import("serwist")).ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 min
          }),
        ],
      }),
    },
    // Dashboard navigation — network-first with offline fallback
    {
      matcher: ({ _request, url }) =>
        request.mode === "navigate" && url.pathname.startsWith("/dashboard"),
      handler: new (await import("serwist")).NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 30,
        plugins: [
          new (await import("serwist")).ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ _request }) => request.destination === "document",
      },
    ],
  },
});

// ─── Push Notifications ──────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; icon?: string; badge?: string; url?: string; tag?: string };
  try {
    data = event.data.json();
  } catch {
    data = { title: "GAM CC", body: event.data.text() };
  }

  const options: NotificationOptions = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    tag: data.tag || "gam-cc-notification",
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(data.title || "GAM CC", options));
});

// ─── Notification Click — focus or open dashboard ────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});

// ─── Badge update via message ────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_BADGE") {
    const count = event.data.count as number;
    if ("setAppBadge" in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count);
      } else {
        self.navigator.clearAppBadge();
      }
    }
  }
});

serwist.addEventListeners();
