"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { NoteRecord } from "@/lib/entities/types";
import type { VNoteSidebarTab } from "./vNote.types";

interface Props {
  entity: NoteRecord | null;
  isOpen: boolean;
  onToggle: () => void;
  /** When true, render as bottom sheet instead of sidebar */
  isMobile?: boolean;
}

const TABS: { id: VNoteSidebarTab; label: string; icon: string }[] = [
  { id: "comm-log", label: "לוג תקשורת", icon: "💬" },
  { id: "progress-log", label: "לוג התקדמות", icon: "📊" },
  { id: "instance-link", label: "חיבור למופע", icon: "🔗" },
];

function SidebarContent({ entity, activeTab }: { entity: NoteRecord | null; activeTab: VNoteSidebarTab }) {
  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
        <span className="text-2xl">📋</span>
        <p className="text-xs text-slate-500">בחר מופע כדי לראות לוג</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-600 text-center">{entity.title}</p>
      {activeTab === "comm-log" && (
        <p className="text-xs text-slate-500 text-center py-8">לוג תקשורת — placeholder</p>
      )}
      {activeTab === "progress-log" && (
        <p className="text-xs text-slate-500 text-center py-8">לוג התקדמות — placeholder</p>
      )}
      {activeTab === "instance-link" && (
        <p className="text-xs text-slate-500 text-center py-8">חיבור למופע — placeholder</p>
      )}
    </div>
  );
}

export function VNoteSidebar({ entity, isOpen, onToggle, isMobile = false }: Props) {
  const [activeTab, setActiveTab] = useState<VNoteSidebarTab>("comm-log");
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onToggle(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onToggle]);

  // Touch drag for bottom sheet
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setSheetTranslateY(delta);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (sheetTranslateY > 100) {
      onToggle();
    }
    setSheetTranslateY(0);
  }, [sheetTranslateY, onToggle]);

  const tabButtons = (
    <div className="flex border-b border-slate-700">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-2 py-3 text-[11px] font-medium transition-colors ${
            activeTab === tab.id
              ? "text-purple-300 border-b-2 border-purple-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="block text-sm mb-0.5">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ── Mobile: Bottom Sheet ──────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <button
            type="button"
            onClick={onToggle}
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="סגור"
          />
        )}
        {/* Sheet */}
        <div
          ref={sheetRef}
          className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-slate-900 border-t border-slate-700 transition-transform duration-300 ease-out ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            height: "60vh",
            transform: isOpen
              ? `translateY(${sheetTranslateY}px)`
              : "translateY(100%)",
            transition: dragging ? "none" : "transform 300ms ease-out",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-slate-600" />
          </div>
          {tabButtons}
          <div className="flex-1 overflow-auto p-3" style={{ height: "calc(60vh - 80px)" }}>
            <SidebarContent entity={entity} activeTab={activeTab} />
          </div>
        </div>
      </>
    );
  }

  // ── Desktop/Tablet: Side panel ────────────────────────
  return (
    <>
      {/* Toggle button — hidden on mobile (nav handles it) */}
      <button
        type="button"
        onClick={onToggle}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-30 rounded-s-lg bg-slate-800 border border-e-0 border-slate-700 px-1.5 py-3 text-slate-400 hover:text-purple-300 hover:bg-slate-700 transition-colors max-md:hidden"
        style={{ writingMode: "vertical-rl" }}
        title={isOpen ? "סגור sidebar" : "פתח sidebar"}
      >
        <span className="text-[10px] tracking-wider">
          {isOpen ? "✕" : "☰"}
        </span>
      </button>

      {/* Sidebar panel */}
      <div
        className={`
          fixed top-0 right-0 z-20 h-full bg-slate-900 border-s border-slate-700
          transition-transform duration-300 ease-in-out max-md:hidden
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ width: 280 }}
      >
        <div className="flex flex-col h-full">
          {tabButtons}
          <div className="flex-1 overflow-auto p-3">
            <SidebarContent entity={entity} activeTab={activeTab} />
          </div>
        </div>
      </div>
    </>
  );
}
