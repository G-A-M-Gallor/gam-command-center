"use client";

import { useState, useCallback, useEffect } from "react";
import { VBlockShell } from "@/components/vBlock";
import type { VBlockEvent } from "@/components/vBlock";
import { EntityCard } from "@/components/vBlock/blocks/EntityCard";
import { supabase } from "@/lib/supabaseClient";

export default function VBlockTestPage() {
  const [events, setEvents] = useState<string[]>([]);
  const [entityId, setEntityId] = useState<string | null>(null);

  // Try to find a real entity, fall back to mock
  useEffect(() => {
    supabase
      .from("vb_records")
      .select("id")
      .eq("is_deleted", false)
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setEntityId(data[0].id);
      });
  }, []);

  const handleEvent = useCallback((e: VBlockEvent) => {
    setEvents((prev) => [
      `[${new Date().toLocaleTimeString("he-IL")}] ${e.type} — ${e.blockId}`,
      ...prev.slice(0, 19),
    ]);
  }, []);

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">vBlock Shell — דף בדיקה</h1>
        <p className="text-sm text-slate-400 mt-1">
          בדיקת resize, context menu, fullscreen, flip card, RTL
        </p>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        {/* Block 1: Compact (180x120) */}
        <VBlockShell
          blockId="test-compact"
          title="בלוק קטן"
          icon="📦"
          initialSize={{ width: 180, height: 120 }}
          onEvent={handleEvent}
          onFullscreen="expand"
          showSettings
          onSettings={() => handleEvent({ type: "block.settings.opened", blockId: "test-compact" })}
        >
          {({ mode }) => (
            <div className="flex items-center justify-center h-full p-2">
              <span className="text-xs text-slate-400">
                mode: <strong className="text-slate-200">{mode}</strong>
              </span>
            </div>
          )}
        </VBlockShell>

        {/* Block 2: Standard (350x300) with flip */}
        <VBlockShell
          blockId="test-flip"
          title="כרטיס הפיך"
          icon="🔄"
          initialSize={{ width: 350, height: 300 }}
          flip={{ enabled: true, frontLabel: "חזית", backLabel: "גב" }}
          onEvent={handleEvent}
          onFullscreen="expand"
          showSettings
          onSettings={() => handleEvent({ type: "block.settings.opened", blockId: "test-flip" })}
        >
          {({ mode, page }) => (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
              <span className="text-lg">
                {page === "front" ? "🎴 חזית" : page === "back" ? "🔙 גב" : "↔ שני הצדדים"}
              </span>
              <span className="text-xs text-slate-400">
                mode: <strong className="text-slate-200">{mode}</strong> | page:{" "}
                <strong className="text-slate-200">{page}</strong>
              </span>
            </div>
          )}
        </VBlockShell>

        {/* Block 3: Entity Card with flip */}
        <VBlockShell
          blockId="test-entity-card"
          title="כרטיס ישות"
          icon="👤"
          initialSize={{ width: 380, height: 340 }}
          flip={{ enabled: true, frontLabel: "פרטים", backLabel: "מידע נוסף" }}
          onEvent={handleEvent}
          onFullscreen="expand"
          showSettings
          onSettings={() => handleEvent({ type: "block.settings.opened", blockId: "test-entity-card" })}
        >
          {({ mode, page }) =>
            entityId ? (
              <EntityCard
                entityType="contact"
                entityId={entityId}
                page={page ?? "front"}
                mode={mode}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                <span className="text-2xl">👤</span>
                <p className="text-xs text-slate-400">
                  אין ישויות ב-DB — צור רשומה ב-vb_records לבדיקה
                </p>
                <span className="text-xs text-slate-500">
                  mode: <strong className="text-slate-200">{mode}</strong> | page:{" "}
                  <strong className="text-slate-200">{page}</strong>
                </span>
              </div>
            )
          }
        </VBlockShell>

        {/* Block 4: Large (700x500) with custom context actions */}
        <VBlockShell
          blockId="test-large"
          title="בלוק גדול"
          icon="🖼"
          initialSize={{ width: 700, height: 500 }}
          onEvent={handleEvent}
          onFullscreen="expand"
          showSettings
          onSettings={() => handleEvent({ type: "block.settings.opened", blockId: "test-large" })}
          contextActions={[
            {
              id: "export-png",
              label: "ייצוא PNG",
              icon: "🖼",
              onClick: () =>
                handleEvent({ type: "block.context.action", blockId: "test-large", actionId: "export-png" }),
            },
            {
              id: "share",
              label: "שתף",
              icon: "🔗",
              onClick: () =>
                handleEvent({ type: "block.context.action", blockId: "test-large", actionId: "share" }),
            },
          ]}
        >
          {({ mode, size }) => (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
              <span className="text-4xl">🖼</span>
              <div className="text-center space-y-1">
                <p className="text-sm text-slate-200">
                  mode: <strong>{mode}</strong>
                </p>
                <p className="text-xs text-slate-400">
                  {size.width}×{size.height}px
                </p>
                <p className="text-xs text-slate-500">
                  קליק ימני → context menu מותאם
                </p>
              </div>
            </div>
          )}
        </VBlockShell>
      </div>

      {/* Event log */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="text-sm font-medium text-slate-300 mb-2">לוג אירועים</h2>
        <div className="max-h-48 overflow-auto space-y-0.5 font-mono text-xs">
          {events.length === 0 && (
            <p className="text-slate-500">אין אירועים עדיין — נסה resize, קליק ימני, fullscreen...</p>
          )}
          {events.map((evt, i) => (
            <p key={i} className="text-slate-400">
              {evt}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
