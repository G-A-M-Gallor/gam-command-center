"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { hexToHsl, hslToHex } from "@/lib/colorUtils";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  onSave?: (hex: string) => void;
  onApply?: (hex: string) => void;
  saveLabel?: string;
  applyLabel?: string;
}

export function ColorPicker({
  value,
  onChange,
  onSave,
  onApply,
  saveLabel = "Save",
  applyLabel = "Apply",
}: ColorPickerProps) {
  const initial = hexToHsl(value || "#9333ea");
  const [hue, setHue] = useState(initial.h);
  const [sat, setSat] = useState(initial.s);
  const [lit, setLit] = useState(initial.l);
  const [hexInput, setHexInput] = useState(value || "#9333ea");

  const currentHex = hslToHex(hue, sat, lit);

  // Sync external value changes
  useEffect(() => {
    if (value && value !== currentHex) {
      const hsl = hexToHsl(value);
      setHue(hsl.h);
      setSat(hsl.s);
      setLit(hsl.l);
      setHexInput(value);
    }
  }, [value, currentHex]);

  // Update hex input + notify parent
  useEffect(() => {
    setHexInput(currentHex);
    onChange(currentHex);
  }, [hue, sat, lit, currentHex, onChange]);

  const handleHexChange = useCallback((text: string) => {
    setHexInput(text);
    if (/^#[0-9a-fA-F]{6}$/.test(text)) {
      const hsl = hexToHsl(text);
      setHue(hsl.h);
      setSat(hsl.s);
      setLit(hsl.l);
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Hue Bar */}
      <HueBar hue={hue} onChange={setHue} />

      {/* Saturation-Lightness Square */}
      <SLSquare hue={hue} sat={sat} lit={lit} onSatChange={setSat} onLitChange={setLit} />

      {/* Preview + Hex + Actions */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-600"
          style={{ backgroundColor: currentHex }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-24 rounded bg-slate-700 px-2 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
          spellCheck={false}
        />
        <div className="flex flex-1 gap-2">
          {onApply && (
            <button
              type="button"
              onClick={() => onApply(currentHex)}
              className="flex-1 rounded bg-[var(--cc-accent-600-30)] px-3 py-1.5 text-xs font-medium text-[var(--cc-accent-300)] transition-colors hover:bg-[var(--cc-accent-600)]"
            >
              {applyLabel}
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(currentHex)}
              className="flex-1 rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-600"
            >
              {saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hue Bar ──────────────────────────────────────────────────

function HueBar({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const barRef = useRef<HTMLDivElement>(null);

  const calcHue = useCallback((clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    onChange((x / rect.width) * 360);
  }, [onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    calcHue(e.clientX);
  }, [calcHue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    calcHue(e.clientX);
  }, [calcHue]);

  return (
    <div
      ref={barRef}
      className="relative h-4 cursor-crosshair rounded-full"
      style={{
        background:
          "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div
        className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
        }}
      />
    </div>
  );
}

// ─── Saturation-Lightness Square ──────────────────────────────

function SLSquare({
  hue,
  sat,
  lit,
  onSatChange,
  onLitChange,
}: {
  hue: number;
  sat: number;
  lit: number;
  onSatChange: (s: number) => void;
  onLitChange: (l: number) => void;
}) {
  const squareRef = useRef<HTMLDivElement>(null);

  const calcSL = useCallback((clientX: number, clientY: number) => {
    const sq = squareRef.current;
    if (!sq) return;
    const rect = sq.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    onSatChange((x / rect.width) * 100);
    onLitChange(100 - (y / rect.height) * 100);
  }, [onSatChange, onLitChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    calcSL(e.clientX, e.clientY);
  }, [calcSL]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    calcSL(e.clientX, e.clientY);
  }, [calcSL]);

  return (
    <div
      ref={squareRef}
      className="relative h-40 cursor-crosshair rounded-lg"
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
        `,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${sat}%`,
          top: `${100 - lit}%`,
          backgroundColor: hslToHex(hue, sat, lit),
        }}
      />
    </div>
  );
}
