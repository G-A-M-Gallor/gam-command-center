"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Circle,
  Square,
  Pause,
  Play,
  Download,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Monitor,
  Camera,
} from "lucide-react";

type Phase = "setup" | "recording" | "processing" | "done";

interface RecordingPrefs {
  enableCamera: boolean;
  enableMic: boolean;
  enableSystemAudio: boolean;
  bubblePosition: string;
  bubbleSize: number;
  cameraDeviceId: string;
  micDeviceId: string;
}

export default function RecordPage() {
  const { language } = useSettings();
  const isRtl = language === "he";

  const [phase, setPhase] = useState<Phase>("setup");
  const [prefs, setPrefs] = useState<RecordingPrefs>({
    enableCamera: true,
    enableMic: true,
    enableSystemAudio: false,
    bubblePosition: "bottom-right",
    bubbleSize: 150,
    cameraDeviceId: "",
    micDeviceId: "",
  });

  // Devices
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);

  // Recording state
  const [timer, setTimer] = useState("00:00");
  const [isPaused, setIsPaused] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);

  // Done state
  const [watchUrl, setWatchUrl] = useState("");
  const [clipDuration, setClipDuration] = useState("");
  const [clipSize, setClipSize] = useState("");
  const [copied, setCopied] = useState(false);

  // Refs
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rawBlobRef = useRef<Blob | null>(null);
  const compressedBlobRef = useRef<Blob | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const pauseStartRef = useRef(0);

  // Enumerate devices on mount
  useEffect(() => {
    (async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach((t) => t.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameras(devices.filter((d) => d.kind === "videoinput"));
        setMics(devices.filter((d) => d.kind === "audioinput"));
      } catch {
        // No permission
      }
    })();
  }, []);

  // Start camera preview
  useEffect(() => {
    if (!prefs.enableCamera || phase !== "setup") return;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        const videoConstraints = prefs.cameraDeviceId
          ? { deviceId: { exact: prefs.cameraDeviceId }, width: 320, height: 320 }
          : { width: 320, height: 320, facingMode: "user" as const };
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
        if (cameraPreviewRef.current) {
          cameraPreviewRef.current.srcObject = stream;
        }
      } catch {}
    })();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [prefs.enableCamera, prefs.cameraDeviceId, phase]);

  // ── Start Recording ──
  const startRecording = useCallback(async () => {
    try {
      setStatusText(isRtl ? "בוחר מסך..." : "Select screen...");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: prefs.enableSystemAudio,
      });
      screenStreamRef.current = screenStream;

      const videoTrack = screenStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const screenW = settings.width || 1920;
      const screenH = settings.height || 1080;

      const canvas = canvasRef.current!;
      canvas.width = screenW;
      canvas.height = screenH;
      const ctx = canvas.getContext("2d")!;

      // Screen video element
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      await screenVideo.play();

      // Camera video element
      let cameraVideo: HTMLVideoElement | null = null;
      if (prefs.enableCamera) {
        try {
          const videoConstraints = prefs.cameraDeviceId
            ? { deviceId: { exact: prefs.cameraDeviceId }, width: 320, height: 320 }
            : { width: 320, height: 320, facingMode: "user" as const };
          const audioConstraints = prefs.enableMic
            ? (prefs.micDeviceId ? { deviceId: { exact: prefs.micDeviceId } } : true)
            : false;
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          });
          cameraStreamRef.current = camStream;
          cameraVideo = document.createElement("video");
          cameraVideo.srcObject = camStream;
          cameraVideo.muted = true;
          await cameraVideo.play();
        } catch {}
      }

      // Bubble position
      const bubbleSize = prefs.bubbleSize;
      const bubblePad = 24;
      const getBubblePos = () => {
        switch (prefs.bubblePosition) {
          case "bottom-left": return { x: bubblePad + bubbleSize / 2, y: screenH - bubblePad - bubbleSize / 2 };
          case "top-left": return { x: bubblePad + bubbleSize / 2, y: bubblePad + bubbleSize / 2 };
          case "top-right": return { x: screenW - bubblePad - bubbleSize / 2, y: bubblePad + bubbleSize / 2 };
          default: return { x: screenW - bubblePad - bubbleSize / 2, y: screenH - bubblePad - bubbleSize / 2 };
        }
      };

      // Composite loop
      const drawFrame = () => {
        ctx.drawImage(screenVideo, 0, 0, screenW, screenH);
        if (cameraVideo && prefs.enableCamera) {
          const { x, y } = getBubblePos();
          const r = bubbleSize / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.translate(x + r, y - r);
          ctx.scale(-1, 1);
          ctx.drawImage(cameraVideo, 0, 0, bubbleSize, bubbleSize);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        animFrameRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Audio mix
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      if (prefs.enableMic && cameraStreamRef.current) {
        const micSource = audioCtx.createMediaStreamSource(
          new MediaStream(cameraStreamRef.current.getAudioTracks())
        );
        micSource.connect(dest);
      }
      if (prefs.enableSystemAudio && screenStream.getAudioTracks().length > 0) {
        const sysSource = audioCtx.createMediaStreamSource(
          new MediaStream(screenStream.getAudioTracks())
        );
        sysSource.connect(dest);
      }

      // Final stream
      const canvasStream = canvas.captureStream(30);
      const finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm;codecs=vp8,opus";

      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        cancelAnimationFrame(animFrameRef.current);
        rawBlobRef.current = new Blob(chunksRef.current, { type: mimeType });
        onRecordingStopped();
      };

      recorder.start(1000);
      recorderRef.current = recorder;

      // Handle screen share ended
      videoTrack.addEventListener("ended", () => stopRecording());

      // Start timer
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
          const secs = Math.floor(elapsed / 1000);
          const m = String(Math.floor(secs / 60)).padStart(2, "0");
          const s = String(secs % 60).padStart(2, "0");
          setTimer(`${m}:${s}`);
        }
      }, 500);

      setPhase("recording");
      setStatusText("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatusText(msg === "Permission denied" || msg === "Permission denied by user"
        ? (isRtl ? "ההקלטה בוטלה" : "Recording cancelled")
        : msg);
    }
  }, [prefs, isRtl, isPaused]);

  // ── Pause / Resume ──
  const togglePause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (isPaused) {
      recorder.resume();
      pausedTimeRef.current += Date.now() - pauseStartRef.current;
      setIsPaused(false);
    } else {
      recorder.pause();
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isPaused]);

  // ── Stop ──
  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ── After recording ──
  const onRecordingStopped = useCallback(async () => {
    setPhase("processing");
    const raw = rawBlobRef.current!;
    const rawSizeMB = (raw.size / (1024 * 1024)).toFixed(1);
    setStatusText(`${isRtl ? "סרטון גולמי" : "Raw"}: ${rawSizeMB} MB`);
    setProgress(10);

    // Try ffmpeg compression
    let compressed = raw;
    try {
      const { FFmpeg } = await import("https://esm.sh/@ffmpeg/ffmpeg@0.12.10" as string);
      const { fetchFile } = await import("https://esm.sh/@ffmpeg/util@0.12.1" as string);
      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
        setProgress(10 + Math.min(p, 1) * 60);
        setStatusText(`${isRtl ? "מכווץ" : "Compressing"}... ${Math.round(p * 100)}%`);
      });
      await ffmpeg.load({
        coreURL: "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
        wasmURL: "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
      });
      await ffmpeg.writeFile("input.webm", await fetchFile(raw));
      await ffmpeg.exec([
        "-i", "input.webm",
        "-vf", "scale='min(1280,iw)':-2",
        "-c:v", "libx264", "-preset", "fast", "-crf", "28",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", "-y", "output.mp4",
      ]);
      const data = await ffmpeg.readFile("output.mp4");
      compressed = new Blob([data.buffer], { type: "video/mp4" });
    } catch {
      // Use raw if ffmpeg fails
    }
    compressedBlobRef.current = compressed;

    // Upload
    setStatusText(isRtl ? "מעלה..." : "Uploading...");
    setProgress(75);
    try {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
      const durationSec = Math.floor(elapsed / 1000);
      const formData = new FormData();
      formData.append("file", compressed, `vclip-${Date.now()}.mp4`);
      formData.append("duration_seconds", String(durationSec));

      const res = await fetch("/api/vclip/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { watch_url } = await res.json();
      setWatchUrl(watch_url);
      setProgress(100);

      const m = Math.floor(durationSec / 60);
      const s = durationSec % 60;
      setClipDuration(`${m}:${String(s).padStart(2, "0")}`);
      setClipSize(`${(compressed.size / (1024 * 1024)).toFixed(1)} MB`);
      setPhase("done");
    } catch {
      setStatusText(isRtl ? "שגיאת העלאה — אפשר להוריד" : "Upload failed — download available");
      setClipSize(`${(compressed.size / (1024 * 1024)).toFixed(1)} MB`);
      setPhase("done");
    }
  }, [isRtl]);

  // ── Download ──
  const downloadClip = () => {
    const blob = compressedBlobRef.current || rawBlobRef.current;
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vclip-${Date.now()}.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
    a.click();
  };

  // ── Copy link ──
  const copyLink = () => {
    navigator.clipboard.writeText(watchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePref = <K extends keyof RecordingPrefs>(key: K, val: RecordingPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const positions = [
    { id: "top-left", label: "↖" },
    { id: "top-right", label: "↗" },
    { id: "bottom-left", label: "↙" },
    { id: "bottom-right", label: "↘" },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-full items-center justify-center bg-slate-950 p-6">
      {/* ── Setup ── */}
      {phase === "setup" && (
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">vClip</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isRtl ? "הקלט מסך + בועת פנים" : "Record screen + face bubble"}
            </p>
          </div>

          {/* Camera preview */}
          {prefs.enableCamera && (
            <div className="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full border-2 border-purple-500/50 bg-slate-900">
              <video
                ref={cameraPreviewRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-cover"
              />
            </div>
          )}

          {/* Toggles */}
          <div className="mb-4 space-y-2">
            {[
              { key: "enableCamera" as const, icon: prefs.enableCamera ? Camera : VideoOff, label: isRtl ? "בועת פנים" : "Face bubble" },
              { key: "enableMic" as const, icon: prefs.enableMic ? Mic : MicOff, label: isRtl ? "מיקרופון" : "Microphone" },
              { key: "enableSystemAudio" as const, icon: Volume2, label: isRtl ? "אודיו מערכת" : "System audio" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => updatePref(key, !prefs[key])}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  prefs[key]
                    ? "bg-purple-500/10 text-purple-300"
                    : "bg-slate-900 text-slate-500 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-start">{label}</span>
                <div className={`h-5 w-9 rounded-full transition-colors ${prefs[key] ? "bg-purple-500" : "bg-slate-700"}`}>
                  <div className={`h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${prefs[key] ? (isRtl ? "-translate-x-0.5" : "translate-x-[18px]") : (isRtl ? "-translate-x-[18px]" : "translate-x-0.5")}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Device selects */}
          {prefs.enableCamera && cameras.length > 1 && (
            <div className="mb-2">
              <label className="mb-1 block text-xs text-slate-600">{isRtl ? "מצלמה" : "Camera"}</label>
              <select
                value={prefs.cameraDeviceId}
                onChange={(e) => updatePref("cameraDeviceId", e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none"
              >
                {cameras.map((c, i) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {prefs.enableMic && mics.length > 1 && (
            <div className="mb-4">
              <label className="mb-1 block text-xs text-slate-600">{isRtl ? "מיקרופון" : "Mic"}</label>
              <select
                value={prefs.micDeviceId}
                onChange={(e) => updatePref("micDeviceId", e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none"
              >
                {mics.map((m, i) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || `Mic ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bubble position */}
          {prefs.enableCamera && (
            <div className="mb-6 flex items-center gap-4">
              <span className="text-xs text-slate-600">{isRtl ? "מיקום בועה" : "Bubble position"}</span>
              <div className="flex gap-1">
                {positions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updatePref("bubblePosition", p.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors ${
                      prefs.bubblePosition === p.id
                        ? "bg-purple-500 text-white"
                        : "bg-slate-900 text-slate-500 hover:bg-slate-800"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Record button */}
          <button
            onClick={startRecording}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 text-base font-semibold text-black transition-colors hover:bg-slate-200"
          >
            <Circle className="h-4 w-4 fill-red-500 text-red-500" />
            {isRtl ? "התחל הקלטה" : "Start Recording"}
          </button>

          {statusText && (
            <p className="mt-3 text-center text-xs text-slate-500">{statusText}</p>
          )}
        </div>
      )}

      {/* ── Recording ── */}
      {phase === "recording" && (
        <div className="w-full">
          <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/95 px-5 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="font-mono text-lg font-semibold text-white">{timer}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={togglePause}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                onClick={stopRecording}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center pt-20">
            <canvas ref={canvasRef} className="max-h-[70vh] max-w-[90vw] rounded-lg" />
          </div>
        </div>
      )}

      {/* ── Processing ── */}
      {phase === "processing" && (
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-400" />
          <h2 className="text-lg font-semibold text-white">
            {isRtl ? "מעבד סרטון..." : "Processing..."}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{statusText}</p>
          <div className="mx-auto mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {phase === "done" && (
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-7 w-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRtl ? "הסרטון מוכן!" : "Clip ready!"}
          </h2>

          {/* Preview */}
          {compressedBlobRef.current && (
            <video
              src={URL.createObjectURL(compressedBlobRef.current)}
              controls
              className="mx-auto mt-4 max-h-80 w-full rounded-lg"
            />
          )}

          <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
            <span>{clipDuration}</span>
            <span>{clipSize}</span>
          </div>

          {/* Link */}
          {watchUrl && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                readOnly
                value={watchUrl}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 outline-none"
                dir="ltr"
              />
              <button
                onClick={copyLink}
                className="rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-600"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={downloadClip}
              className="flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-900"
            >
              <Download className="h-4 w-4" />
              {isRtl ? "הורד" : "Download"}
            </button>
            <button
              onClick={() => {
                setPhase("setup");
                setTimer("00:00");
                setProgress(0);
                setWatchUrl("");
                setCopied(false);
              }}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              {isRtl ? "הקלטה חדשה" : "New recording"}
            </button>
          </div>

          {statusText && (
            <p className="mt-3 text-xs text-slate-500">{statusText}</p>
          )}
        </div>
      )}

      {/* Hidden canvas for recording phase setup */}
      {phase === "setup" && <canvas ref={canvasRef} className="hidden" />}
    </div>
  );
}
