"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2, ToggleLeft, ToggleRight, ShieldAlert } from "lucide-react";

interface FeatureFlag {
  id: string;
  app_name: string;
  feature_name: string;
  enabled: boolean;
}

const labels = {
  he: {
    title: "מערכת",
    description: "Feature Flags — ניהול פיצ׳רים פעילים",
    enabled: "פעיל",
    disabled: "כבוי",
    noFlags: "אין feature flags",
    loading: "טוען...",
    adminOnly: "דף זה נגיש למנהלים בלבד",
  },
  en: {
    title: "System",
    description: "Feature Flags — manage active features",
    enabled: "Enabled",
    disabled: "Disabled",
    noFlags: "No feature flags",
    loading: "Loading...",
    adminOnly: "This page is admin-only",
  },
  ru: {
    title: "Система",
    description: "Feature Flags — управление функциями",
    enabled: "Включено",
    disabled: "Выключено",
    noFlags: "Нет feature flags",
    loading: "Загрузка...",
    adminOnly: "Только для администраторов",
  },
};

export function SystemTab() {
  const { isAdmin } = useAuth();
  const { language } = useSettings();
  const l = labels[language];
  const isRtl = language === "he";

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("app_name")
      .order("feature_name");
    if (!error && data) setFlags(data as FeatureFlag[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchFlags();
    else setLoading(false);
  }, [isAdmin, fetchFlags]);

  const toggleFlag = useCallback(async (flag: FeatureFlag) => {
    const newEnabled = !flag.enabled;
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) => (f.id === flag.id ? { ...f, enabled: newEnabled } : f)),
    );
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: newEnabled })
      .eq("id", flag.id);
    if (error) {
      // Revert
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, enabled: !newEnabled } : f)),
      );
    }
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <ShieldAlert className="h-8 w-8 text-red-400/60" />
        <p className="text-sm text-slate-500">{l.adminOnly}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  // Group by app_name
  const _grouped = flags.reduce<Record<string, FeatureFlag[]>>((acc, flag) => {
    (acc[flag.app_name] ??= []).push(flag);
    return acc;
  }, {});

  const appNames = Object.keys(_grouped).sort();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-3xl space-y-4">
      <div className="mb-2">
        <p className="text-xs text-slate-500">{l.description}</p>
      </div>

      {appNames.length === 0 && (
        <div className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-6 text-center">
          <p className="text-sm text-slate-500">{l.noFlags}</p>
        </div>
      )}

      {appNames.map((appName) => (
        <div
          key={appName}
          className="rounded-xl border border-slate-700/30 bg-slate-800/30 overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-slate-700/20">
            <h3 className="text-sm font-semibold text-slate-200">{appName}</h3>
          </div>
          <div className="divide-y divide-slate-700/20">
            {_grouped[appName].map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/10 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-slate-300">{flag.feature_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  className="flex items-center gap-1.5 group"
                >
                  <span
                    className={`text-[10px] font-medium ${
                      flag.enabled ? "text-emerald-400" : "text-slate-600"
                    }`}
                  >
                    {flag.enabled ? l.enabled : l.disabled}
                  </span>
                  {flag.enabled ? (
                    <ToggleRight
                      size={22}
                      className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
                    />
                  ) : (
                    <ToggleLeft
                      size={22}
                      className="text-slate-600 group-hover:text-slate-400 transition-colors"
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
