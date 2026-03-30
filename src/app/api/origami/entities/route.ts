import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetches Origami entity list.
 * Requires ORIGAMI_API_KEY and ORIGAMI_BASE_URL env vars.
 * Auth: returns empty when unauthenticated (widget calls without token).
 */
export async function GET() {
  // Verify user session via cookie
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ entities: [], connected: false });
  }

  const apiKey = process.env.ORIGAMI_API_KEY;
  const baseUrl = process.env.ORIGAMI_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ entities: [], connected: false });
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/entities`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { entities: [], connected: false, error: `Origami returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ entities: data.entities || data, connected: true });
  } catch (err) {
    return NextResponse.json(
      { entities: [], connected: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
