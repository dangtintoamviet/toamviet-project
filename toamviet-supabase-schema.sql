create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  account_group text default 'real_estate',
  profile_type text default 'canhan',
  role text,
  role_label text,
  brand_name text,
  bio text,
  avatar_url text,
  service_area text,
  specialty text,
  status text default 'approved',
  system_role text default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin_user(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = coalesce(target_user, auth.uid())
      and lower(coalesce(p.system_role, 'user')) = 'admin'
  );
$$;

create table if not exists public.projects (
  id text primary key,
  name text not null,
  slug text not null unique,
  city text,
  ward text,
  address_detail text,
  type text,
  type_name text,
  developer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  flow text not null,
  post_type text not null,
  profile_type text default 'canhan',
  vip_level text default 'thuong',
  title text not null,
  slug text not null unique,
  city text,
  district text,
  ward text,
  address_detail text,
  description text,
  contact_name text,
  contact_phone text,
  contact_email text,
  status text default 'pending',
  thumbnail_url text,
  category_slug text,
  category_name text,
  property_category_slug text,
  property_category_name text,
  property_type text,
  property_price text,
  property_area numeric,
  property_legal text,
  property_direction text,
  property_beds integer,
  service_type text,
  service_type_slug text,
  service_price text,
  service_exp text,
  service_area text,
  service_brand text,
  service_specialty text,
  project_id text references public.projects(id) on delete set null,
  project_name text,
  project_slug text,
  project_type text,
  project_type_name text,
  project_developer text,
  price_per_square_meter bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_profile_id on public.listings(profile_id);
create index if not exists idx_listings_flow_post_type on public.listings(flow, post_type);
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_listings_project_id on public.listings(project_id);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings(id) on delete cascade,
  sort_order integer not null default 0,
  image_url text not null,
  file_name text,
  mime_type text,
  width integer,
  height integer,
  size_kb integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_images_listing_id on public.listing_images(listing_id, sort_order);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

-- profiles
create policy if not exists "profiles public read"
on public.profiles for select
using (true);

create policy if not exists "profiles owner upsert"
on public.profiles for insert
with check (auth.uid() = id);

create policy if not exists "profiles owner update"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy if not exists "profiles admin update all"
on public.profiles for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- projects
create policy if not exists "projects public read"
on public.projects for select
using (true);

create policy if not exists "projects authenticated insert"
on public.projects for insert
to authenticated
with check (true);

create policy if not exists "projects admin update"
on public.projects for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- listings
create policy if not exists "listings public read approved"
on public.listings for select
using (status in ('approved','published','demo'));

create policy if not exists "listings owner or admin read"
on public.listings for select
to authenticated
using (auth.uid() = user_id or public.is_admin_user() or status in ('approved','published','demo'));

create policy if not exists "listings owner insert"
on public.listings for insert
to authenticated
with check (auth.uid() = user_id);

create policy if not exists "listings owner or admin update"
on public.listings for update
to authenticated
using (auth.uid() = user_id or public.is_admin_user())
with check (auth.uid() = user_id or public.is_admin_user());

-- listing images
create policy if not exists "listing images public owner admin read"
on public.listing_images for select
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (
        l.status in ('approved','published','demo')
        or l.user_id = auth.uid()
        or public.is_admin_user()
      )
  )
);

create policy if not exists "listing images owner or admin insert"
on public.listing_images for insert
to authenticated
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
);

create policy if not exists "listing images owner or admin update"
on public.listing_images for update
to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
)
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
);

create table if not exists public.system_settings (
  setting_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

create policy if not exists "system settings authenticated read"
on public.system_settings for select
to authenticated
using (true);

create policy if not exists "system settings admin write"
on public.system_settings for insert
to authenticated
with check (public.is_admin_user());

create policy if not exists "system settings admin update"
on public.system_settings for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

insert into public.system_settings (setting_key, payload)
values (
  'global',
  jsonb_build_object(
    'demoFallbackEnabled', true,
    'autoSyncDerivedStores', true,
    'autoSyncProjectCounts', true,
    'instantPublicAfterApproval', true,
    'defaultPostStatus', 'pending',
    'defaultUserStatus', 'approved',
    'maxImagesPerPost', 5,
    'adminVersion', 'admin-ui-v2.1',
    'systemNote', ''
  )
)
on conflict (setting_key) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

create policy if not exists "listing images bucket public read"
on storage.objects for select
using (bucket_id = 'listing-images');

create policy if not exists "listing images bucket auth upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-images');

create policy if not exists "listing images bucket auth update"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-images')
with check (bucket_id = 'listing-images');

create policy if not exists "profile avatars bucket public read"
on storage.objects for select
using (bucket_id = 'profile-avatars');

create policy if not exists "profile avatars bucket auth upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-avatars');

create policy if not exists "profile avatars bucket auth update"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-avatars')
with check (bucket_id = 'profile-avatars');
