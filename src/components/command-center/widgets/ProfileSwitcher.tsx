"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Settings } from "lucide-react";
import { useWidgets, BUILTIN_PROFILES } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

export function ProfileSwitcher() {
  const {
    profiles,
    activeProfileId,
    loadProfile,
    saveProfile,
  } = useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);
  const s = t.settings as Record<string, string>;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSaving(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const allProfiles = [...BUILTIN_PROFILES, ...profiles];
  const active = allProfiles.find((p) => p.id === activeProfileId);
  const activeName = active
    ? (active.nameKey ? (s[active.nameKey] || active.name) : active.name)
    : (s.profileDefault || "Default");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 items-center gap-1 rounded-full bg-slate-700/50 px-2.5 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
      >
        <span className="max-w-[80px] truncate">{activeName}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-[60] mt-1 w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-xl"
          style={{ borderRadius: "var(--cc-radius-lg)" }}
        >
          <div className="p-1">
            {allProfiles.map((profile) => {
              const name = profile.nameKey
                ? (s[profile.nameKey] || profile.name)
                : profile.name;
              const isActive = profile.id === activeProfileId;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    loadProfile(profile.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {isActive ? (
                    <Check className="h-3 w-3 shrink-0" />
                  ) : (
                    <span className="h-3 w-3 shrink-0" />
                  )}
                  <span className="flex-1 truncate text-start">{name}</span>
                  {profile.builtIn && (
                    <span className="rounded bg-slate-600 px-1 py-0.5 text-[9px] text-slate-400">
                      {t.widgets.storeSystemWidget ? "built-in" : "built-in"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-700 p-2">
            {saving ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) {
                      saveProfile(newName.trim());
                      setNewName("");
                      setSaving(false);
                      setOpen(false);
                    }
                    if (e.key === "Escape") setSaving(false);
                  }}
                  placeholder={t.widgets.profileName || "Profile name..."}
                  className="flex-1 rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  disabled={!newName.trim()}
                  onClick={() => {
                    if (newName.trim()) {
                      saveProfile(newName.trim());
                      setNewName("");
                      setSaving(false);
                      setOpen(false);
                    }
                  }}
                  className="rounded bg-[var(--cc-accent-600)] px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  {t.widgets.create || "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSaving(true)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                <Plus className="h-3 w-3" />
                {t.widgets.saveAsNew || "Save as new"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
