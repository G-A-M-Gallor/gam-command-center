"use client";

import { useState, useEffect } from "react";

export interface DeviceCapabilities {
  share: boolean;
  wakeLock: boolean;
  vibration: boolean;
  geolocation: boolean;
  badge: boolean;
  backgroundSync: boolean;
  serviceWorker: boolean;
  camera: boolean;
  contacts: boolean;
  pushManager: boolean;
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const [caps, setCaps] = useState<DeviceCapabilities>({
    share: false,
    wakeLock: false,
    vibration: false,
    geolocation: false,
    badge: false,
    backgroundSync: false,
    serviceWorker: false,
    camera: false,
    contacts: false,
    pushManager: false,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setCaps({
      share: "share" in navigator,
      wakeLock: "wakeLock" in navigator,
      vibration: "vibrate" in navigator,
      geolocation: "geolocation" in navigator,
      badge: "setAppBadge" in navigator,
      backgroundSync:
        "serviceWorker" in navigator &&
        "SyncManager" in window,
      serviceWorker: "serviceWorker" in navigator,
      camera:
        "mediaDevices" in navigator &&
        "getUserMedia" in navigator.mediaDevices,
      contacts: "contacts" in navigator && "ContactsManager" in window,
      pushManager: "PushManager" in window,
    });
  }, []);

  return caps;
}
