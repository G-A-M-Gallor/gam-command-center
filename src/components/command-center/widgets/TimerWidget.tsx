"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

const STATE_KEY = "cc-timer-state";
const SETTINGS_KEY = "cc-timer-settings";
const EVENT_NAME = "timer-state-change";

interface TimerState {
  status: "idle" | "running" | "paused";
  mode: "work" | "break" | "longBreak";
  endTime: number;
  remainingMs: number;
  sessionsToday: number;
  lastSessionDate: string;
}

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakAfter: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
};

const DEFAULT_STATE: TimerState = {
  status: "idle",
  mode: "work",
  endTime: 0,
  remainingMs: 0,
  sessionsToday: 0,
  lastSessionDate: "",
};

function loadState(): TimerState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    // Reset sessions if day changed
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.lastSessionDate !== today) {
      parsed.sessionsToday = 0;
      parsed.lastSessionDate = today;
    }
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: TimerState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT_NAME));
}

function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getDurationMs(mode: TimerState["mode"], settings: TimerSettings): number {
  switch (mode) {
    case "work":
      return settings.workDuration * 60 * 1000;
    case "break":
      return settings.breakDuration * 60 * 1000;
    case "longBreak":
      return settings.longBreakDuration * 60 * 1000;
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function getRemainingMs(state: TimerState, settings: TimerSettings): number {
  if (state.status === "running") {
    return Math.max(0, state.endTime - Date.now());
  }
  if (state.status === "paused") {
    return state.remainingMs;
  }
  return getDurationMs(state.mode, settings);
}

const modeColors = {
  work: "text-[var(--cc-accent-400)]",
  break: "text-emerald-400",
  longBreak: "text-blue-400",
};

const modeStroke = {
  work: "stroke-[var(--cc-accent-500)]",
  break: "stroke-emerald-500",
  longBreak: "stroke-blue-500",
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);

  const [state, setState] = useState<TimerState>(DEFAULT_STATE);
  const settings = loadSettings();
  const [, setTick] = useState(0);

  useEffect(() => {
    setState(loadState());
  }, []);

  // Tick every second when running
  useEffect(() => {
    if (state.status !== "running") return;
    const interval = setInterval(() => {
      const current = loadState();
      if (current.status === "running" && current.endTime <= Date.now()) {
        // Timer finished
        const today = new Date().toISOString().slice(0, 10);
        const sessions =
          current.mode === "work"
            ? current.sessionsToday + 1
            : current.sessionsToday;
        const isLongBreak =
          current.mode === "work" &&
          sessions % settings.longBreakAfter === 0;
        const nextMode =
          current.mode === "work"
            ? isLongBreak
              ? "longBreak"
              : "break"
            : "work";
        const next: TimerState = {
          status: "idle",
          mode: nextMode,
          endTime: 0,
          remainingMs: 0,
          sessionsToday: sessions,
          lastSessionDate: today,
        };
        setState(next);
        saveState(next);
      } else {
        setTick((n) => n + 1);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [state.status, settings.longBreakAfter]);

  // Listen for external changes
  useEffect(() => {
    function sync() {
      setState(loadState());
    }
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  const remainingMs = getRemainingMs(state, settings);
  const totalMs = getDurationMs(state.mode, settings);
  const progress = totalMs > 0 ? remainingMs / totalMs : 1;
  const offset = CIRCUMFERENCE * (1 - progress);

  const handleStart = useCallback(() => {
    const ms =
      state.status === "paused"
        ? state.remainingMs
        : getDurationMs(state.mode, settings);
    const next: TimerState = {
      ...state,
      status: "running",
      endTime: Date.now() + ms,
      remainingMs: 0,
      lastSessionDate:
        state.lastSessionDate || new Date().toISOString().slice(0, 10),
    };
    setState(next);
    saveState(next);
  }, [state, settings]);

  const handlePause = useCallback(() => {
    const remaining = Math.max(0, state.endTime - Date.now());
    const next: TimerState = {
      ...state,
      status: "paused",
      remainingMs: remaining,
      endTime: 0,
    };
    setState(next);
    saveState(next);
  }, [state]);

  const handleReset = useCallback(() => {
    const next: TimerState = {
      ...state,
      status: "idle",
      endTime: 0,
      remainingMs: 0,
    };
    setState(next);
    saveState(next);
  }, [state]);

  const modeLabel =
    state.mode === "work"
      ? t.widgets.timerWork
      : state.mode === "break"
        ? t.widgets.timerBreak
        : t.widgets.timerLongBreak;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular progress */}
      <div className="relative">
        <svg className="-rotate-90" width="128" height="128" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            className="stroke-slate-700"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            className={modeStroke[state.mode]}
            strokeWidth="8"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition:
                state.status === "running"
                  ? "stroke-dashoffset 0.3s linear"
                  : undefined,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-slate-100">
            {formatTime(remainingMs)}
          </span>
          <span className={`text-xs ${modeColors[state.mode]}`}>
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {state.status === "running" ? (
          <button
            type="button"
            onClick={handlePause}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-700 px-4 text-sm text-slate-200 transition-colors hover:bg-slate-600"
          >
            <Pause className="h-3.5 w-3.5" />
            {t.widgets.timerPause}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)]px-4 text-sm text-white transition-colors hover:bg-[var(--cc-accent-500)]"
          >
            <Play className="h-3.5 w-3.5" />
            {t.widgets.timerStart}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-slate-400 transition-colors hover:bg-slate-600 hover:text-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Session counter */}
      <div className="text-center text-xs text-slate-500">
        {t.widgets.timerSessions}: {state.sessionsToday}/
        {settings.longBreakAfter}
      </div>
    </div>
  );
}

export function TimerBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Sync with external state changes
  useEffect(() => {
    function sync() {
      const s = loadState();
      setIsRunning(s.status === "running");
      setTick((n) => n + 1);
    }
    window.addEventListener(EVENT_NAME, sync);
    sync();
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  // Tick every second when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const state = loadState();
  const settings = loadSettings();
  const remainingMs = getRemainingMs(state, settings);

  // Size 1: pulse indicator when running (rendered inside icon wrapper)
  if (size < 2) {
    if (state.status !== "running") return null;
    return (
      <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-400 animate-pulse" />
    );
  }

  const display = formatTime(remainingMs);
  const modeLabel =
    state.mode === "work"
      ? t.widgets.timerWork
      : state.mode === "break"
        ? t.widgets.timerBreak
        : t.widgets.timerLongBreak;

  // Size 2: countdown
  if (size === 2) {
    return (
      <span
        className={`font-mono text-xs ${
          state.status === "running" ? "text-slate-200" : "text-slate-400"
        }`}
      >
        {display}
      </span>
    );
  }

  // Size 3: countdown + mode label
  if (size === 3) {
    return (
      <span className="truncate text-xs text-slate-400">
        <span
          className={`font-mono ${
            state.status === "running" ? "text-slate-200" : ""
          }`}
        >
          {display}
        </span>{" "}
        {modeLabel}
      </span>
    );
  }

  // Size 4: countdown + label + sessions
  return (
    <span className="truncate text-xs text-slate-400">
      <span
        className={`font-mono ${
          state.status === "running" ? "text-slate-200" : ""
        }`}
      >
        {display}
      </span>{" "}
      {modeLabel} {state.sessionsToday}/{settings.longBreakAfter}
    </span>
  );
}
