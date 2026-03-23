"use client";
// ===================================================
// GAM Command Center — Quick Capture
// Add tasks/projects/ideas with Cmd+K shortcut
// ===================================================

import { useState, useEffect, useRef } from "react";
import { Plus, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuickCapture, useActiveSprints } from "@/lib/pm-queries";
import { QUICK_CAPTURE_TYPES, PRIORITIES, type QuickCaptureType } from "@/lib/pm-types";

interface QuickCaptureProps {
  className?: string;
  showAsFAB?: boolean; // Mobile FAB mode
}

export function QuickCapture({ className, showAsFAB = false }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<QuickCaptureType>("משימה");
  const [priority, setPriority] = useState("רגיל");
  const [sprintId, setSprintId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: addItem, isPending } = useQuickCapture();
  const { data: activeSprints = [] } = useActiveSprints();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addItem(
      { type, title: title.trim(), sprintId: sprintId || undefined, priority },
      {
        onSuccess: () => {
          setTitle("");
          setType("משימה");
          setPriority("רגיל");
          setSprintId("");
          setIsOpen(false);
        },
      }
    );
  };

  // Mobile FAB
  if (showAsFAB) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
        {isOpen && <QuickCaptureModal />}
      </>
    );
  }

  // Desktop inline
  if (!isOpen) {
    return (
      <div className={cn("p-4 border-b border-slate-800", className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-right bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors group"
        >
          <Plus className="w-4 h-4 text-slate-400 group-hover:text-white" />
          <span className="text-slate-400 group-hover:text-slate-300">
            רעיון, משימה, פרויקט... (Cmd+K)
          </span>
        </button>
      </div>
    );
  }

  return <QuickCaptureModal />;

  function QuickCaptureModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h3 className="text-lg font-medium text-white">הוספה מהירה</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Type selector */}
            <div className="flex gap-2">
              {QUICK_CAPTURE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    type === t
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Title input */}
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כתוב כאן..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              dir="rtl"
            />

            {/* Task-specific options */}
            {type === "משימה" && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <select
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                >
                  <option value="">ללא ספרינט</option>
                  {activeSprints.map((s) => (
                    <option key={s.notion_id} value={s.notion_id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isPending ? "שומר..." : "שמור"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}