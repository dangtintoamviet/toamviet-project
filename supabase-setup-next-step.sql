-- BƯỚC SAU: chạy file này trong Supabase SQL Editor khi cần tạo bảng hồ sơ user.
-- Hiện tại đăng ký/đăng nhập đã dùng Supabase Auth.
-- Nếu dự án đã chạy sẵn và cần quyền admin thật, chạy thêm file `supabase-admin-migration.sql`.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  account_group text default 'real_estate',
  profile_role text,
  role_label text,
  profile_type text default 'canhan',
  brand_name text,
  service_area text,
  specialty text,
  avatar text,
  system_role text default 'user',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy if not exists "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy if not exists "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy if not exists "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);
