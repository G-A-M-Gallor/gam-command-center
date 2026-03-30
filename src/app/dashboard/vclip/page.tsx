"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import {
  Video,
  Copy,
  Check,
  Trash2,
  _ExternalLink,
  Eye,
  _Clock,
  HardDrive,
  Search,
  RefreshCw,
  Film,
  Circle,
  Download,
} from "lucide-react";
import Link from "next/link";

interface VClip {
  id: string;
  title: string;
  duration_seconds: number;
  size_mb: number;
  storage_url: string;
  status: string;
  view_count: number;
  unique_viewers: number;
  tags: string[];
  created_at: string;
}

export default function VClipPage() {
  const { language } = useSettings();
  const isRtl = language === "he";
  const [clips, setClips] = useState<VClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchClips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vclip/list");
      if (res.ok) {
        const data = await res.json();
        setClips(data.clips || []);
      }
    } catch (err) {
      console.error("[vClip] Failed to fetch clips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(isRtl ? "he-IL" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyLink = (clipId: string) => {
    const url = `${window.location.origin}/watch/${clipId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(clipId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteClip = async (clipId: string) => {
    if (!confirm(isRtl ? "למחוק את הסרטון?" : "Delete this clip?")) return;
    try {
      const res = await fetch(`/api/vclip/${clipId}`, { method: "DELETE" });
      if (res.ok) {
        setClips((prev) => prev.filter((c) => c.id !== clipId));
      }
    } catch {
    // Ignore errors
  }
  };

  const filtered = clips.filter(
    (c) =>
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.some((_t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-full bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <Film className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">vClip</h1>
            <p className="text-sm text-slate-500">
              {isRtl ? `${clips.length} סרטונים` : `${clips.length} clips`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/vclip/download"
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            {isRtl ? "התקנה" : "Install"}
          </Link>
          <Link
            href="/dashboard/vclip/record"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-slate-200"
          >
            <Circle className="h-3 w-3 fill-red-500 text-red-500" />
            {isRtl ? "הקלט" : "Record"}
          </Link>
          <button
            onClick={fetchClips}
            className="rounded-lg bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isRtl ? "חיפוש סרטונים..." : "Search clips..."}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 ps-10 pe-4 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-purple-500/50"
        />
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Video className="mb-4 h-12 w-12 text-slate-700" />
          <h3 className="text-lg font-medium text-slate-400">
            {isRtl ? "אין סרטונים עדיין" : "No clips yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {isRtl
              ? "לחץ על התוסף בכרום כדי להתחיל להקליט"
              : "Click the Chrome extension to start recording"}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && clips.length === 0 && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-slate-900"
            />
          ))}
        </div>
      )}

      {/* Clips list */}
      <div className="grid gap-3">
        {filtered.map((clip) => (
          <div
            key={clip.id}
            className="group flex items-center gap-4 rounded-xl border border-slate-800/50 bg-slate-900/50 p-4 transition-colors hover:border-slate-700 hover:bg-slate-900"
          >
            {/* Thumbnail / play icon */}
            <a
              href={`/watch/${clip.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-16 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 transition-colors hover:bg-purple-500/20"
            >
              <Video className="h-6 w-6 text-slate-500 group-hover:text-purple-400" />
            </a>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-white">
                {clip.title || "ללא שם"}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <_Clock className="h-3 w-3" />
                  {formatDuration(clip.duration_seconds)}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {clip.size_mb} MB
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {clip.view_count} {isRtl ? "צפיות" : "views"}
                </span>
                <span>{formatDate(clip.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => copyLink(clip.id)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                title={isRtl ? "העתק לינק" : "Copy link"}
              >
                {copiedId === clip.id ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={`/watch/${clip.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                title={isRtl ? "פתח" : "Open"}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => deleteClip(clip.id)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title={isRtl ? "מחק" : "Delete"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Future: vNote integration banner */}
      <div className="mt-8 rounded-xl border border-dashed border-slate-800 p-4 text-center">
        <p className="text-xs text-slate-600">
          {isRtl
            ? "🔮 בקרוב: חיבור vNote לכל סרטון — תמלול, סיכום AI, פרקים"
            : "🔮 Coming soon: vNote per clip — transcription, AI summary, chapters"}
        </p>
      </div>
    </div>
  );
}
