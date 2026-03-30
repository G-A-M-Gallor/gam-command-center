import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { pushSubscribeSchema } from "@/lib/api/schemas";

export async function POST(_request: Request) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  // Upsert subscription (one per _user+endpoint)
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        email: _user.email || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint } = body as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", _user.id)
    .eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
