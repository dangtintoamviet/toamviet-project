
-- ToamViet platform upgrade patch - 2026-04-10
-- Mục tiêu:
-- 1) Chuẩn bị nền cho bật/tắt thu phí bằng system_settings
-- 2) Thêm bảng entitlement / order / audit / moderation / history
-- 3) Siết storage owner-path
-- 4) Hỗ trợ chống spam, truy vết và mở rộng SEO/sitemap động

create extension if not exists pgcrypto;

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_code text,
  vip_level text default 'thuong',
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  source text default 'manual',
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_entitlements_user_id on public.user_entitlements(user_id);
create index if not exists idx_user_entitlements_status on public.user_entitlements(status);
create index if not exists idx_user_entitlements_expires_at on public.user_entitlements(expires_at);

create table if not exists public.listing_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id text references public.listings(id) on delete set null,
  package_code text not null,
  package_name text,
  requested_vip_level text default 'thuong',
  amount numeric(14,2) not null default 0,
  currency text not null default 'VND',
  status text not null default 'pending',
  payment_method text,
  payment_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_orders_user_id on public.listing_orders(user_id);
create index if not exists idx_listing_orders_listing_id on public.listing_orders(listing_id);
create index if not exists idx_listing_orders_status on public.listing_orders(status);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  member_id uuid references public.profiles(id) on delete set null,
  listing_id text references public.listings(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_logs_action on public.moderation_logs(action);
create index if not exists idx_moderation_logs_created_at on public.moderation_logs(created_at desc);

create table if not exists public.listing_status_history (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  from_status text,
  to_status text,
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_status_history_listing_id on public.listing_status_history(listing_id);
create index if not exists idx_listing_status_history_created_at on public.listing_status_history(created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.user_entitlements enable row level security;
alter table public.listing_orders enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.listing_status_history enable row level security;
alter table public.audit_logs enable row level security;

create policy if not exists "user entitlements owner read"
on public.user_entitlements for select
to authenticated
using (auth.uid() = user_id or public.is_admin_user());

create policy if not exists "user entitlements admin write"
on public.user_entitlements for insert
to authenticated
with check (public.is_admin_user());

create policy if not exists "user entitlements admin update"
on public.user_entitlements for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy if not exists "listing orders owner read"
on public.listing_orders for select
to authenticated
using (auth.uid() = user_id or public.is_admin_user());

create policy if not exists "listing orders owner insert"
on public.listing_orders for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin_user());

create policy if not exists "listing orders admin update"
on public.listing_orders for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy if not exists "moderation logs admin read"
on public.moderation_logs for select
to authenticated
using (public.is_admin_user());

create policy if not exists "moderation logs admin insert"
on public.moderation_logs for insert
to authenticated
with check (public.is_admin_user());

create policy if not exists "listing history admin read"
on public.listing_status_history for select
to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1 from public.listings l
    where l.id = listing_id
      and l.user_id = auth.uid()
  )
);

create policy if not exists "listing history authenticated insert"
on public.listing_status_history for insert
to authenticated
with check (true);

create policy if not exists "audit logs admin read"
on public.audit_logs for select
to authenticated
using (public.is_admin_user());

create policy if not exists "audit logs authenticated insert"
on public.audit_logs for insert
to authenticated
with check (true);

-- Siết storage owner-path cho upload/update/delete
create policy if not exists "listing images owner path upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
);

create policy if not exists "listing images owner path update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
)
with check (
  bucket_id = 'listing-images'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
);

create policy if not exists "profile avatars owner path upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
);

create policy if not exists "profile avatars owner path update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
)
with check (
  bucket_id = 'profile-avatars'
  and (
    (storage.foldername(name))[1] = ('user-' || auth.uid()::text)
    or public.is_admin_user()
  )
);

-- Bổ sung payload mặc định cho system_settings/global
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
    'adminVersion', 'admin-ui-v2.2',
    'systemNote', '',
    'monetizationEnabled', false,
    'monetizationMode', 'manual',
    'allowFreeVipWhenMonetizationOff', true,
    'packageEnforcementEnabled', true,
    'antiSpamCooldownSeconds', 90,
    'freePostingLimitPerDay', 10,
    'freePostingLimitPerWeek', 30,
    'duplicateWindowHours', 72,
    'minTitleLength', 16,
    'minDescriptionLength', 80,
    'blockedKeywords', '',
    'siteBaseUrl', 'https://toamviet.com.vn',
    'seoIndexThinFilterPages', false,
    'seoSitemapEnabled', true,
    'projectCreationMode', 'auto_merge',
    'maxProjectSuggestions', 8
  )
)
on conflict (setting_key) do update
set payload = public.system_settings.payload || excluded.payload,
    updated_at = now();
