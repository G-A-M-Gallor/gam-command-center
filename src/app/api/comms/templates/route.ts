import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/comms/templates?channel=whatsapp
 * Fetch message templates, optionally filtered by channel.
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const channel = request.nextUrl.searchParams.get("channel");
    const supabase = getServiceClient();

    let query = supabase
      .from("comm_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (channel) query = query.eq("channel", channel);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
