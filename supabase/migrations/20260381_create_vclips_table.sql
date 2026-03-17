-- vClip — screen recording clips metadata
create table if not exists public.vclips (
  id uuid primary key default gen_random_uuid(),
  title text,
  duration_seconds integer not null default 0,
  size_mb numeric(10,2) not null default 0,
  storage_url text, -- R2 public URL
  storage_key text, -- R2 object key
  content_type text default 'video/mp4',
  status text not null default 'pending' check (status in ('pending','ready','failed','archived')),
  -- Tracking
  view_count integer not null default 0,
  unique_viewers integer not null default 0,
  -- Security
  is_private boolean not null default false,
  password_hash text,
  expires_at timestamptz,
  watermark_text text,
  -- AI (future)
  transcript text,
  summary text,
  chapters jsonb default '[]'::jsonb,
  -- Relations
  tags text[] default '{}',
  owner_id uuid references auth.users(id),
  tenant_id text,
  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- View tracking
create table if not exists public.vclip_views (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.vclips(id) on delete cascade,
  viewer_token text not null, -- unique per viewer (anonymous or user)
  viewer_ip text,
  viewer_ua text,
  device_type text, -- desktop, mobile, tablet
  watch_duration_seconds integer default 0,
  watch_percentage numeric(5,2) default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_vclips_owner on public.vclips(owner_id);
create index if not exists idx_vclips_status on public.vclips(status);
create index if not exists idx_vclips_created on public.vclips(created_at desc);
create index if not exists idx_vclip_views_clip on public.vclip_views(clip_id);

-- RLS
alter table public.vclips enable row level security;
alter table public.vclip_views enable row level security;

-- Owner can do anything with their clips
create policy "vclips_owner_all" on public.vclips
  for all using (auth.uid() = owner_id);

-- Anyone can view non-private, non-expired clips (for player page)
create policy "vclips_public_read" on public.vclips
  for select using (
    is_private = false
    and (expires_at is null or expires_at > now())
    and status = 'ready'
  );

-- Anyone can insert views (anonymous tracking)
create policy "vclip_views_insert" on public.vclip_views
  for insert with check (true);

-- Owner can read views on their clips
create policy "vclip_views_owner_read" on public.vclip_views
  for select using (
    exists (
      select 1 from public.vclips
      where vclips.id = vclip_views.clip_id
      and vclips.owner_id = auth.uid()
    )
  );

-- updated_at trigger
create or replace function update_vclips_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_vclips_updated_at
  before update on public.vclips
  for each row execute function update_vclips_updated_at();
