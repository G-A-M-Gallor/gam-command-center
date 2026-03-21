"use client";

import { useState, useEffect, useCallback } from "react";

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
}

export function VNoteMobileNav({ onSidebarOpen }: Props) {
  const [activeZone, setActiveZone] = useState(ZONES[0].id);

  // Track scroll position to highlight active zone
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
  );
}
