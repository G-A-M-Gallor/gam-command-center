-- vCloud — file storage metadata
create table if not exists public.vcloud_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_type text not null default 'file' check (file_type in ('file','image','video','sound')),
  mime_type text,
  size_mb numeric(10,2) not null default 0,
  storage_url text not null,
  storage_key text,
  -- Organization
  folder text default '/',
  is_personal boolean not null default false,
  tags text[] default '{}',
  -- Relations
  vclip_id uuid references public.vclips(id) on delete set null,
  owner_id uuid references auth.users(id),
  tenant_id text,
  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_vcloud_files_type on public.vcloud_files(file_type);
create index if not exists idx_vcloud_files_owner on public.vcloud_files(owner_id);
create index if not exists idx_vcloud_files_folder on public.vcloud_files(folder);
create index if not exists idx_vcloud_files_created on public.vcloud_files(created_at desc);

-- RLS
alter table public.vcloud_files enable row level security;

create policy "vcloud_owner_all" on public.vcloud_files
  for all using (auth.uid() = owner_id);

-- Allow service role full access (API routes use service client)
create policy "vcloud_service_all" on public.vcloud_files
  for all using (true);

-- updated_at trigger
create or replace function update_vcloud_files_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_vcloud_files_updated_at
  before update on public.vcloud_files
  for each row execute function update_vcloud_files_updated_at();
