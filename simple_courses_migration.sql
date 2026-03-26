-- Simple Courses Migration - Without dependencies
-- Can be run directly on Supabase

-- Create courses table (simplified)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  emoji text default '📚',
  platform text not null,
  language text not null default 'he',
  status text not null default 'planned',
  description text,

  -- Google Drive fields (optional)
  drive_folder_id text,
  drive_folder_url text,
  google_account_id uuid,

  -- Course metadata
  source_url text,
  total_lessons integer not null default 0,
  completed_lessons integer not null default 0,
  total_duration_minutes integer not null default 0,
  tags text[] not null default '{}',

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  lesson_number integer not null,
  duration_minutes integer not null default 0,
  status text not null default 'pending',

  -- Google Drive file
  drive_file_id text,
  drive_file_url text,
  file_format text,
  file_size_mb numeric,

  -- Source
  source_url text,

  -- AI processing
  transcript_text text,
  summary_text text,
  flashcards jsonb,

  -- Timestamps
  downloaded_at timestamptz,
  transcribed_at timestamptz,
  summarized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (course_id, lesson_number)
);

-- Enable RLS
alter table public.courses enable row level security;
alter table public.lessons enable row level security;

-- Create policies
create policy "courses_all_access" on public.courses using (true) with check (true);
create policy "lessons_all_access" on public.lessons using (true) with check (true);

-- Create indexes
create index if not exists idx_courses_user_status on public.courses(user_id, status);
create index if not exists idx_lessons_course on public.lessons(course_id);