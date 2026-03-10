import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/auth";
import { z } from "zod";

/**
 * GET /api/notifications — fetch recent notifications
 * POST /api/notifications — create a notification
 * PATCH /api/notifications — mark notifications as read
 */

const postSchema = z.object({
  type: z.enum(["status", "mention", "deadline", "ai", "entity"]).default("status"),
  titleHe: z.string().min(1).max(500),
  titleEn: z.string().min(1).max(500),
  titleRu: z.string().max(500).optional(),
  userId: z.string().uuid().optional(),
  actionUrl: z.string().max(1000).optional(),
  channel: z.string().max(50).optional(),
});

const patchSchema = z.union([
  z.object({ markAllRead: z.literal(true) }),
  z.object({ id: z.string().min(1) }),
]);

export async function GET(request: Request) {
  const { error: authError } = await requireAuth(request);
  if (authError) {
    // Allow unauthenticated reads (widget calls without token) — return empty gracefully
    return NextResponse.json({ notifications: [], persisted: false });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from("dashboard_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // Filter: show user-specific + global (user_id IS NULL) notifications
    if (user) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ notifications: [], persisted: false });
    }

    const notifications = (data || []).map((n: Record<string, unknown>) => ({
      id: n.id,
      type: n.notification_type || "status",
      title: {
        he: n.title_he || n.title,
        en: n.title,
        ru: n.title_ru || n.title,
      },
      timestamp: new Date(n.created_at as string).getTime(),
      read: n.is_read || false,
      actionUrl: n.action_url || null,
    }));

    return NextResponse.json({ notifications, persisted: true });
  } catch {
    return NextResponse.json({ notifications: [], persisted: false });
  }
}

export async function POST(request: Request) {
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ saved: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { saved: false, error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { type, titleHe, titleEn, titleRu, userId, actionUrl, channel } = parsed.data;
    const supabase = await createClient();

    const { error } = await supabase.from("dashboard_notifications").insert({
      notification_type: type,
      title: titleEn,
      title_he: titleHe,
      title_ru: titleRu || titleEn,
      is_read: false,
      user_id: userId || null,
      action_url: actionUrl || null,
      channel: channel || 'in-app',
    });

    if (error) {
      return NextResponse.json({ saved: false, error: error.message });
    }

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ saved: false });
  }
}

export async function PATCH(request: Request) {
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ updated: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { updated: false, error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if ("markAllRead" in parsed.data) {
      await supabase
        .from("dashboard_notifications")
        .update({ is_read: true })
        .eq("is_read", false);
    } else {
      await supabase
        .from("dashboard_notifications")
        .update({ is_read: true })
        .eq("id", parsed.data.id);
    }

    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json({ updated: false });
  }
}
