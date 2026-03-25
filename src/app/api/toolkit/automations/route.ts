import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Automations API — /api/toolkit/automations
 *
 * GET — list all automations
 */

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: automations, error } = await supabase
      .from("cc_automations")
      .select("*")
      .order("status", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching automations:", error);
      return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
    }

    return NextResponse.json(automations || []);
  } catch (error) {
    console.error("GET /api/toolkit/automations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}