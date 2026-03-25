-- Courses System — Course Management with Google Drive Integration
-- Supports course creation, lesson management, transcription, and AI summaries

-- ─── Courses table ────────────────────────────────────────────────
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text default '📚',
  platform text not null check (platform in ('udemy', 'youtube', 'coursera', 'vimeo', 'local')),
  language text not null default 'he',
  status text not null default 'planned' check (status in ('planned', 'active', 'paused', 'completed')),
  description text,

  -- Google Drive integration
  drive_folder_id text,
  drive_folder_url text,
  google_account_id uuid references public.google_accounts(id) on delete set null,

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

-- ─── Lessons table ─────────────────────────────────────────────────
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  lesson_number integer not null,
  duration_minutes integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'downloaded', 'transcribed', 'summarized', 'reviewed')),

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
  flashcards jsonb, -- Array of {question, answer, difficulty}

  -- Timestamps
  downloaded_at timestamptz,
  transcribed_at timestamptz,
  summarized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (course_id, lesson_number)
);

-- ─── Course progress tracking ──────────────────────────────────────
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  watched_duration_minutes integer not null default 0,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (lesson_id, user_id)
);

-- ─── Indexes ───────────────────────────────────────────────────────
create index if not exists idx_courses_user_status on public.courses(user_id, status);
create index if not exists idx_lessons_course on public.lessons(course_id);
create index if not exists idx_lessons_status on public.lessons(status);
create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);

-- ─── Auto-update timestamps ────────────────────────────────────────
create or replace function public.courses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.lessons_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.lesson_progress_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.courses_updated_at();

create trigger trg_lessons_updated_at
  before update on public.lessons
  for each row execute function public.lessons_updated_at();

create trigger trg_lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.lesson_progress_updated_at();

-- ─── Row Level Security ────────────────────────────────────────────

-- Courses: user-scoped
alter table public.courses enable row level security;

create policy "courses_select_own"
  on public.courses for select
  using (auth.uid() = user_id);

create policy "courses_insert_own"
  on public.courses for insert
  with check (auth.uid() = user_id);

create policy "courses_update_own"
  on public.courses for update
  using (auth.uid() = user_id);

create policy "courses_delete_own"
  on public.courses for delete
  using (auth.uid() = user_id);

-- Lessons: via course ownership
alter table public.lessons enable row level security;

create policy "lessons_select_own"
  on public.lessons for select
  using (exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
    and courses.user_id = auth.uid()
  ));

create policy "lessons_insert_own"
  on public.lessons for insert
  with check (exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
    and courses.user_id = auth.uid()
  ));

create policy "lessons_update_own"
  on public.lessons for update
  using (exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
    and courses.user_id = auth.uid()
  ));

create policy "lessons_delete_own"
  on public.lessons for delete
  using (exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
    and courses.user_id = auth.uid()
  ));

-- Lesson progress: user-scoped
alter table public.lesson_progress enable row level security;

create policy "lesson_progress_select_own"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "lesson_progress_insert_own"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "lesson_progress_update_own"
  on public.lesson_progress for update
  using (auth.uid() = user_id);

create policy "lesson_progress_delete_own"
  on public.lesson_progress for delete
  using (auth.uid() = user_id);

-- ─── Helper functions ───────────────────────────────────────────────

-- Update course totals when lessons change
create or replace function public.update_course_totals()
returns trigger as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    update public.courses
    set
      total_lessons = (
        select count(*) from public.lessons
        where course_id = new.course_id
      ),
      completed_lessons = (
        select count(*) from public.lessons
        where course_id = new.course_id
        and status in ('summarized', 'reviewed')
      ),
      total_duration_minutes = (
        select coalesce(sum(duration_minutes), 0) from public.lessons
        where course_id = new.course_id
      )
    where id = new.course_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.courses
    set
      total_lessons = (
        select count(*) from public.lessons
        where course_id = old.course_id
      ),
      completed_lessons = (
        select count(*) from public.lessons
        where course_id = old.course_id
        and status in ('summarized', 'reviewed')
      ),
      total_duration_minutes = (
        select coalesce(sum(duration_minutes), 0) from public.lessons
        where course_id = old.course_id
      )
    where id = old.course_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_update_course_totals
  after insert or update or delete on public.lessons
  for each row execute function public.update_course_totals();