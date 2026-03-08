'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NoteRecord, GlobalField, I18nLabel } from '@/lib/entities/types';

interface Props {
  notes: NoteRecord[];
  fields: GlobalField[];
  language: string;
}

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarView({ notes, fields, language }: Props) {
  const isHe = language === 'he';
  const lang = isHe ? 'he' : 'en';
  const days = isHe ? DAYS_HE : DAYS_EN;
  const months = isHe ? MONTHS_HE : MONTHS_EN;

  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Find the date field to use
  const dateField = useMemo(
    () => fields.find(f => f.field_type === 'date') ?? null,
    [fields],
  );

  // Map notes to dates
  const notesByDate = useMemo(() => {
    const map: Record<string, NoteRecord[]> = {};
    if (!dateField) return map;

    for (const note of notes) {
      const val = note.meta[dateField.meta_key];
      if (!val) continue;
      const dateStr = String(val).slice(0, 10); // YYYY-MM-DD
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(note);
    }
    return map;
  }, [notes, dateField]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  if (!dateField) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        {isHe ? 'אין שדה תאריך מוגדר בישות זו' : 'No date field defined for this entity'}
      </div>
    );
  }

  return (
    <div dir={isHe ? 'rtl' : 'ltr'}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06]">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-slate-200">
          {months[month]} {year}
        </span>
        <button onClick={nextMonth} className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06]">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border border-white/[0.06] overflow-hidden">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="min-h-[80px] bg-white/[0.01]" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayNotes = notesByDate[dateStr] ?? [];

          return (
            <div
              key={i}
              className={`min-h-[80px] p-1.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors ${
                isToday(day) ? 'ring-1 ring-inset ring-purple-500/40' : ''
              }`}
            >
              <div className={`text-[10px] mb-1 ${isToday(day) ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayNotes.slice(0, 3).map(note => {
                  const statusField = fields.find(f => f.field_type === 'select');
                  const statusVal = statusField ? note.meta[statusField.meta_key] : null;
                  const statusOpt = statusField?.options.find(o => o.value === statusVal);
                  return (
                    <a
                      key={note.id}
                      href={`/dashboard/editor/${note.id}`}
                      className="block truncate rounded px-1 py-0.5 text-[9px] hover:bg-white/[0.06]"
                      style={{ color: statusOpt?.color ?? '#cbd5e1' }}
                    >
                      {note.title}
                    </a>
                  );
                })}
                {dayNotes.length > 3 && (
                  <span className="text-[8px] text-slate-500 px-1">+{dayNotes.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
