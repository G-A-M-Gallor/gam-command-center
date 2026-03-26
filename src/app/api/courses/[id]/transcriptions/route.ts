import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Course Transcriptions API — /api/courses/[id]/transcriptions
 *
 * GET — list all transcriptions for a course
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { data: transcriptions, error } = await supabase
      .from("transcriptions")
      .select(`
        *,
        lessons!inner (
          title,
          lesson_number,
          duration_minutes
        )
      `)
      .eq("course_id", courseId)
      .order("lessons(lesson_number)", { ascending: true });

    if (error) {
      console.error("Error fetching transcriptions:", error);
      return NextResponse.json({ error: "Failed to fetch transcriptions" }, { status: 500 });
    }

    return NextResponse.json(transcriptions || []);
  } catch (error) {
    console.error("GET /api/courses/[id]/transcriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}