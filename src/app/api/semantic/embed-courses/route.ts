import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/ai/embeddings";
import { createHash } from "crypto";

function createContentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

async function embedCourseContent(courseId: string) {
  const supabase = createServiceClient();

  // Get course with lessons
  const { data: course } = await supabase
    .from('cc_courses')
    .select(`
      *,
      cc_lessons(*)
    `)
    .eq('id', courseId)
    .single();

  if (!course) {
    return { id: courseId, status: 'not_found' };
  }

  const results = [];

  // Embed course overview
  const courseContent = [
    course.name,
    course.description,
    `Platform: ${course.platform}`,
    `Language: ${course.language}`,
    `Status: ${course.status}`,
    course.tags ? `Tags: ${course.tags.join(', ')}` : ''
  ].filter(Boolean).join('\n');

  const courseHash = createContentHash(courseContent);

  // Check if course already embedded
  const { data: existingCourse } = await supabase
    .from('semantic_memory')
    .select('content_hash')
    .eq('source_id', courseId)
    .eq('source_type', 'course')
    .single();

  if (!existingCourse || existingCourse.content_hash !== courseHash) {
    try {
      const courseEmbedding = await embedText(courseContent);

      // Delete existing entry if it exists, then insert new one
      await supabase
        .from('semantic_memory')
        .delete()
        .eq('source_id', courseId)
        .eq('source_type', 'course');

      const { error: insertError } = await supabase
        .from('semantic_memory')
        .insert({
          source_type: 'course',
          source_id: courseId,
          content: courseContent,
          content_hash: courseHash,
          embedding: `[${courseEmbedding.join(',')}]`, // Convert to pgvector format
          memory_type: 'knowledge',
          domain: 'education',
          embedded_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      results.push({ id: courseId, type: 'course', status: 'embedded' });
    } catch (error: unknown) {
      results.push({ id: courseId, type: 'course', status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    results.push({ id: courseId, type: 'course', status: 'unchanged' });
  }

  // Embed each lesson
  for (const lesson of course.cc_lessons || []) {
    const lessonContent = [
      `Lesson ${lesson.lesson_number}: ${lesson.title}`,
      lesson.description,
      lesson.transcript_text,
      lesson.summary_text,
      `Duration: ${lesson.duration_minutes} minutes`,
      `Status: ${lesson.status}`
    ].filter(Boolean).join('\n');

    if (!lessonContent.trim()) continue;

    const lessonHash = createContentHash(lessonContent);

    // Check if lesson already embedded
    const { data: existingLesson } = await supabase
      .from('semantic_memory')
      .select('content_hash')
      .eq('source_id', lesson.id)
      .eq('source_type', 'lesson')
      .single();

    if (!existingLesson || existingLesson.content_hash !== lessonHash) {
      try {
        const lessonEmbedding = await embedText(lessonContent);

        // Delete existing entry if it exists, then insert new one
        await supabase
          .from('semantic_memory')
          .delete()
          .eq('source_id', lesson.id)
          .eq('source_type', 'lesson');

        const { error: lessonInsertError } = await supabase
          .from('semantic_memory')
          .insert({
            source_type: 'lesson',
            source_id: lesson.id,
            content: lessonContent,
            content_hash: lessonHash,
            embedding: `[${lessonEmbedding.join(',')}]`, // Convert to pgvector format
            memory_type: 'knowledge',
            domain: 'education',
            embedded_at: new Date().toISOString()
          });

        if (lessonInsertError) throw lessonInsertError;

        results.push({ id: lesson.id, type: 'lesson', status: 'embedded' });
      } catch (error: unknown) {
        results.push({ id: lesson.id, type: 'lesson', status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } else {
      results.push({ id: lesson.id, type: 'lesson', status: 'unchanged' });
    }
  }

  return { courseId, results };
}

export async function POST(_request: NextRequest) {
  try {
    const { course_id, batch_all } = await request.json();

    if (course_id) {
      // Single course
      const result = await embedCourseContent(course_id);
      return NextResponse.json(result);
    }

    if (batch_all) {
      // All courses
      const supabase = createServiceClient();
      const { data: courses } = await supabase
        .from('cc_courses')
        .select('id');

      if (!courses || courses.length === 0) {
        return NextResponse.json({ status: 'no_courses' });
      }

      const allResults = [];
      for (const course of courses) {
        const result = await embedCourseContent(course.id);
        allResults.push(result);
      }

      const totalEmbedded = allResults
        .flatMap(r => r.results || [])
        .filter(r => r.status === 'embedded').length;

      const totalUnchanged = allResults
        .flatMap(r => r.results || [])
        .filter(r => r.status === 'unchanged').length;

      const totalErrors = allResults
        .flatMap(r => r.results || [])
        .filter(r => r.status === 'error').length;

      return NextResponse.json({
        total_courses: courses.length,
        total_embedded: totalEmbedded,
        total_unchanged: totalUnchanged,
        total_errors: totalErrors,
        results: allResults
      });
    }

    return NextResponse.json(
      { error: 'Provide course_id or batch_all: true' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Semantic embedding error:', error);
    return NextResponse.json(
      { error: 'Failed to embed courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}