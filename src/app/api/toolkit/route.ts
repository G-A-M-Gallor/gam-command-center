import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * Toolkit API — /api/toolkit
 *
 * GET    — list all tools
 * POST   — add a new tool
 * PATCH  — update tool status
 * DELETE — delete a tool
 */

// Validation schemas
const createToolSchema = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().max(10).default("🔧"),
  category: z.enum(["download", "transcription", "ai", "dev", "media", "general"]).default("general"),
  status: z.enum(["installed", "recommended", "optional"]).default("optional"),
  description: z.string().max(500).optional(),
  install_command: z.string().max(1000).optional(),
  link: z.string().url().optional().or(z.literal("")),
  claude_prompt: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional()
});

const updateToolSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["installed", "recommended", "optional"]).optional(),
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().max(10).optional(),
  category: z.enum(["download", "transcription", "ai", "dev", "media", "general"]).optional(),
  description: z.string().max(500).optional(),
  install_command: z.string().max(1000).optional(),
  link: z.string().url().optional().or(z.literal("")),
  claude_prompt: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional()
});

// ─── GET /api/toolkit ────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { _user },
    } = await supabase.auth.getUser();

    if (!_user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tools, error } = await supabase
      .from("cc_toolkit")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching tools:", error);
      return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
    }

    return NextResponse.json(tools || []);
  } catch (error) {
    console.error("GET /api/toolkit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/toolkit ────────────────────────────────

export async function POST(_request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { _user },
    } = await supabase.auth.getUser();

    if (!_user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createToolSchema.parse(body);

    const { data: newTool, error } = await supabase
      .from("cc_toolkit")
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error("Error creating tool:", error);
      return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
    }

    return NextResponse.json(newTool, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }

    console.error("POST /api/toolkit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/toolkit ────────────────────────────────

export async function PATCH(_request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { _user },
    } = await supabase.auth.getUser();

    if (!_user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = updateToolSchema.parse(body);

    const { data: updatedTool, error } = await supabase
      .from("cc_toolkit")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tool:", error);
      return NextResponse.json({ error: "Failed to _update tool" }, { status: 500 });
    }

    return NextResponse.json(updatedTool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }

    console.error("PATCH /api/toolkit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/toolkit ────────────────────────────────

export async function DELETE(_request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { _user },
    } = await supabase.auth.getUser();

    if (!_user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cc_toolkit")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting tool:", error);
      return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/toolkit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}