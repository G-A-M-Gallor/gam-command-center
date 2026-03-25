import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Courses API — /api/courses
 *
 * GET — list all courses
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

    const { data: courses, error } = await supabase
      .from("cc_courses")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching courses:", error);
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }

    return NextResponse.json(courses || []);
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}