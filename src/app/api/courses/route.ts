import { NextRequest, NextResponse } from "next/server";
import { createCourse } from "@/lib/courses/courseQueries";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";

const createCourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  emoji: z.string().optional(),
  platform: z.enum(['udemy', 'youtube', 'coursera', 'vimeo', 'local']),
  language: z.string().optional(),
  status: z.enum(['planned', 'active', 'paused', 'completed']).optional(),
  description: z.string().optional(),
  drive_folder_id: z.string().optional(),
  drive_folder_url: z.string().optional(),
  google_account_id: z.string().optional(),
  source_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/courses — List user's courses
 */
export async function GET() {
  try {
    const userId = await getUserId();

    console.log('📚 Fetching courses for userId:', userId);

    // Temporary: Return demo courses until migration is run
    const demoCourses = [
      {
        id: "demo-1",
        name: "React + TypeScript מתקדם",
        emoji: "⚛️",
        platform: "udemy",
        language: "he",
        status: "active",
        description: "קורס מתקדם ב-React עם TypeScript",
        drive_folder_id: "demo-folder-1",
        drive_folder_url: "https://drive.google.com/drive/folders/demo1",
        total_lessons: 45,
        completed_lessons: 12,
        total_duration_minutes: 1200,
        tags: ["React", "TypeScript", "Frontend"],
        created_at: "2026-01-15T10:00:00Z",
        updated_at: "2026-03-20T15:30:00Z"
      },
      {
        id: "demo-2",
        name: "Next.js 15 - Complete Guide",
        emoji: "🚀",
        platform: "youtube",
        language: "en",
        status: "active",
        description: "Complete Next.js course covering App Router, Server Components, and more",
        drive_folder_id: "demo-folder-2",
        drive_folder_url: "https://drive.google.com/drive/folders/demo2",
        total_lessons: 32,
        completed_lessons: 8,
        total_duration_minutes: 960,
        tags: ["Next.js", "React", "Full Stack"],
        created_at: "2026-02-01T09:00:00Z",
        updated_at: "2026-03-25T12:15:00Z"
      },
      {
        id: "demo-3",
        name: "Python for Data Science",
        emoji: "🐍",
        platform: "coursera",
        language: "en",
        status: "paused",
        description: "Data analysis and machine learning with Python",
        total_lessons: 28,
        completed_lessons: 15,
        total_duration_minutes: 840,
        tags: ["Python", "Data Science", "ML"],
        created_at: "2026-01-20T14:00:00Z",
        updated_at: "2026-03-10T16:45:00Z"
      }
    ];

    console.log('📚 Returning demo courses:', demoCourses);
    return NextResponse.json(demoCourses);
  } catch (error: unknown) {
    console.error("❌ Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses — Create new course
 */
export async function POST(_request: NextRequest) {
  try {
    const userId = await getUserId();

    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);
    const course = await createCourse(userId, validatedData);

    return NextResponse.json(course, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
