"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Download,
  Chrome,
  Puzzle,
  ToggleRight,
  FolderOpen,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  _Monitor,
  Camera,
  Zap,
  Link as LinkIcon,
  _Shield,
  Film,
} from "lucide-react";
import Link from "next/link";

export default function VClipDownloadPage() {
  const { language } = useSettings();
  const isRtl = language === "he";
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/vclip/download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vclip-extension.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(isRtl ? "שגיאה בהורדה" : "Download error");
    } finally {
      setDownloading(false);
    }
  };

  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const features = isRtl
    ? [
        { icon: _Monitor, title: "הקלטת מסך", desc: "מסך מלא, חלון, או טאב" },
        { icon: Camera, title: "בועת פנים", desc: "מצלמה עגולה בפינה — גודל ומיקום לבחירה" },
        { icon: Zap, title: "כיווץ אוטומטי", desc: "ffmpeg.wasm מכווץ בדפדפן לפני העלאה" },
        { icon: LinkIcon, title: "לינק מיידי", desc: "לינק מוכן תוך שניות — שלח לכל אחד" },
        { icon: _Shield, title: "פרטיות", desc: "סיסמה, תפוגה, ווטרמרק — הכל אופציונלי" },
        { icon: Film, title: "מעקב צפיות", desc: "מי צפה, מתי, כמה זמן, איזה מכשיר" },
      ]
    : [
        { icon: _Monitor, title: "Screen Recording", desc: "Full screen, window, or tab" },
        { icon: Camera, title: "Face Bubble", desc: "Round camera overlay — adjustable size & position" },
        { icon: Zap, title: "Auto Compress", desc: "ffmpeg.wasm compresses in browser before upload" },
        { icon: LinkIcon, title: "Instant Link", desc: "Link ready in seconds — share with anyone" },
        { icon: _Shield, title: "Privacy", desc: "Password, expiry, watermark — all optional" },
        { icon: Film, title: "View Tracking", desc: "Who watched, when, how long, which device" },
      ];

  const steps = isRtl
    ? [
        { icon: Download, title: "הורד את הקובץ", desc: "לחץ על כפתור ההורדה למטה" },
        { icon: FolderOpen, title: "חלץ את ה-ZIP", desc: "לחץ פעמיים על הקובץ לחילוץ" },
        { icon: Chrome, title: "פתח את Chrome", desc: "הקלד chrome://extensions בשורת הכתובת" },
        { icon: ToggleRight, title: "הפעל Developer Mode", desc: "למעלה מימין — הפעל את המתג" },
        { icon: Puzzle, title: "טען את התוסף", desc: "לחץ Load unpacked ובחר את תיקיית vclip-extension" },
        { icon: CheckCircle, title: "מוכן!", desc: "לחץ על אייקון vClip בסרגל ה-extensions והתחל להקליט" },
      ]
    : [
        { icon: Download, title: "Download the file", desc: "Click the download button below" },
        { icon: FolderOpen, title: "Extract the ZIP", desc: "Double-click the file to extract" },
        { icon: Chrome, title: "Open Chrome", desc: "Type chrome://extensions in the address bar" },
        { icon: ToggleRight, title: "Enable Developer Mode", desc: "Toggle it on in the top right" },
        { icon: Puzzle, title: "Load the extension", desc: "Click Load unpacked and select the vclip-extension folder" },
        { icon: CheckCircle, title: "Done!", desc: "Click the vClip icon in the extensions bar and start recording" },
      ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-full bg-slate-950 p-6">
      {/* Back */}
      <Link
        href="/dashboard/vclip"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-white"
      >
        <BackArrow className="h-4 w-4" />
        {isRtl ? "חזרה לספריה" : "Back to library"}
      </Link>

      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
          <Film className="h-8 w-8 text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">vClip</h1>
        <p className="mt-2 text-base text-slate-400">
          {isRtl
            ? "הקלט מסך + בועת פנים, כווץ ושתף — ישירות מ-Chrome"
            : "Record screen + face bubble, compress & share — right from Chrome"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {isRtl ? "תחליף Loom שבנינו לעצמנו" : "The Loom alternative we built for ourselves"}
        </p>
      </div>

      {/* Features */}
      <div className="mx-auto mb-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 transition-colors hover:border-slate-700"
          >
            <f.icon className="mb-2 h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-medium text-white">{f.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Download Button */}
      <div className="mx-auto mb-10 max-w-md text-center">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 text-base font-bold text-black transition-colors hover:bg-slate-200 disabled:opacity-50"
        >
          {downloading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-_t-black" />
              {isRtl ? "מכין הורדה..." : "Preparing..."}
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              {isRtl ? "הורד את vClip לChrome" : "Download vClip for Chrome"}
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-slate-600">
          {isRtl ? "Chrome Extension · Manifest V3 · חינם" : "Chrome Extension · Manifest V3 · Free"}
        </p>
      </div>

      {/* Installation Steps */}
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-5 text-center text-lg font-semibold text-white">
          {isRtl ? "הוראות התקנה" : "Installation Guide"}
        </h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-slate-800/50 bg-slate-900/30 p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
                <step.icon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-400">{i + 1}</span>
                  <h3 className="text-sm font-medium text-white">{step.title}</h3>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative: Use in-app */}
      <div className="mx-auto mt-10 max-w-md rounded-xl border border-dashed border-slate-800 p-5 text-center">
        <p className="text-sm text-slate-400">
          {isRtl ? "לא רוצה להתקין תוסף?" : "Don't want to install an extension?"}
        </p>
        <Link
          href="/dashboard/vclip/record"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
        >
          <Monitor className="h-4 w-4" />
          {isRtl ? "הקלט ישירות מהדשבורד" : "Record directly from the dashboard"}
        </Link>
      </div>
    </div>
  );
}
