"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, type Language } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { Loader2, Save, UserCircle } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  title: string | null;
  avatar_url: string | null;
  signature: string | null;
  preferred_language: string | null;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

const labels = {
  he: {
    title: "פרופיל",
    description: "פרטים אישיים וחתימה",
    displayName: "שם תצוגה",
    phone: "טלפון",
    jobTitle: "תפקיד",
    avatarUrl: "כתובת תמונת פרופיל",
    signature: "חתימה",
    preferredLanguage: "שפה מועדפת",
    save: "שמור",
    saving: "שומר...",
    saved: "נשמר בהצלחה",
    error: "שגיאה בשמירה",
    email: "אימייל",
    noProfile: "פרופיל לא נמצא",
  },
  en: {
    title: "Profile",
    description: "Personal details and signature",
    displayName: "Display Name",
    phone: "Phone",
    jobTitle: "Job Title",
    avatarUrl: "Profile Image URL",
    signature: "Signature",
    preferredLanguage: "Preferred Language",
    save: "Save",
    saving: "Saving...",
    saved: "Saved successfully",
    error: "Error saving",
    email: "Email",
    noProfile: "Profile not found",
  },
  ru: {
    title: "Профиль",
    description: "Личные данные и подпись",
    displayName: "Отображаемое имя",
    phone: "Телефон",
    jobTitle: "Должность",
    avatarUrl: "URL фото профиля",
    signature: "Подпись",
    preferredLanguage: "Предпочтительный язык",
    save: "Сохранить",
    saving: "Сохранение...",
    saved: "Сохранено",
    error: "Ошибка сохранения",
    email: "Email",
    noProfile: "Профиль не найден",
  },
};

const LANGUAGES: { value: string; label: Record<string, string> }[] = [
  { value: "he", label: { he: "עברית", en: "Hebrew", ru: "Иврит" } },
  { value: "en", label: { he: "אנגלית", en: "English", ru: "Английский" } },
];

export function ProfileTab() {
  const { user } = useAuth();
  const { language } = useSettings();
  const l = labels[language];
  const isRtl = language === "he";
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    title: "",
    avatar_url: "",
    signature: "",
    preferred_language: "he",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        phone: profile.phone ?? "",
        title: profile.title ?? "",
        avatar_url: profile.avatar_url ?? "",
        signature: profile.signature ?? "",
        preferred_language: profile.preferred_language ?? "he",
      });
    }
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);
    setToast(null);
    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: form.display_name || null,
        phone: form.phone || null,
        title: form.title || null,
        avatar_url: form.avatar_url || null,
        signature: form.signature || null,
        preferred_language: form.preferred_language,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setToast(l.error);
    } else {
      setToast(l.saved);
      await queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
      setTimeout(() => setToast(null), 3000);
    }
  }, [user?.id, form, l, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <UserCircle className="h-8 w-8 text-slate-600" />
        <p className="text-sm text-slate-500">{l.noProfile}</p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[var(--cc-accent-500)] transition-colors";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-2xl space-y-5">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        {form.avatar_url ? (
          <Image
            src={form.avatar_url}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover border-2 border-slate-700"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-slate-700/60 flex items-center justify-center text-xl text-slate-500">
            {form.display_name?.charAt(0) || "?"}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{form.display_name || "—"}</h3>
          <p className="text-xs text-slate-500">{profile.email}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label={l.displayName}>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            className={inputCls}
          />
        </FieldGroup>

        <FieldGroup label={l.phone}>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className={inputCls}
            dir="ltr"
          />
        </FieldGroup>

        <FieldGroup label={l.jobTitle}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={inputCls}
          />
        </FieldGroup>

        <FieldGroup label={l.preferredLanguage}>
          <select
            value={form.preferred_language}
            onChange={(e) => setForm((p) => ({ ...p, preferred_language: e.target.value }))}
            className={inputCls}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label[language]}
              </option>
            ))}
          </select>
        </FieldGroup>
      </div>

      <FieldGroup label={l.avatarUrl}>
        <input
          type="url"
          value={form.avatar_url}
          onChange={(e) => setForm((p) => ({ ...p, avatar_url: e.target.value }))}
          className={inputCls}
          dir="ltr"
          placeholder="https://..."
        />
      </FieldGroup>

      <FieldGroup label={l.signature}>
        <textarea
          value={form.signature}
          onChange={(e) => setForm((p) => ({ ...p, signature: e.target.value }))}
          className={`${inputCls} resize-none`}
          rows={4}
        />
      </FieldGroup>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--cc-accent-500)] transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? l.saving : l.save}
        </button>
        {toast && (
          <span className={`text-xs ${toast === l.saved ? "text-emerald-400" : "text-red-400"}`}>
            {toast}
          </span>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-800/30 p-3">
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}
