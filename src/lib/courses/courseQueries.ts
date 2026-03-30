import { _createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  platform: 'udemy' | 'youtube' | 'coursera' | 'vimeo' | 'local';
  language: string;
  status: 'planned' | 'active' | 'paused' | 'completed';
  description: string | null;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
  google_account_id: string | null;
  source_url: string | null;
  total_lessons: number;
  completed_lessons: number;
  total_duration_minutes: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  lesson_number: number;
  duration_minutes: number;
  status: 'pending' | 'downloaded' | 'transcribed' | 'summarized' | 'reviewed';
  drive_file_id: string | null;
  drive_file_url: string | null;
  file_format: string | null;
  file_size_mb: number | null;
  source_url: string | null;
  transcript_text: string | null;
  summary_text: string | null;
  flashcards: Array<{question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard'}> | null;
  downloaded_at: string | null;
  transcribed_at: string | null;
  summarized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  user_id: string;
  watched_duration_minutes: number;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseParams {
  name: string;
  emoji?: string;
  platform: Course['platform'];
  language?: string;
  status?: Course['status'];
  description?: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  google_account_id?: string;
  source_url?: string;
  tags?: string[];
}

export interface CreateLessonParams {
  course_id: string;
  title: string;
  lesson_number: number;
  duration_minutes?: number;
  drive_file_id?: string;
  drive_file_url?: string;
  file_format?: string;
  file_size_mb?: number;
  source_url?: string;
}

// ─── Course Queries ──────────────────────────────────────────────────

export async function listCourses(userId: string): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Course[];
}

export async function getCourseById(courseId: string, userId: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    throw error;
  }
  return data as Course;
}

export async function createCourse(userId: string, params: CreateCourseParams): Promise<Course> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      name: params.name,
      emoji: params.emoji || '📚',
      platform: params.platform,
      language: params.language || 'he',
      status: params.status || 'planned',
      description: params.description,
      drive_folder_id: params.drive_folder_id,
      drive_folder_url: params.drive_folder_url,
      google_account_id: params.google_account_id,
      source_url: params.source_url,
      tags: params.tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

export async function updateCourse(courseId: string, userId: string, updates: Partial<CreateCourseParams>): Promise<Course> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", courseId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(courseId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ─── Lesson Queries ───────────────────────────────────────────────────

export async function listLessons(courseId: string): Promise<Lesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("lesson_number", { ascending: true });

  if (error) throw error;
  return data as Lesson[];
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Lesson;
}

export async function createLesson(params: CreateLessonParams): Promise<Lesson> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      course_id: params.course_id,
      title: params.title,
      lesson_number: params.lesson_number,
      duration_minutes: params.duration_minutes || 0,
      drive_file_id: params.drive_file_id,
      drive_file_url: params.drive_file_url,
      file_format: params.file_format,
      file_size_mb: params.file_size_mb,
      source_url: params.source_url,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Lesson;
}

export async function updateLesson(lessonId: string, updates: Partial<Omit<Lesson, 'id' | 'course_id' | 'created_at' | 'updated_at'>>): Promise<Lesson> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", lessonId)
    .select()
    .single();

  if (error) throw error;
  return data as Lesson;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId);

  if (error) throw error;
}

// ─── Progress Queries ─────────────────────────────────────────────────

export async function getLessonProgress(lessonId: string, userId: string): Promise<LessonProgress | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as LessonProgress;
}

export async function updateLessonProgress(
  lessonId: string,
  userId: string,
  updates: {
    watched_duration_minutes?: number;
    completed_at?: string | null;
    notes?: string;
  }
): Promise<LessonProgress> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert({
      lesson_id: lessonId,
      user_id: userId,
      ...updates,
    })
    .select()
    .single();

  if (error) throw error;
  return data as LessonProgress;
}