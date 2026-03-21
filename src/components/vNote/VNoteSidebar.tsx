"use client";

import { useState } from "react";
import type { NoteRecord } from "@/lib/entities/types";
import type { VNoteSidebarTab } from "./vNote.types";

interface Props {
  entity: NoteRecord | null;
  isOpen: boolean;
  onToggle: () => void;
}

const TABS: { id: VNoteSidebarTab; label: string; icon: string }[] = [
  { id: "comm-log", label: "לוג תקשורת", icon: "💬" },
  { id: "progress-log", label: "לוג התקדמות", icon: "📊" },
  { id: "instance-link", label: "חיבור למופע", icon: "🔗" },
];

export function VNoteSidebar({ entity, isOpen, onToggle }: Props) {
  const [activeTab, setActiveTab] = useState<VNoteSidebarTab>("comm-log");

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-30 rounded-s-lg bg-slate-800 border border-e-0 border-slate-700 px-1.5 py-3 text-slate-400 hover:text-purple-300 hover:bg-slate-700 transition-colors"
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
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ width: 280 }}
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
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

          {/* Content */}
          <div className="flex-1 overflow-auto p-3">
            {!entity ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <span className="text-2xl">📋</span>
                <p className="text-xs text-slate-500">
                  בחר מופע כדי לראות לוג
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-600 text-center">
                  {entity.title}
                </p>

                {activeTab === "comm-log" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 text-center py-8">
                      לוג תקשורת — placeholder
                    </p>
                  </div>
                )}

                {activeTab === "progress-log" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 text-center py-8">
                      לוג התקדמות — placeholder
                    </p>
                  </div>
                )}

                {activeTab === "instance-link" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 text-center py-8">
                      חיבור למופע — placeholder
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
