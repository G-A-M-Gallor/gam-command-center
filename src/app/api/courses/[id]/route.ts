import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCourseById, updateCourse, deleteCourse } from "@/lib/courses/courseQueries";
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let userId = user?.id;
    if (authError || !user) {
      // Temporary: Allow for development - use demo user
      console.log('Auth warning:', authError?.message || 'No user');
      userId = 'demo-user-123';
    }

    const course = await getCourseById(params.id, userId);

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let userId = user?.id;
    if (authError || !user) {
      // Temporary: Allow for development - use demo user
      console.log('Auth warning:', authError?.message || 'No user');
      userId = 'demo-user-123';
    }

    // Check if course exists and belongs to user
    const existingCourse = await getCourseById(params.id, userId);
    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const updatedCourse = await updateCourse(params.id, userId, updateData);
    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.error("Error updating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id] — Delete course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let userId = user?.id;
    if (authError || !user) {
      // Temporary: Allow for development - use demo user
      console.log('Auth warning:', authError?.message || 'No user');
      userId = 'demo-user-123';
    }

    // Check if course exists and belongs to user
    const existingCourse = await getCourseById(params.id, userId);
    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    await deleteCourse(params.id, userId);

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