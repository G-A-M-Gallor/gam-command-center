"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, Send, Plus } from "lucide-react";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import {
  PERSONAS,
  PRESETS,
  DEFAULT_SELECTED,
  QUICK_QUESTIONS,
  streamBoardRoom,
  type Persona,
} from "@/lib/ai/boardroom";

// ─── Types ──────────────────────────────────────────

interface ResponseState {
  text: string;
  loading: boolean;
  error?: string;
}

// ─── Page ───────────────────────────────────────────

export default function BoardRoomPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const br = t.boardroom as Record<string, string>;
  const isRtl = language === "he";

  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});
  const [asked, setAsked] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const quickQuestions = QUICK_QUESTIONS[language] ?? QUICK_QUESTIONS.en;

  const togglePersona = useCallback((id: string) => {
    if (asked) return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, [asked]);

  const loadingCount = Object.values(responses).filter((r) => r.loading).length;
  const doneCount = Object.values(responses).filter((r) => !r.loading && r.text).length;

  const askAll = useCallback(async () => {
    const q = question.trim();
    if (!q || selected.length === 0) return;

    setAsked(true);

    // Initialize all response states
    const initial: Record<string, ResponseState> = {};
    selected.forEach((id) => {
      initial[id] = { text: "", loading: true };
    });
    setResponses(initial);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    // Fire all persona requests in parallel
    for (const personaId of selected) {
      const controller = new AbortController();
      abortControllers.current.set(personaId, controller);

      streamBoardRoom({
        question: q,
        personaId,
        token,
        signal: controller.signal,
        onToken: (text) => {
          setResponses((prev) => ({
            ...prev,
            [personaId]: {
              ...prev[personaId],
              text: (prev[personaId]?.text || "") + text,
            },
          }));
        },
        onDone: () => {
          setResponses((prev) => ({
            ...prev,
            [personaId]: { ...prev[personaId], loading: false },
          }));
          abortControllers.current.delete(personaId);
        },
        onError: (error) => {
          setResponses((prev) => ({
            ...prev,
            [personaId]: {
              text: prev[personaId]?.text || "",
              loading: false,
              error,
            },
          }));
          abortControllers.current.delete(personaId);
        },
      });
    }
  }, [question, selected]);

  const reset = useCallback(() => {
    // Abort any in-flight requests
    abortControllers.current.forEach((c) => c.abort());
    abortControllers.current.clear();
    setAsked(false);
    setResponses({});
    setQuestion("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !asked) {
        e.preventDefault();
        askAll();
      }
    },
    [asked, askAll]
  );

  return (
    <div className="flex min-h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="boardroom" />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar — Persona Selection ── */}
        <div className="flex w-[200px] shrink-0 flex-col gap-1.5 overflow-y-auto border-s border-slate-700/50 bg-slate-900/50 p-3">
          <div className="mb-2 px-1 text-[9px] font-medium uppercase tracking-widest text-slate-600">
            {br.selectAdvisors}
          </div>

          {PERSONAS.map((p) => (
            <PersonaChip
              key={p.id}
              persona={p}
              isSelected={selected.includes(p.id)}
              isLoading={responses[p.id]?.loading ?? false}
              isDone={!!responses[p.id]?.text && !responses[p.id]?.loading}
              disabled={asked}
              language={language}
              onClick={() => togglePersona(p.id)}
            />
          ))}

          {/* Quick presets */}
          <div className="mt-auto border-t border-slate-700/50 pt-3">
            <div className="mb-2 text-[9px] font-medium uppercase tracking-widest text-slate-600">
              {br.quickSelect}
            </div>
            <div className="flex flex-col gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.labelKey}
                  type="button"
                  disabled={asked}
                  onClick={() => !asked && setSelected([...preset.ids])}
                  className="rounded-lg border border-slate-700/50 px-2 py-1.5 text-start text-[11px] text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300 disabled:opacity-40"
                >
                  {br[preset.labelKey]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Quick Questions */}
          {!asked && (
            <div className="border-b border-slate-700/50 px-6 pb-3 pt-4">
              <div className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-slate-600">
                {br.readyQuestions}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestion(q)}
                    className="rounded-full border border-slate-700/50 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-600 hover:bg-white/[0.03] hover:text-slate-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Responses */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
            {!asked ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-40">
                <span className="text-5xl">🏛️</span>
                <span className="text-sm text-slate-500">
                  {br.selectAndAsk}
                </span>
                <span className="text-[11px] text-slate-600">
                  {selected.length} {br.advisorsSelected}
                </span>
              </div>
            ) : (
              selected.map((id) => {
                const persona = PERSONAS.find((p) => p.id === id);
                if (!persona) return null;
                const state = responses[id];
                return (
                  <ResponseCard
                    key={id}
                    persona={persona}
                    state={state}
                    language={language}
                  />
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700/50 bg-slate-900/50 px-6 py-4">
            {asked && (
              <div className="mb-2.5">
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
                >
                  <Plus className="h-3 w-3" />
                  {br.newQuestion}
                </button>
              </div>
            )}
            <div className="flex items-end gap-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${br.askPlaceholder} ${selected.length} ${br.advisors}...`}
                disabled={asked && loadingCount > 0}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-[var(--cc-accent-500)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={askAll}
                disabled={
                  !question.trim() ||
                  selected.length === 0 ||
                  (asked && loadingCount > 0)
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-5 text-sm font-semibold text-white transition-all hover:bg-[var(--cc-accent-500)] disabled:opacity-40 disabled:hover:bg-[var(--cc-accent-600)]"
              >
                {asked && loadingCount > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingCount}
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    {br.send}
                  </>
                )}
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-slate-600">
              {selected.length} {br.advisors} · Enter {br.toSend} · Shift+Enter {br.newLine}
            </div>
          </div>
        </div>
      </div>

      {/* Status badge */}
      {asked && (
        <div className="fixed end-4 top-14 z-40">
          <div
            className={`rounded-full border px-3 py-1 text-[11px] font-mono ${
              loadingCount > 0
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {loadingCount > 0
              ? `${doneCount}/${selected.length}`
              : `${doneCount} ${br.responses}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Persona Chip ───────────────────────────────────

function PersonaChip({
  persona,
  isSelected,
  isLoading,
  isDone,
  disabled,
  language,
  onClick,
}: {
  persona: Persona;
  isSelected: boolean;
  isLoading: boolean;
  isDone: boolean;
  disabled: boolean;
  language: string;
  onClick: () => void;
}) {
  const name = language === "he" ? persona.nameHe : persona.nameEn;
  const role = language === "he" ? persona.roleHe : persona.roleEn;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !isSelected}
      className="flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-start transition-all hover:translate-y-[-1px] disabled:hover:translate-y-0"
      style={{
        borderColor: isSelected ? persona.border : "rgb(30 41 59 / 0.5)",
        background: isSelected ? persona.bg : "transparent",
        opacity: disabled && !isSelected ? 0.35 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span className="text-base">{persona.emoji}</span>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-xs font-semibold"
          style={{ color: isSelected ? persona.color : "#6a8aaa" }}
        >
          {name}
        </div>
        <div className="truncate text-[9px] text-slate-600">{role}</div>
      </div>
      <div
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          background: isLoading
            ? "#ff8f00"
            : isDone
              ? persona.color
              : isSelected
                ? persona.color
                : "#2a3550",
          opacity: isLoading ? 1 : isDone ? 1 : isSelected ? 0.5 : 1,
          animation: isLoading ? "pulse 1s infinite" : "none",
        }}
      />
    </button>
  );
}

// ─── Response Card ──────────────────────────────────

function ResponseCard({
  persona,
  state,
  language,
}: {
  persona: Persona;
  state?: ResponseState;
  language: string;
}) {
  const name = language === "he" ? persona.nameHe : persona.nameEn;
  const role = language === "he" ? persona.roleHe : persona.roleEn;
  const isLoading = state?.loading ?? true;
  const text = state?.text ?? "";
  const error = state?.error;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-[14px] border"
      style={{
        borderColor: text ? persona.border : "rgb(30 41 59 / 0.5)",
        background: "#0a0e1a",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 border-b px-4 py-3"
        style={{
          borderColor: text ? persona.border : "rgb(30 41 59 / 0.5)",
          background: text ? persona.bg : "transparent",
        }}
      >
        <span className="text-xl">{persona.emoji}</span>
        <div>
          <div className="text-[13px] font-bold" style={{ color: persona.color }}>
            {name}
          </div>
          <div className="text-[10px] text-slate-600">{role}</div>
        </div>
        {isLoading && (
          <div
            className="ms-auto flex items-center gap-1.5 text-[11px]"
            style={{ color: persona.color }}
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            {language === "he" ? "חושב..." : "Thinking..."}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 text-[13px] leading-relaxed text-slate-300">
        {isLoading && !text ? (
          <div className="flex flex-col gap-2">
            {[90, 75, 85, 60].map((w, i) => (
              <div
                key={i}
                className="h-2.5 animate-pulse rounded bg-slate-800"
                style={{ width: `${w}%`, animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <div className="whitespace-pre-wrap">{text}</div>
        )}
      </div>
    </div>
  );
}
