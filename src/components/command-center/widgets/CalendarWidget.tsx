'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, MapPin, ExternalLink, Loader2, Settings, ChevronDown } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import type { WidgetSize } from './WidgetRegistry';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  isAllDay: boolean;
}

interface GoogleAccount {
  id: string;
  google_email: string;
  display_name: string | null;
  scopes: string[];
  is_active: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.getFullYear() === tom.getFullYear() && d.getMonth() === tom.getMonth() && d.getDate() === tom.getDate();
}

function startsIn(dateStr: string, rt: { now: string; inMinutes: string; inHours: string }): string | null {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0 || diff > 24 * 60 * 60 * 1000) return null;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return rt.now;
  if (mins < 60) return rt.inMinutes.replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  return rt.inHours.replace('{n}', String(hours));
}

export function CalendarPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const c = t.googleCalendar as Record<string, string>;

  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Load accounts
  useEffect(() => {
    fetch('/api/google/accounts')
      .then((r) => r.json())
      .then((data) => {
        const active = (data.accounts || []).filter(
          (a: GoogleAccount) => a.is_active && a.scopes?.includes('https://www.googleapis.com/auth/calendar.readonly')
        );
        setAccounts(active);
        if (active.length > 0 && !selectedAccountId) {
          setSelectedAccountId(active[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (accounts.length === 0) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEvents = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/google/calendar?account_id=${selectedAccountId}&days=2`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  // No accounts connected
  if (!loading && accounts.length === 0) {
    return (
      <div className="w-80 p-4" data-cc-id="widget.calendar.panel">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CalendarDays className="h-8 w-8 text-slate-600" />
          <p className="text-xs text-slate-500">{c.noAccount}</p>
          <a
            href="/dashboard/settings"
            className="flex items-center gap-1 text-xs text-purple-400 transition-colors hover:text-purple-300"
          >
            <Settings className="h-3 w-3" />
            {c.connectAccount}
          </a>
        </div>
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Group by day
  const todayEvents = events.filter((e) => isToday(e.start));
  const tomorrowEvents = events.filter((e) => isTomorrow(e.start));

  const renderEvent = (event: CalendarEvent) => (
    <div
      key={event.id}
      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
    >
      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-purple-400/60" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[11px] text-slate-300">{event.title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          {event.isAllDay ? (
            <span>{c.allDay}</span>
          ) : (
            <span>{formatTime(event.start)} – {formatTime(event.end)}</span>
          )}
          {event.location && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5" />
                {event.location}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 p-3" data-cc-id="widget.calendar.panel">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-300">{c.upcoming}</h3>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountPicker(!showAccountPicker)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
              >
                {selectedAccount?.google_email?.split('@')[0]}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showAccountPicker && (
                <div className="absolute end-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-white/[0.06] bg-slate-800 p-1 shadow-xl">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setShowAccountPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-[11px] transition-colors hover:bg-white/[0.05] ${
                        acc.id === selectedAccountId ? 'text-purple-400' : 'text-slate-400'
                      }`}
                    >
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {acc.google_email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-slate-600" />}
        </div>
      </div>

      {/* Events */}
      {events.length === 0 && !loading ? (
        <p className="py-6 text-center text-xs text-slate-600">{c.noEvents}</p>
      ) : (
        <div className="space-y-2">
          {todayEvents.length > 0 && (
            <div>
              <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {c.today}
              </div>
              <div className="space-y-0.5">{todayEvents.map(renderEvent)}</div>
            </div>
          )}
          {tomorrowEvents.length > 0 && (
            <div>
              <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {c.tomorrow}
              </div>
              <div className="space-y-0.5">{tomorrowEvents.map(renderEvent)}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <a
        href="https://calendar.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-1.5 text-[11px] text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
      >
        <ExternalLink className="h-3 w-3" />
        {c.openInCalendar}
      </a>
    </div>
  );
}

export function CalendarBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const rt = getTranslations(language).relativeTime;
  const [nextEvent, setNextEvent] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/google/accounts')
      .then((r) => r.json())
      .then((data) => {
        const acc = (data.accounts || []).find(
          (a: GoogleAccount) =>
            a.is_active && a.scopes?.includes('https://www.googleapis.com/auth/calendar.readonly')
        );
        if (acc) setAccountId(acc.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!accountId) return;

    const fetchNext = () => {
      fetch(`/api/google/calendar?account_id=${accountId}&days=1`)
        .then((r) => r.json())
        .then((data) => {
          const upcoming = (data.events || []).find(
            (e: CalendarEvent) => !e.isAllDay && new Date(e.start).getTime() > Date.now()
          );
          if (upcoming) {
            setNextEvent(startsIn(upcoming.start, rt));
          } else {
            setNextEvent(null);
          }
        })
        .catch(() => {});
    };

    fetchNext();
    const interval = setInterval(fetchNext, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accountId, language]);

  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="h-4 w-4" />
      {size >= 2 && nextEvent && (
        <span className="text-xs text-slate-400">{nextEvent}</span>
      )}
      {size >= 2 && !nextEvent && (
        <span className="text-xs text-slate-400">Cal</span>
      )}
    </div>
  );
}
