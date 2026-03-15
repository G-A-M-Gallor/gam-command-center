'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { updateNoteMeta } from '@/lib/supabase/entityQueries';
import type { NoteRecord, GlobalField, TemplateConfig } from '@/lib/entities/types';

interface Props {
  notes: NoteRecord[];
  fields: GlobalField[];
  onUpdate: () => void;
  language: string;
  ganttConfig?: TemplateConfig['gantt_config'];
}

type ZoomLevel = 'day' | 'week' | 'month';

const DAY_MS = 86400000;
const ZOOM_WIDTHS: Record<ZoomLevel, number> = { day: 40, week: 120, month: 200 };
const ROW_HEIGHT = 36;
const LABEL_WIDTH = 200;
const HEADER_HEIGHT = 40;
const BAR_HEIGHT = 20;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function formatHeader(d: Date, zoom: ZoomLevel, lang: string): string {
  const locale = lang === 'he' ? 'he-IL' : lang === 'ru' ? 'ru-RU' : 'en-US';
  if (zoom === 'day') return d.toLocaleDateString(locale, { day: 'numeric', weekday: 'short' });
  if (zoom === 'week') return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}

function getStatusColor(meta: Record<string, unknown>): string {
  const s = String(meta.status ?? '');
  const colors: Record<string, string> = {
    'todo': '#60a5fa', 'in-progress': '#f472b6', 'done': '#34d399',
    'cancelled': '#ef4444', 'lead': '#94a3b8', 'qualified': '#60a5fa',
    'proposal': '#a78bfa', 'negotiation': '#fbbf24', 'closed_won': '#34d399',
    'closed_lost': '#ef4444',
  };
  return colors[s] ?? '#a78bfa';
}

interface GanttBar {
  note: NoteRecord;
  start: Date;
  end: Date;
  group?: string;
}

export function GanttView({ notes, onUpdate, language, ganttConfig }: Props) {
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ noteId: string; edge: 'start' | 'end'; initialX: number; initialDate: Date } | null>(null);

  const startField = ganttConfig?.start_field ?? 'start_date';
  const endField = ganttConfig?.end_field ?? 'due_date';
  const groupField = ganttConfig?.group_field;

  // Build bars
  const { bars, minDate, maxDate } = useMemo(() => {
    const result: GanttBar[] = [];
    let min = new Date(2099, 0, 1);
    let max = new Date(2000, 0, 1);
    const groupSet = new Set<string>();

    for (const note of notes) {
      const start = parseDate(note.meta[startField]);
      const end = parseDate(note.meta[endField]);
      if (!start) continue;
      const actualEnd = end ?? new Date(start.getTime() + DAY_MS * 3); // Default 3 days
      const group = groupField ? String(note.meta[groupField] ?? '') : undefined;
      if (group) groupSet.add(group);

      if (start < min) min = new Date(start);
      if (actualEnd > max) max = new Date(actualEnd);

      result.push({ note, start, end: actualEnd, group });
    }

    // Add padding
    min = new Date(min.getTime() - DAY_MS * 2);
    max = new Date(max.getTime() + DAY_MS * 5);

    return { bars: result, minDate: min, maxDate: max, groups: Array.from(groupSet).sort() };
  }, [notes, startField, endField, groupField]);

  // Sort bars by group then start
  const sortedBars = useMemo(() => {
    return [...bars].sort((a, b) => {
      if (groupField) {
        const ga = a.group ?? '';
        const gb = b.group ?? '';
        if (ga !== gb) return ga.localeCompare(gb);
      }
      return a.start.getTime() - b.start.getTime();
    });
  }, [bars, groupField]);

  const totalDays = daysBetween(minDate, maxDate);
  const dayWidth = ZOOM_WIDTHS[zoom] / (zoom === 'week' ? 7 : zoom === 'month' ? 30 : 1);
  const totalWidth = Math.max(totalDays * dayWidth, 400);
  const totalHeight = HEADER_HEIGHT + sortedBars.length * ROW_HEIGHT + 20;

  // Time axis ticks
  const ticks = useMemo(() => {
    const result: { x: number; label: string; major: boolean }[] = [];
    const step = zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30;
    const d = new Date(minDate);
    while (d <= maxDate) {
      const x = daysBetween(minDate, d) * dayWidth;
      const major = zoom === 'day' ? d.getDay() === 0 : zoom === 'week' ? d.getDate() <= 7 : d.getMonth() % 3 === 0;
      result.push({ x, label: formatHeader(d, zoom, lang), major });
      d.setDate(d.getDate() + step);
    }
    return result;
  }, [minDate, maxDate, zoom, dayWidth, lang]);

  // Today marker
  const today = new Date();
  const todayX = today >= minDate && today <= maxDate ? daysBetween(minDate, today) * dayWidth : null;

  // Drag handlers
  const handleDragStart = useCallback((noteId: string, edge: 'start' | 'end', clientX: number, date: Date) => {
    setDragging({ noteId, edge, initialX: clientX, initialDate: date });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragMove = useCallback((_e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    // Handled via onMouseUp for simplicity
  }, [dragging]);

  const handleDragEnd = useCallback(async (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = e.clientX - rect.left - LABEL_WIDTH;
    const dayOffset = Math.round(svgX / dayWidth);
    const newDate = new Date(minDate.getTime() + dayOffset * DAY_MS);
    const dateStr = newDate.toISOString().split('T')[0];

    const field = dragging.edge === 'start' ? startField : endField;
    await updateNoteMeta(dragging.noteId, { [field]: dateStr });
    setDragging(null);
    onUpdate();
  }, [dragging, dayWidth, minDate, startField, endField, onUpdate]);

  if (sortedBars.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        {lang === 'he' ? 'אין נתונים להצגה בתצוגת גאנט' : 'No data for Gantt view'}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden" dir="ltr">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] text-slate-500 me-1">{lang === 'he' ? 'זום' : 'Zoom'}:</span>
        {(['day', 'week', 'month'] as ZoomLevel[]).map(z => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`text-[10px] px-2 py-1 rounded ${zoom === z ? 'bg-purple-600/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {z === 'day' ? (lang === 'he' ? 'יום' : 'Day') : z === 'week' ? (lang === 'he' ? 'שבוע' : 'Week') : (lang === 'he' ? 'חודש' : 'Month')}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div className="flex">
          {/* Left label panel */}
          <div className="shrink-0 border-e border-white/[0.06] bg-white/[0.02]" style={{ width: LABEL_WIDTH }}>
            <div className="h-10 border-b border-white/[0.06]" />
            {sortedBars.map((bar) => (
              <div
                key={bar.note.id}
                className="flex items-center px-3 text-xs text-slate-300 truncate border-b border-white/[0.02]"
                style={{ height: ROW_HEIGHT }}
                title={bar.note.title}
              >
                {bar.note.title}
              </div>
            ))}
          </div>

          {/* SVG canvas */}
          <svg
            ref={svgRef}
            width={totalWidth}
            height={totalHeight}
            className="block"
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={() => setDragging(null)}
          >
            {/* Background grid */}
            {ticks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={tick.x} y1={HEADER_HEIGHT} x2={tick.x} y2={totalHeight}
                  stroke={tick.major ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}
                />
                <text
                  x={tick.x + 4} y={HEADER_HEIGHT - 8}
                  className="fill-slate-500" fontSize={9}
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Row stripes */}
            {sortedBars.map((_, i) => (
              <rect
                key={i}
                x={0} y={HEADER_HEIGHT + i * ROW_HEIGHT}
                width={totalWidth} height={ROW_HEIGHT}
                fill={i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
              />
            ))}

            {/* Today marker */}
            {todayX !== null && (
              <line
                x1={todayX} y1={HEADER_HEIGHT} x2={todayX} y2={totalHeight}
                stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 4" opacity={0.5}
              />
            )}

            {/* Bars */}
            {sortedBars.map((bar, i) => {
              const startX = daysBetween(minDate, bar.start) * dayWidth;
              const barWidth = Math.max(daysBetween(bar.start, bar.end) * dayWidth, dayWidth);
              const y = HEADER_HEIGHT + i * ROW_HEIGHT + BAR_Y_OFFSET;
              const color = getStatusColor(bar.note.meta);

              return (
                <g key={bar.note.id}>
                  {/* Bar body */}
                  <rect
                    x={startX} y={y} width={barWidth} height={BAR_HEIGHT}
                    rx={4} fill={color} opacity={0.7}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                  {/* Start handle */}
                  <rect
                    x={startX} y={y} width={6} height={BAR_HEIGHT}
                    rx={2} fill="transparent"
                    className="cursor-ew-resize"
                    onMouseDown={e => handleDragStart(bar.note.id, 'start', e.clientX, bar.start)}
                  />
                  {/* End handle */}
                  <rect
                    x={startX + barWidth - 6} y={y} width={6} height={BAR_HEIGHT}
                    rx={2} fill="transparent"
                    className="cursor-ew-resize"
                    onMouseDown={e => handleDragStart(bar.note.id, 'end', e.clientX, bar.end)}
                  />
                  {/* Label */}
                  {barWidth > 60 && (
                    <text
                      x={startX + 8} y={y + BAR_HEIGHT / 2 + 3}
                      fontSize={10} className="fill-white" style={{ pointerEvents: 'none' }}
                    >
                      {bar.note.title.length > barWidth / 7
                        ? bar.note.title.slice(0, Math.floor(barWidth / 7)) + '…'
                        : bar.note.title}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
