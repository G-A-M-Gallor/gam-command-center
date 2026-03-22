-- ===================================================
-- Feature Flags — per-app feature toggles
-- ===================================================

create table if not exists public.feature_flags (
  id          uuid primary key default gen_random_uuid(),
  app_name    text not null,
  feature_name text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (app_name, feature_name)
);

-- RLS
alter table public.feature_flags enable row level security;

create policy "Authenticated users can read feature flags"
  on public.feature_flags for select
  to authenticated
  using (true);

create policy "Authenticated users can manage feature flags"
  on public.feature_flags for all
  to authenticated
  using (true)
  with check (true);

-- Auto-update updated_at
create or replace trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

-- Seed defaults for vCanvas
insert into public.feature_flags (app_name, feature_name, enabled) values
  ('vCanvas', 'draw', true),
  ('vCanvas', 'shapes', true),
  ('vCanvas', 'text', true),
  ('vCanvas', 'note', true),
  ('vCanvas', 'media', true),
  ('vCanvas', 'frame', true),
  ('vCanvas', 'hand', true),
  ('vCanvas', 'eraser', true),
  ('vCanvas', 'laser', true),
  ('vCanvas', 'export', true),
  ('vCanvas', 'pages', true),
  ('vCanvas', 'debug', false),
  ('vNote', 'draw', true),
  ('vNote', 'shapes', true),
  ('vNote', 'text', true),
  ('vNote', 'note', false),
  ('vNote', 'media', false),
  ('vNote', 'frame', false),
  ('vNote', 'hand', true),
  ('vNote', 'eraser', true),
  ('vNote', 'laser', false),
  ('vNote', 'export', false),
  ('vNote', 'pages', false),
  ('vNote', 'debug', false)
on conflict (app_name, feature_name) do nothing;
