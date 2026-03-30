"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface ZoneRef {
  id: string;
  label: string;
  icon: string;
}

const ZONES: ZoneRef[] = [
  { id: "zone-fields", label: "שדות", icon: "🏷️" },
  { id: "zone-story", label: "Story", icon: "📋" },
  { id: "zone-blocks", label: "Blocks", icon: "📦" },
  { id: "zone-canvas", label: "Canvas", icon: "✏️" },
];

interface Props {
  onSidebarOpen: () => void;
  entityTitle?: string;
  entityType?: string;
}

export function VNoteMobileNav({ onSidebarOpen, entityTitle, entityType }: Props) {
  const [activeZone, setActiveZone] = useState(ZONES[0].id);
  const _router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      for (let i = ZONES.length - 1; i >= 0; i--) {
        const el = document.getElementById(ZONES[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveZone(ZONES[i].id);
            return;
          }
        }
      }
      setActiveZone(ZONES[0].id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((zoneId: string) => {
    const el = document.getElementById(zoneId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveZone(zoneId);
    }
  }, []);

  return (
    <>
      {/* Breadcrumb bar — visible on mobile only */}
      {entityTitle && (
        <div
          className="fixed top-0 inset-x-0 z-40 flex items-center gap-2 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm px-3 md:hidden"
          style={{ height: 40 }}
          dir="rtl"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
          {entityType && (
            <>
              <span className="text-[10px] text-slate-500">{entityType}</span>
              <span className="text-slate-600 text-[10px]">/</span>
            </>
          )}
          <span className="text-xs text-slate-300 truncate flex-1">{entityTitle}</span>
        </div>
      )}

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-center border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm md:hidden"
        style={{ height: 56, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        dir="rtl"
      >
        {ZONES.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => scrollTo(zone.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              activeZone === zone.id
                ? "text-purple-300"
                : "text-slate-500"
            }`}
          >
            <span className="text-base leading-none">{zone.icon}</span>
            <span className="text-[10px] font-medium">{zone.label}</span>
          </button>
        ))}
        {/* Sidebar trigger */}
        <button
          type="button"
          onClick={onSidebarOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-slate-500 transition-colors active:text-purple-300"
        >
          <span className="text-base leading-none">📂</span>
          <span className="text-[10px] font-medium">לוג</span>
        </button>
      </nav>
    </>
  );
}
