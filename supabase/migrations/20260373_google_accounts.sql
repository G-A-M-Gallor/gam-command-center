-- Google Account Linking — OAuth token storage with RLS
-- Users can connect multiple Google accounts for Gmail + Calendar access.
-- Tokens are stored AES-256-GCM encrypted (app-level); DB sees opaque JSON.

create table if not exists public.google_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_email text not null,
  google_user_id text not null,
  display_name text,
  avatar_url text,
  access_token_enc jsonb not null,   -- {iv, ciphertext, tag} encrypted blob
  refresh_token_enc jsonb not null,  -- {iv, ciphertext, tag} encrypted blob
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_user_google unique (user_id, google_user_id)
);

-- Index for fast user lookups
create index if not exists idx_google_accounts_user on public.google_accounts(user_id);

-- Auto-update updated_at
create or replace function public.google_accounts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_google_accounts_updated_at
  before update on public.google_accounts
  for each row execute function public.google_accounts_updated_at();

-- RLS: user-scoped access only
alter table public.google_accounts enable row level security;

create policy "google_accounts_select_own"
  on public.google_accounts for select
  using (auth.uid() = user_id);

create policy "google_accounts_insert_own"
  on public.google_accounts for insert
  with check (auth.uid() = user_id);

create policy "google_accounts_update_own"
  on public.google_accounts for update
  using (auth.uid() = user_id);

create policy "google_accounts_delete_own"
  on public.google_accounts for delete
  using (auth.uid() = user_id);
