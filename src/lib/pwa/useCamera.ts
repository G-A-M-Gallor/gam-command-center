"use client";

import { useState, useCallback, useRef } from "react";

export type CameraPermission = "prompt" | "granted" | "denied" | "unsupported";

export function useCamera() {
  const [permission, setPermission] = useState<CameraPermission>("prompt");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    "getUserMedia" in navigator.mediaDevices;

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setPermission("unsupported");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      // Stop tracks immediately — we just needed permission
      stream.getTracks().forEach((_t) => t.stop());
      streamRef.current = null;
      setPermission("granted");
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, [isSupported]);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    if (!isSupported) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      // Wait a frame for the camera to warm up
      await new Promise((r) => setTimeout(r, 300));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((_t) => t.stop());
      streamRef.current = null;

      const url = canvas.toDataURL("image/jpeg", 0.85);
      setPhotoUrl(url);
      setPermission("granted");
      return url;
    } catch {
      setPermission("denied");
      return null;
    }
  }, [isSupported]);

  const clearPhoto = useCallback(() => {
    setPhotoUrl(null);
  }, []);

  return { permission, isSupported, photoUrl, requestPermission, takePhoto, clearPhoto };
}
