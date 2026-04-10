-- ToamViet payment layer upgrade - 2026-04-10
-- Bổ sung order lifecycle + transaction log + auto entitlement cho thanh toán VIP.

create extension if not exists pgcrypto;

alter table public.listing_orders
  add column if not exists gateway text default 'vnpay',
  add column if not exists package_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists provider_transaction_no text,
  add column if not exists paid_at timestamptz,
  add column if not exists result_code text,
  add column if not exists entitlement_expires_at timestamptz,
  add column if not exists callback_payload jsonb not null default '{}'::jsonb;

create unique index if not exists idx_listing_orders_payment_reference_unique
  on public.listing_orders(payment_reference)
  where payment_reference is not null;

create index if not exists idx_listing_orders_provider_transaction_no
  on public.listing_orders(provider_transaction_no)
  where provider_transaction_no is not null;

alter table public.user_entitlements
  add column if not exists source_order_id uuid references public.listing_orders(id) on delete set null;

create unique index if not exists idx_user_entitlements_source_order_id_unique
  on public.user_entitlements(source_order_id)
  where source_order_id is not null;

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.listing_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gateway text not null default 'vnpay',
  transaction_type text not null,
  status text not null default 'pending',
  amount numeric(14,2) not null default 0,
  currency text not null default 'VND',
  provider_order_code text,
  provider_transaction_no text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_transactions_order_id on public.payment_transactions(order_id);
create index if not exists idx_payment_transactions_user_id on public.payment_transactions(user_id);
create index if not exists idx_payment_transactions_status on public.payment_transactions(status);
create unique index if not exists idx_payment_transactions_gateway_provider_txn_unique
  on public.payment_transactions(gateway, provider_transaction_no)
  where provider_transaction_no is not null;

alter table public.payment_transactions enable row level security;

create policy if not exists "payment transactions owner read"
on public.payment_transactions for select
to authenticated
using (auth.uid() = user_id or public.is_admin_user());

create policy if not exists "payment transactions owner insert"
on public.payment_transactions for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin_user());

create policy if not exists "payment transactions admin update"
on public.payment_transactions for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

insert into public.system_settings (setting_key, payload)
values (
  'global',
  jsonb_build_object(
    'paymentProvider', 'vnpay',
    'paymentProviderLabel', 'VNPay',
    'paymentCurrency', 'VND',
    'paymentOrderPrefix', 'TV',
    'paymentResultPath', '/pages/thanh-toan-ket-qua.html',
    'paymentAutoGrantEntitlement', true,
    'paymentAutoUpgradeListingVip', true,
    'paymentPackages', jsonb_build_array(
      jsonb_build_object('code','vip-dong-7d','name','VIP Đồng 7 ngày','vipLevel','dong','durationDays',7,'amount',49000,'enabled',true),
      jsonb_build_object('code','vip-dong-30d','name','VIP Đồng 30 ngày','vipLevel','dong','durationDays',30,'amount',149000,'enabled',true),
      jsonb_build_object('code','vip-bac-7d','name','VIP Bạc 7 ngày','vipLevel','bac','durationDays',7,'amount',99000,'enabled',true),
      jsonb_build_object('code','vip-bac-30d','name','VIP Bạc 30 ngày','vipLevel','bac','durationDays',30,'amount',299000,'enabled',true),
      jsonb_build_object('code','vip-vang-7d','name','VIP Vàng 7 ngày','vipLevel','vang','durationDays',7,'amount',149000,'enabled',true),
      jsonb_build_object('code','vip-vang-30d','name','VIP Vàng 30 ngày','vipLevel','vang','durationDays',30,'amount',449000,'enabled',true),
      jsonb_build_object('code','vip-kim-cuong-7d','name','VIP Kim cương 7 ngày','vipLevel','kim-cuong','durationDays',7,'amount',249000,'enabled',true),
      jsonb_build_object('code','vip-kim-cuong-30d','name','VIP Kim cương 30 ngày','vipLevel','kim-cuong','durationDays',30,'amount',749000,'enabled',true)
    )
  )
)
on conflict (setting_key) do update
set payload = public.system_settings.payload || excluded.payload,
    updated_at = now();
