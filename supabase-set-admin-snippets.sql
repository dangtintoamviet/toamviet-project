-- 1) Xem danh sách profiles hiện có
select id, email, full_name, system_role, status, created_at, updated_at
from public.profiles
order by created_at desc;

-- 2) Gán admin theo email
update public.profiles
set system_role = 'admin',
    status = 'approved',
    updated_at = now()
where lower(email) = lower('email-admin-cua-ban@example.com');

-- 3) Gán admin theo UUID
update public.profiles
set system_role = 'admin',
    status = 'approved',
    updated_at = now()
where id = 'UUID-THAT-CUA-TAI-KHOAN-ADMIN';

-- 4) Kiểm tra lại các tài khoản admin
select id, email, full_name, system_role, status, updated_at
from public.profiles
where lower(coalesce(system_role, 'user')) = 'admin'
order by updated_at desc nulls last;

-- 5) Kiểm tra cấu hình hệ thống đã seed chưa
select setting_key, payload, updated_by, updated_at
from public.system_settings;
