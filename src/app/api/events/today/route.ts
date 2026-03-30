import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";

/** Returns today's events from dashboard_events table + upcoming deadlines from projects */
export async function GET() {
  const supabase = await createClient();

  // Verify user session via cookie — return empty when unauthenticated
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ events: [] });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const events: Array<{
    time: string;
    title: { he: string; en: string };
    project?: { he: string; en: string };
    type: "meeting" | "deadline" | "reminder";
  }> = [];

  // Try dashboard_events table (may not exist yet)
  try {
    const { data } = await supabase
      .from("dashboard_events")
      .select("*")
      .gte("event_date", today.toISOString())
      .lt("event_date", tomorrow.toISOString())
      .order("event_date", { ascending: true });

    if (data) {
      for (const ev of data) {
        events.push({
          time: new Date(ev.event_date).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          title: { he: ev.title_he || ev.title, en: ev.title },
          type: ev.event_type || "reminder",
        });
      }
    }
  } catch {
    // Table may not exist — that's fine
  }

  // Also check for recently updated projects as activity
  try {
    const { data: recentProjects } = await supabase
      .from("projects")
      .select("name, updated_at")
      .gte("updated_at", today.toISOString())
      .order("updated_at", { ascending: false })
      .limit(5);

    if (recentProjects) {
      for (const p of recentProjects) {
        events.push({
          time: new Date(p.updated_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          title: { he: `עדכון: ${p.name}`, en: `Updated: ${p.name}` },
          type: "reminder",
        });
      }
    }
  } catch {
    // OK
  }

  return NextResponse.json({ events });
}
