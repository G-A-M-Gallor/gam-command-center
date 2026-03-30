import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";

/**
 * Course Lessons API — /api/courses/[id]/lessons
 *
 * GET — list all lessons for a course
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { _user },
    } = await supabase.auth.getUser();

    if (!_user) {
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

    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_number", { ascending: true });

    if (error) {
      console.error("Error fetching lessons:", error);
      return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
    }

    return NextResponse.json(lessons || []);
  } catch (error) {
    console.error("GET /api/courses/[id]/lessons error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}