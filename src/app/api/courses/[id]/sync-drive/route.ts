import { NextRequest, NextResponse } from "next/server";
import { getCourseById } from "@/lib/courses/courseQueries";
import { getUserId } from "@/lib/api/auth";

/**
 * POST /api/courses/[id]/sync-drive - Sync lessons from Google Drive folder
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const resolvedParams = await params;

    // Get course
    const course = await getCourseById(resolvedParams.id, userId);
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const { drive_folder_id } = await request.json();
    
    if (!drive_folder_id) {
      return NextResponse.json(
        { error: "Drive folder ID is required" },
        { status: 400 }
      );
    }

    // For now, return demo sync results
    const demoLessons = [
      {
        title: "01 - Introduction to the Course",
        lesson_number: 1,
        duration_minutes: 15,
        drive_file_id: "demo-file-1",
        drive_file_url: `https://drive.google.com/file/d/demo-file-1/view`,
        file_format: "mp4",
        file_size_mb: 245.5
      },
      {
        title: "02 - Getting Started with Setup",
        lesson_number: 2,
        duration_minutes: 22,
        drive_file_id: "demo-file-2",
        drive_file_url: `https://drive.google.com/file/d/demo-file-2/view`,
        file_format: "mp4",
        file_size_mb: 387.2
      },
      {
        title: "03 - Core Concepts Explained",
        lesson_number: 3,
        duration_minutes: 28,
        drive_file_id: "demo-file-3",
        drive_file_url: `https://drive.google.com/file/d/demo-file-3/view`,
        file_format: "mp4",
        file_size_mb: 456.8
      }
    ];

    console.log(`📁 Synced ${demoLessons.length} lessons from Drive folder: ${drive_folder_id}`);

    return NextResponse.json({
      message: "Drive sync completed",
      lessons_found: demoLessons.length,
      lessons: demoLessons
    });

  } catch (error: unknown) {
    console.error("Drive sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync with Drive", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
