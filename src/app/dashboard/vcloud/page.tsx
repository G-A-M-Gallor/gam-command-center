"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import CoursesScreen from "@/components/pm/CoursesScreen";
import {
  Cloud,
  FolderArchive,
  ImageIcon,
  Video,
  AudioLines,
  UserCircle,
  Upload,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  Grid3x3,
  List,
  Copy,
  Check,
  FileIcon,
  Clock,
  HardDrive,
  Eye,
  X,
  Film,
  BookOpen,
} from "lucide-react";

interface VCloudFile {
  id: string;
  name: string;
  file_type: string;
  mime_type: string;
  size_mb: number;
  storage_url: string;
  folder: string;
  is_personal: boolean;
  tags: string[];
  vclip_id?: string;
  source?: string;
  duration_seconds?: number;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

type TabKey = "all" | "files" | "images" | "video" | "sound" | "personal" | "courses";

const TABS: { key: TabKey; icon: typeof Cloud; he: string; en: string; type?: string; personal?: boolean }[] = [
  { key: "all", icon: Cloud, he: "הכל", en: "All" },
  { key: "files", icon: FolderArchive, he: "קבצים", en: "Files", type: "file" },
  { key: "images", icon: ImageIcon, he: "תמונות", en: "Images", type: "image" },
  { key: "video", icon: Video, he: "וידאו", en: "Video", type: "video" },
  { key: "sound", icon: AudioLines, he: "סאונד", en: "Sound", type: "sound" },
  { key: "courses", icon: BookOpen, he: "קורסים", en: "Courses" },
  { key: "personal", icon: UserCircle, he: "אישי", en: "Personal", personal: true },
];

export default function VCloudPage() {
  const { language } = useSettings();
  const isRtl = language === "he";
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as TabKey) || "all";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [files, setFiles] = useState<VCloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabConfig = TABS.find((t) => t.key === activeTab)!;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tabConfig.type) params.set("type", tabConfig.type);
      if (tabConfig.personal) params.set("personal", "true");

      const res = await fetch(`/api/vcloud/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("[vCloud] Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [tabConfig]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (activeTab === "personal") formData.append("personal", "true");

      setUploadProgress(40);
      const res = await fetch("/api/vcloud/upload", { method: "POST", body: formData });
      setUploadProgress(80);

      if (res.ok) {
        setUploadProgress(100);
        await fetchFiles();
      } else {
        console.error("[vCloud] Upload failed:", await res.text());
      }
    } catch (err) {
      console.error("[vCloud] Upload error:", err);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteFile = async (fileId: string, isVClip: boolean) => {
    if (!confirm(isRtl ? "למחוק את הקובץ?" : "Delete this file?")) return;
    try {
      const url = isVClip
        ? `/api/vclip/${fileId.replace("vclip:", "")}`
        : `/api/vcloud/${fileId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch {
      // Ignore API errors - file deletion may have failed
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = files.filter(
    (f) => !search || f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isRtl ? "he-IL" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatSize = (mb: number) => (mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb} MB`);

  const getFileIcon = (f: VCloudFile) => {
    if (f.source === "vclip" || f.file_type === "video") return Film;
    if (f.file_type === "image") return ImageIcon;
    if (f.file_type === "sound") return AudioLines;
    return FileIcon;
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-full flex-col bg-slate-950"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <Cloud className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">vCloud</h1>
              <p className="text-sm text-slate-500">
                {isRtl ? `${files.length} קבצים` : `${files.length} files`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="rounded-lg border border-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isRtl ? "העלאה" : "Upload"}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={fetchFiles}
              className="rounded-lg bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {isRtl ? tab.he : tab.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-6 pt-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? "חיפוש קבצים..." : "Search files..."}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 ps-10 pe-4 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="mx-6 mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isRtl ? "מעלה..." : "Uploading..."} {uploadProgress}%
          </p>
        </div>
      )}

      {/* Drop overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-sky-500/50 bg-slate-900/90 px-16 py-12">
            <Upload className="h-12 w-12 text-sky-400" />
            <p className="text-lg font-semibold text-white">
              {isRtl ? "שחרר להעלאה" : "Drop to upload"}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Courses Tab */}
        {activeTab === "courses" ? (
          <CoursesScreen />
        ) : (
          <>
            {/* Loading */}
            {loading && files.length === 0 && (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-900" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Cloud className="mb-4 h-12 w-12 text-slate-700" />
            <h3 className="text-lg font-medium text-slate-400">
              {isRtl ? "אין קבצים" : "No files"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {isRtl ? "גרור קובץ לכאן או לחץ על העלאה" : "Drag a file here or click Upload"}
            </p>
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((file) => {
              const Icon = getFileIcon(file);
              const isImage = file.file_type === "image";
              const isVClip = file.source === "vclip";
              return (
                <div
                  key={file.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/50 transition-colors hover:border-slate-700 hover:bg-slate-900"
                >
                  {/* Preview area */}
                  <div className="relative flex h-28 items-center justify-center bg-slate-800/30">
                    {isImage ? (
                      <img
                        src={file.storage_url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-slate-600" />
                    )}
                    {isVClip && (
                      <span className="absolute top-2 start-2 rounded bg-purple-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        vClip
                      </span>
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={file.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => copyUrl(file.storage_url, file.id)}
                        className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                      >
                        {copiedId === file.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteFile(file.id, !!isVClip)}
                        className="rounded-lg bg-white/10 p-2 text-white hover:bg-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-slate-300">{file.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                      <span>{formatSize(file.size_mb)}</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && filtered.length > 0 && (
          <div className="space-y-1">
            {filtered.map((file) => {
              const Icon = getFileIcon(file);
              const isVClip = file.source === "vclip";
              return (
                <div
                  key={file.id}
                  className="group flex items-center gap-4 rounded-xl border border-slate-800/50 bg-slate-900/50 p-3 transition-colors hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{file.name}</p>
                      {isVClip && (
                        <span className="shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-400">
                          vClip
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatSize(file.size_mb)}
                      </span>
                      {file.duration_seconds ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(file.duration_seconds / 60)}:{String(file.duration_seconds % 60).padStart(2, "0")}
                        </span>
                      ) : null}
                      {file.view_count ? (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {file.view_count}
                        </span>
                      ) : null}
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => copyUrl(file.storage_url, file.id)}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                      {copiedId === file.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a
                      href={file.storage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => deleteFile(file.id, !!isVClip)}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
