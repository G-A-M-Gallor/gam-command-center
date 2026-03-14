import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/tokenManager";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface CalendarEvent {
  id: string;
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  colorId?: string;
}

// GET /api/google/calendar?account_id=xxx&days=2
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const accountId = params.get("account_id");
  if (!accountId) {
    return NextResponse.json({ error: "Missing account_id" }, { status: 400 });
  }

  const days = Math.min(Math.max(parseInt(params.get("days") || "2", 10) || 2, 1), 7);

  try {
    const accessToken = await getValidAccessToken(accountId, user.id);

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const eventsUrl = new URL(`${CALENDAR_API}/calendars/primary/events`);
    eventsUrl.searchParams.set("timeMin", timeMin);
    eventsUrl.searchParams.set("timeMax", timeMax);
    eventsUrl.searchParams.set("orderBy", "startTime");
    eventsUrl.searchParams.set("singleEvents", "true");
    eventsUrl.searchParams.set("maxResults", "20");

    const res = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Calendar API failed: ${err}`);
    }

    const data = await res.json();
    const events = ((data.items || []) as CalendarEvent[]).map((e) => ({
      id: e.id,
      title: e.summary || "(no title)",
      start: e.start?.dateTime || e.start?.date || "",
      end: e.end?.dateTime || e.end?.date || "",
      location: e.location || null,
      isAllDay: !e.start?.dateTime,
    }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error("Calendar API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
