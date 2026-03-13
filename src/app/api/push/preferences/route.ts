import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushPreferencesSchema } from "@/lib/api/schemas";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("push_subscriptions")
    .select("preferences")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  return NextResponse.json({ preferences: data?.preferences ?? {} });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  // Merge with existing preferences on all user subscriptions
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("preferences")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const merged = { ...(existing?.preferences ?? {}), ...parsed.data };

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ preferences: merged })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }

  return NextResponse.json({ preferences: merged });
}
