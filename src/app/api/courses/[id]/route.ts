import { NextRequest, NextResponse } from "next/server";
import { getCourseById, updateCourse, deleteCourse } from "@/lib/courses/courseQueries";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";

const updateCourseSchema = z.object({
  name: z.string().min(1, "Course name is required").optional(),
  emoji: z.string().optional(),
  platform: z.enum(['udemy', 'youtube', 'coursera', 'vimeo', 'local']).optional(),
  language: z.string().optional(),
  status: z.enum(['planned', 'active', 'paused', 'completed']).optional(),
  description: z.string().optional(),
  drive_folder_id: z.string().optional(),
  drive_folder_url: z.string().optional(),
  google_account_id: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/courses/[id] — Get specific course
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const resolvedParams = await params;
    const course = await getCourseById(resolvedParams.id, userId);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courses/[id] — Update course
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const resolvedParams = await params;

    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const updatedCourse = await updateCourse(resolvedParams.id, userId, updateData);
    return NextResponse.json(updatedCourse);
  } catch (error: unknown) {
    console.error("Error updating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to _update course" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id] — Delete course
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const resolvedParams = await params;

    await deleteCourse(resolvedParams.id, userId);

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}