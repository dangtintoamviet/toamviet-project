-- Migration Supabase-first cho dự án ToamViet đang chạy
-- Mục tiêu:
-- 1) Chốt admin permission thật từ DB trung tâm
-- 2) Cho phép admin đọc/cập nhật listings, profiles, listing_images từ frontend Supabase client
-- 3) Giữ user thường chỉ thao tác trên dữ liệu của chính mình

create extension if not exists pgcrypto;

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

alter table if exists public.profiles enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.listings enable row level security;
alter table if exists public.listing_images enable row level security;

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

create policy if not exists "projects public read"
on public.projects for select
using (true);

create policy if not exists "projects authenticated insert"
on public.projects for insert
to authenticated
with check (true);

drop policy if exists "projects authenticated update" on public.projects;
create policy "projects admin update"
on public.projects for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy if not exists "listings public read approved"
on public.listings for select
using (status in ('approved','published','demo'));

drop policy if exists "listings owner read all" on public.listings;
create policy "listings owner or admin read"
on public.listings for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin_user()
  or status in ('approved','published','demo')
);

create policy if not exists "listings owner insert"
on public.listings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "listings owner update" on public.listings;
create policy "listings owner or admin update"
on public.listings for update
to authenticated
using (auth.uid() = user_id or public.is_admin_user())
with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "listing images public read" on public.listing_images;
create policy "listing images public owner admin read"
on public.listing_images for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (
        l.status in ('approved','published','demo')
        or l.user_id = auth.uid()
        or public.is_admin_user()
      )
  )
);

drop policy if exists "listing images owner insert" on public.listing_images;
create policy "listing images owner or admin insert"
on public.listing_images for insert
to authenticated
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
);

drop policy if exists "listing images owner update" on public.listing_images;
create policy "listing images owner or admin update"
on public.listing_images for update
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = auth.uid() or public.is_admin_user())
  )
);

-- Gợi ý: chạy lệnh sau rồi thay UUID admin thật của bạn
-- update public.profiles set system_role = 'admin' where id = 'YOUR-ADMIN-USER-ID';


alter table if exists public.system_settings enable row level security;

alter table if exists public.listings add column if not exists profile_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_listings_profile_id on public.listings(profile_id);

create table if not exists public.system_settings (
  setting_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

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

alter table if exists public.profiles alter column status set default 'approved';
