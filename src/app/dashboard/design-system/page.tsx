"use client";

import { useState, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { DESIGNS, type DesignEntry } from "@/app/designs/registry";
import {
  Eye,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  X,
  Tag,
  Calendar,
  Globe,
  FolderOpen,
  Code2,
} from "lucide-react";

/* ─── Gallery Card ─── */

function DesignCard({
  design,
  isHe,
  onPreview,
}: {
  design: DesignEntry;
  isHe: boolean;
  onPreview: (d: DesignEntry) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const title = isHe ? design.titleHe : design.title;
  const desc = isHe ? design.descriptionHe : design.description;
  const Arrow = isHe ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      onClick={() => onPreview(design)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 text-start transition-all duration-300 hover:border-slate-600/80 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Iframe thumbnail */}
      <div className="relative h-48 w-full overflow-hidden border-b border-slate-700/40 bg-slate-900">
        <iframe
          src={design.route}
          title={title}
          className="pointer-events-none h-[800px] w-[1280px] origin-top-left"
          style={{ transform: "scale(0.28)", transformOrigin: "top left" }}
          tabIndex={-1}
          loading="lazy"
        />
        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <span className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Eye className="h-4 w-4" />
            {isHe ? "תצוגה מקדימה" : "Preview"}
          </span>
        </div>
        {/* Color palette dots */}
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {design.colors.map((c, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Card info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-white">
            {title}
          </h3>
          <Arrow className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-300" />
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{desc}</p>

        {/* Tags */}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {design.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-700/50 px-2 py-0.5 text-[11px] font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 border-t border-slate-700/40 pt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            designs/{design.folder}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {design.createdAt}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── Full-screen Preview ─── */

function DesignPreview({
  design,
  isHe,
  onClose,
}: {
  design: DesignEntry;
  isHe: boolean;
  onClose: () => void;
}) {
  const title = isHe ? design.titleHe : design.title;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b border-slate-700/50 bg-slate-900/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {isHe ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {isHe ? "חזרה לגלריה" : "Back to Gallery"}
          </button>
          <span className="h-4 w-px bg-slate-700" />
          <span className="text-sm font-medium text-slate-200">{title}</span>
          <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-500">
            <Code2 className="h-3 w-3" />
            designs/{design.folder}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={design.route}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isHe ? "פתח בחלון חדש" : "Open in new tab"}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        src={design.route}
        title={title}
        className="flex-1 border-0"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/* ─── Main Page ─── */

export default function DesignSystemPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";

  const [previewDesign, setPreviewDesign] = useState<DesignEntry | null>(null);

  const handlePreview = useCallback((d: DesignEntry) => {
    setPreviewDesign(d);
  }, []);

  const handleClose = useCallback(() => {
    setPreviewDesign(null);
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="designSystem" />

      <div className="p-6">
        {/* Section header */}
        <div className="mb-6 flex items-center gap-3">
          <Tag className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-200">
            {t.gallery.allDesigns}
          </h2>
          <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            {DESIGNS.length}
          </span>
        </div>

        {/* Gallery grid */}
        {DESIGNS.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-800/20">
            <p className="text-sm text-slate-500">{t.gallery.noDesigns}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DESIGNS.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                isHe={isHe}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen preview */}
      {previewDesign && (
        <DesignPreview
          design={previewDesign}
          isHe={isHe}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
