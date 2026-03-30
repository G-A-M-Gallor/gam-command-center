"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

interface ClipData {
  id: string;
  title: string;
  duration_seconds: number;
  size_mb: number;
  storage_url: string;
  content_type: string;
  status: string;
  is_private: boolean;
  expires_at: string | null;
  watermark_text: string | null;
  view_count: number;
  created_at: string;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const [clip, setClip] = useState<ClipData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTracked = useRef(false);
  const viewerToken = useRef<string>("");

  // Load or create viewer token
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vclip_viewer_token");
      if (stored) {
        viewerToken.current = stored;
      } else {
        const token = crypto.randomUUID();
        localStorage.setItem("vclip_viewer_token", token);
        viewerToken.current = token;
      }
    } catch {
      viewerToken.current = crypto.randomUUID();
    }
  }, []);

  // Fetch clip metadata
  useEffect(() => {
    if (!id) return;
    fetch(`/api/vclip/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 410 ? "הסרטון פג תוקף" : "הסרטון לא נמצא");
        return res.json();
      })
      .then(setClip)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Track view on first play
  const trackView = useCallback(
    (watchDuration?: number, watchPct?: number) => {
      if (!id) return;
      fetch(`/api/vclip/${id}/view`, {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewer_token: viewerToken.current,
          watch_duration_seconds: watchDuration || 0,
          watch_percentage: watchPct || 0,
        }),
      }).catch(() => { /* no-op */ });
    },
    [id]
  );

  // Track on first play
  const handlePlay = useCallback(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackView();
    }
  }, [trackView]);

  // Track watch progress on pause/end
  const handlePauseOrEnd = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    trackView(Math.floor(video.currentTime), Math.round(pct));
  }, [trackView]);

  // Format duration
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={{ fontSize: 48 }}>&#128249;</div>
          <h1 style={styles.errorTitle}>{error}</h1>
          <p style={styles.errorText}>
            הלינק שקיבלת כבר לא תקף, או שהסרטון הוסר.
          </p>
        </div>
      </div>
    );
  }

  if (!clip) return null;

  return (
    <div style={styles.container}>
      <div style={styles.playerCard}>
        {/* Video */}
        <div style={styles.videoWrap}>
          <video
            ref={videoRef}
            src={clip.storage_url}
            controls
            autoPlay
            playsInline
            onPlay={handlePlay}
            onPause={handlePauseOrEnd}
            onEnded={handlePauseOrEnd}
            style={styles.video}
          />
          {clip.watermark_text && (
            <div style={styles.watermark}>{clip.watermark_text}</div>
          )}
        </div>

        {/* Info */}
        <div style={styles.info}>
          <h1 style={styles.title}>{clip.title || "vClip"}</h1>
          <div style={styles.meta}>
            <span>{formatDuration(clip.duration_seconds)}</span>
            <span>&middot;</span>
            <span>{clip.view_count} צפיות</span>
            <span>&middot;</span>
            <span>{formatDate(clip.created_at)}</span>
          </div>
        </div>

        {/* Branding */}
        <div style={styles.branding}>
          <span style={styles.brandText}>vClip</span>
          <span style={styles.brandSub}>by vBrain.io</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#0a0e1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #334155",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorCard: {
    textAlign: "center" as const,
    color: "#e2e8f0",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginTop: 16,
    color: "#e2e8f0",
  },
  errorText: {
    color: "#94a3b8",
    marginTop: 8,
  },
  playerCard: {
    maxWidth: 900,
    width: "100%",
  },
  videoWrap: {
    position: "relative" as const,
    borderRadius: 12,
    overflow: "hidden",
    background: "#000",
  },
  video: {
    width: "100%",
    display: "block",
    maxHeight: "70vh",
  },
  watermark: {
    position: "absolute" as const,
    bottom: 50,
    right: 16,
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontWeight: 600,
    pointerEvents: "none" as const,
    userSelect: "none" as const,
  },
  info: {
    padding: "16px 4px",
    color: "#e2e8f0",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  meta: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    fontSize: 13,
    color: "#94a3b8",
  },
  branding: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "12px 4px",
    borderTop: "1px solid #1e293b",
    marginTop: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: 800,
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  brandSub: {
    fontSize: 12,
    color: "#64748b",
  },
};
