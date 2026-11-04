-- ============================================================
-- WISDOM TO LIFE MINISTRY — Initial database schema
-- Supabase / PostgreSQL
--
-- All ministry tables are namespaced with a `wtlm_` prefix so the
-- schema can safely co-exist with other applications in the same
-- Supabase project. If you later move to a dedicated project, you
-- can keep the prefixes as-is.
--
-- Run this file in the Supabase SQL editor, or apply it via the
-- Supabase CLI / Management API.
-- ============================================================

-- ------------------------------------------------------------
-- Admin registry + helper
-- ------------------------------------------------------------
create table if not exists public.wtlm_admins (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.wtlm_admins enable row level security;

drop policy if exists "wtlm_admins_select_admin" on public.wtlm_admins;
create policy "wtlm_admins_select_admin" on public.wtlm_admins
  for select using (auth.uid() = id);

create or replace function public.wtlm_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.wtlm_admins a where a.id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- Site settings (key/value store for editable content)
-- ------------------------------------------------------------
create table if not exists public.wtlm_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.wtlm_settings enable row level security;

drop policy if exists "wtlm_settings_read_public" on public.wtlm_settings;
create policy "wtlm_settings_read_public" on public.wtlm_settings
  for select using (true);

drop policy if exists "wtlm_settings_write_admin" on public.wtlm_settings;
create policy "wtlm_settings_write_admin" on public.wtlm_settings
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Service times
-- ------------------------------------------------------------
create table if not exists public.wtlm_service_times (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  day_of_week text not null,
  start_time text not null,
  end_time text,
  description text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wtlm_service_times enable row level security;

drop policy if exists "wtlm_service_times_read_public" on public.wtlm_service_times;
create policy "wtlm_service_times_read_public" on public.wtlm_service_times
  for select using (published = true or public.wtlm_is_admin());

drop policy if exists "wtlm_service_times_write_admin" on public.wtlm_service_times;
create policy "wtlm_service_times_write_admin" on public.wtlm_service_times
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Ministries / departments
-- ------------------------------------------------------------
create table if not exists public.wtlm_ministries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  long_description text,
  icon text,
  image_url text,
  meeting_day text,
  meeting_time text,
  contact_email text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wtlm_ministries enable row level security;

drop policy if exists "wtlm_ministries_read_public" on public.wtlm_ministries;
create policy "wtlm_ministries_read_public" on public.wtlm_ministries
  for select using (published = true or public.wtlm_is_admin());

drop policy if exists "wtlm_ministries_write_admin" on public.wtlm_ministries;
create policy "wtlm_ministries_write_admin" on public.wtlm_ministries
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Leaders / pastoral team
-- ------------------------------------------------------------
create table if not exists public.wtlm_leaders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text,
  photo_url text,
  is_pastor boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wtlm_leaders enable row level security;

drop policy if exists "wtlm_leaders_read_public" on public.wtlm_leaders;
create policy "wtlm_leaders_read_public" on public.wtlm_leaders
  for select using (published = true or public.wtlm_is_admin());

drop policy if exists "wtlm_leaders_write_admin" on public.wtlm_leaders;
create policy "wtlm_leaders_write_admin" on public.wtlm_leaders
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Events & programmes
-- ------------------------------------------------------------
create table if not exists public.wtlm_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text not null default 'programme',
    -- categories: service | conference | prayer | revival | programme | outreach
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  image_url text,
  registration_required boolean not null default false,
  registration_open boolean not null default false,
  published boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.wtlm_events enable row level security;

drop policy if exists "wtlm_events_read_public" on public.wtlm_events;
create policy "wtlm_events_read_public" on public.wtlm_events
  for select using (published = true or public.wtlm_is_admin());

drop policy if exists "wtlm_events_write_admin" on public.wtlm_events;
create policy "wtlm_events_write_admin" on public.wtlm_events
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

create index if not exists wtlm_events_start_at_idx on public.wtlm_events (start_at);

create table if not exists public.wtlm_event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.wtlm_events (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.wtlm_event_registrations enable row level security;

drop policy if exists "wtlm_event_registrations_insert_public" on public.wtlm_event_registrations;
create policy "wtlm_event_registrations_insert_public" on public.wtlm_event_registrations
  for insert with check (true);

drop policy if exists "wtlm_event_registrations_admin" on public.wtlm_event_registrations;
create policy "wtlm_event_registrations_admin" on public.wtlm_event_registrations
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Sermons & messages
-- ------------------------------------------------------------
create table if not exists public.wtlm_sermons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  preacher text not null,
  series text,
  scripture text,
  description text,
  youtube_url text,
  audio_url text,
  sermon_date date not null default current_date,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wtlm_sermons enable row level security;

drop policy if exists "wtlm_sermons_read_public" on public.wtlm_sermons;
create policy "wtlm_sermons_read_public" on public.wtlm_sermons
  for select using (published = true or public.wtlm_is_admin());

drop policy if exists "wtlm_sermons_write_admin" on public.wtlm_sermons;
create policy "wtlm_sermons_write_admin" on public.wtlm_sermons
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

create index if not exists wtlm_sermons_date_idx on public.wtlm_sermons (sermon_date desc);

-- ------------------------------------------------------------
-- Testimonies
-- ------------------------------------------------------------
create table if not exists public.wtlm_testimonies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  content text not null,
  image_url text,
  approved boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.wtlm_testimonies enable row level security;

drop policy if exists "wtlm_testimonies_read_public" on public.wtlm_testimonies;
create policy "wtlm_testimonies_read_public" on public.wtlm_testimonies
  for select using (approved = true or public.wtlm_is_admin());

drop policy if exists "wtlm_testimonies_write_admin" on public.wtlm_testimonies;
create policy "wtlm_testimonies_write_admin" on public.wtlm_testimonies
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Gallery (photos & videos)
-- ------------------------------------------------------------
create table if not exists public.wtlm_gallery_media (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text not null default 'church-life',
    -- church-life | worship | conferences | outreach | youth | children
  media_type text not null default 'photo', -- photo | video
  storage_path text,      -- path inside the 'wtlm-gallery' storage bucket
  public_url text,        -- resolved public URL
  youtube_url text,       -- for video media
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wtlm_gallery_media enable row level security;

drop policy if exists "wtlm_gallery_read_public" on public.wtlm_gallery_media;
create policy "wtlm_gallery_read_public" on public.wtlm_gallery_media
  for select using (published = true or public.wtlm_is_admin());

drop policy if exists "wtlm_gallery_write_admin" on public.wtlm_gallery_media;
create policy "wtlm_gallery_write_admin" on public.wtlm_gallery_media
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Announcements
-- ------------------------------------------------------------
create table if not exists public.wtlm_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  link_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wtlm_announcements enable row level security;

drop policy if exists "wtlm_announcements_read_public" on public.wtlm_announcements;
create policy "wtlm_announcements_read_public" on public.wtlm_announcements
  for select using (
    (published = true and starts_at <= now() and (ends_at is null or ends_at >= now()))
    or public.wtlm_is_admin()
  );

drop policy if exists "wtlm_announcements_write_admin" on public.wtlm_announcements;
create policy "wtlm_announcements_write_admin" on public.wtlm_announcements
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Contact form messages (insert public, read admin only)
-- ------------------------------------------------------------
create table if not exists public.wtlm_contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.wtlm_contact_messages enable row level security;

drop policy if exists "wtlm_contact_insert_public" on public.wtlm_contact_messages;
create policy "wtlm_contact_insert_public" on public.wtlm_contact_messages
  for insert with check (true);

drop policy if exists "wtlm_contact_admin" on public.wtlm_contact_messages;
create policy "wtlm_contact_admin" on public.wtlm_contact_messages
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Prayer requests (insert public, read admin only — private)
-- ------------------------------------------------------------
create table if not exists public.wtlm_prayer_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  request text not null,
  status text not null default 'new', -- new | praying | answered | archived
  created_at timestamptz not null default now()
);

alter table public.wtlm_prayer_requests enable row level security;

drop policy if exists "wtlm_prayer_insert_public" on public.wtlm_prayer_requests;
create policy "wtlm_prayer_insert_public" on public.wtlm_prayer_requests
  for insert with check (true);

drop policy if exists "wtlm_prayer_admin" on public.wtlm_prayer_requests;
create policy "wtlm_prayer_admin" on public.wtlm_prayer_requests
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Donations (Flutterwave)
-- ------------------------------------------------------------
create table if not exists public.wtlm_donations (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'offering',
    -- tithe | offering | building | special | general
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'NGN',
  donor_name text,
  donor_email text,
  donor_phone text,
  flw_tx_ref text not null unique,
  flutterwave_tx_id bigint,
  status text not null default 'pending', -- pending | completed | failed
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wtlm_donations enable row level security;

drop policy if exists "wtlm_donations_insert_public" on public.wtlm_donations;
create policy "wtlm_donations_insert_public" on public.wtlm_donations
  for insert with check (true);

-- No public select/update: verification happens server-side with the
-- service_role key (which bypasses RLS).

drop policy if exists "wtlm_donations_admin" on public.wtlm_donations;
create policy "wtlm_donations_admin" on public.wtlm_donations
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

create or replace function public.wtlm_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists wtlm_donations_touch on public.wtlm_donations;
create trigger wtlm_donations_touch
  before update on public.wtlm_donations
  for each row execute function public.wtlm_touch_updated_at();

-- ------------------------------------------------------------
-- Newsletter subscribers
-- ------------------------------------------------------------
create table if not exists public.wtlm_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.wtlm_newsletter_subscribers enable row level security;

drop policy if exists "wtlm_newsletter_insert_public" on public.wtlm_newsletter_subscribers;
create policy "wtlm_newsletter_insert_public" on public.wtlm_newsletter_subscribers
  for insert with check (true);

drop policy if exists "wtlm_newsletter_admin" on public.wtlm_newsletter_subscribers;
create policy "wtlm_newsletter_admin" on public.wtlm_newsletter_subscribers
  for all using (public.wtlm_is_admin()) with check (public.wtlm_is_admin());

-- ------------------------------------------------------------
-- Storage bucket for gallery uploads
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('wtlm-gallery', 'wtlm-gallery', true)
on conflict (id) do nothing;

drop policy if exists "wtlm_gallery_storage_read_public" on storage.objects;
create policy "wtlm_gallery_storage_read_public" on storage.objects
  for select using (bucket_id = 'wtlm-gallery');

drop policy if exists "wtlm_gallery_storage_admin_write" on storage.objects;
create policy "wtlm_gallery_storage_admin_write" on storage.objects
  for insert with check (bucket_id = 'wtlm-gallery' and public.wtlm_is_admin());

drop policy if exists "wtlm_gallery_storage_admin_update" on storage.objects;
create policy "wtlm_gallery_storage_admin_update" on storage.objects
  for update using (bucket_id = 'wtlm-gallery' and public.wtlm_is_admin());

drop policy if exists "wtlm_gallery_storage_admin_delete" on storage.objects;
create policy "wtlm_gallery_storage_admin_delete" on storage.objects
  for delete using (bucket_id = 'wtlm-gallery' and public.wtlm_is_admin());
