import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";

/**
 * MCP Connections API — /api/toolkit/connections
 *
 * GET — list all MCP connections for workspace
 */

const WORKSPACE_ID = "3ecaf990-43ef-4b91-9956-904a8b97b851";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { _user },
    } = await supabase.auth.getUser();

    if (!_user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: connections, error } = await supabase
      .from("vb_mcp_connections")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching MCP connections:", error);
      return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }

    return NextResponse.json(connections || []);
  } catch (error) {
    console.error("GET /api/toolkit/connections error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}