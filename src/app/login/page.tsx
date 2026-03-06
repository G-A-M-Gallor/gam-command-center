"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, Mail, Lock, Eye, EyeOff, Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getTranslations } from "@/lib/i18n";
import type { Language } from "@/contexts/SettingsContext";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [language, setLanguage] = useState<Language>("he");

  const t = getTranslations(language);
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem("cc-language") as Language | null;
    if (stored) setLanguage(stored);
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError(t.auth.email);
      return;
    }
    setError("");
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setResetSent(true);
    setLoading(false);
  }

  function toggleLanguage() {
    const next = language === "he" ? "en" : "he";
    setLanguage(next);
    localStorage.setItem("cc-language", next);
    document.documentElement.lang = next === "he" ? "he" : "en";
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cc-accent-600-20)]">
            <Layers className="h-6 w-6 text-[var(--cc-accent-400)]" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-100">
              {t.auth.welcomeBack}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t.auth.signInToCommand}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              {t.auth.email}
            </label>
            <Input
              type="email"
              inputSize="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              iconStart={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              {t.auth.password}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                inputSize="lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                iconStart={<Lock className="h-4 w-4" />}
                required
                autoComplete="current-password"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {resetSent && (
            <p className="text-xs text-emerald-400">{t.auth.resetSent}</p>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {t.auth.signIn}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-600">{language === "he" ? "או" : "or"}</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* GitHub login */}
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "github",
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <Github className="h-4 w-4" />
          {language === "he" ? "התחבר עם GitHub" : "Sign in with GitHub"}
        </button>

        {/* Footer links */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            {t.auth.forgotPassword}
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            {language === "he" ? "English" : "עברית"}
          </button>
        </div>
      </div>
    </div>
  );
}
