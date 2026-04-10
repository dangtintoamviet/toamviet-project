# Hướng dẫn cấu hình admin Supabase cho ToamViet

## 1) Chạy migration để tạo quyền admin và bảng cài đặt hệ thống

- Mở **Supabase Dashboard**
- Chọn đúng project của website
- Vào **SQL Editor**
- Mở file `supabase-admin-migration.sql` trong bộ code này
- Copy toàn bộ nội dung file rồi chạy 1 lần

Migration này sẽ làm các việc sau:
- tạo hoặc cập nhật hàm `public.is_admin_user()`
- siết lại quyền RLS cho `profiles`, `projects`, `listings`, `listing_images`
- thêm cột `profile_id` cho `listings` nếu DB của bạn chưa có
- tạo bảng `public.system_settings`
- seed sẵn 1 record cấu hình trung tâm với `setting_key = 'global'`

## 2) Đăng nhập một tài khoản thật trước khi gán admin

Bạn cần có ít nhất 1 tài khoản đã đăng ký thành công trên website.

Sau khi tài khoản đó đăng nhập ít nhất 1 lần, hệ thống mới thường tạo dòng tương ứng trong bảng `profiles`.

Kiểm tra bằng SQL:

```sql
select id, email, full_name, system_role, status, created_at
from public.profiles
order by created_at desc;
```

Nếu chưa thấy tài khoản cần gán admin trong `profiles`, hãy:
- đăng ký hoặc đăng nhập tài khoản đó trên web
- mở lại trang tài khoản hoặc admin một lần
- quay lại SQL Editor chạy lại lệnh `select` ở trên

## 3) Gán quyền admin cho đúng tài khoản

### Cách nhanh nhất: gán theo email

```sql
update public.profiles
set system_role = 'admin',
    status = 'approved',
    updated_at = now()
where lower(email) = lower('email-admin-cua-ban@example.com');
```

Sau đó kiểm tra lại:

```sql
select id, email, full_name, system_role, status
from public.profiles
where lower(email) = lower('email-admin-cua-ban@example.com');
```

### Cách chắc chắn nhất: gán theo UUID

```sql
update public.profiles
set system_role = 'admin',
    status = 'approved',
    updated_at = now()
where id = 'UUID-THAT-CUA-TAI-KHOAN-ADMIN';
```

## 4) Đăng xuất rồi đăng nhập lại tài khoản admin

Bước này rất quan trọng vì frontend cần nạp lại profile mới có `system_role = 'admin'`.

Sau khi đăng nhập lại:
- vào `admin/admin-dashboard.html`
- vào `admin/cai-dat-he-thong.html`
- bấm **Làm mới** hoặc **Đồng bộ nhanh**

Nếu đúng quyền admin, trang sẽ đọc và đồng bộ được dữ liệu toàn hệ thống từ DB trung tâm.

## 5) Kiểm tra record cấu hình hệ thống đã có chưa

```sql
select setting_key, payload, updated_by, updated_at
from public.system_settings;
```

Bạn nên thấy ít nhất 1 dòng:
- `setting_key = 'global'`

Nếu chưa có, chạy lại đoạn seed này:

```sql
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
```

## 6) Kiểm tra nhanh tài khoản nào đang là admin

```sql
select id, email, full_name, system_role, status
from public.profiles
where lower(coalesce(system_role, 'user')) = 'admin'
order by updated_at desc nulls last;
```

## 7) Nếu admin vẫn không vào được khu vực quản trị

Hãy kiểm tra lần lượt:

### A. Tài khoản có trong bảng `profiles` chưa?
```sql
select id, email, full_name, system_role, status
from public.profiles
where lower(email) = lower('email-admin-cua-ban@example.com');
```

### B. `system_role` đã đúng là `admin` chưa?
```sql
select system_role
from public.profiles
where lower(email) = lower('email-admin-cua-ban@example.com');
```

### C. `status` có đang bị `blocked` hoặc `pending` không?
```sql
select status
from public.profiles
where lower(email) = lower('email-admin-cua-ban@example.com');
```

### D. Bạn đã đăng xuất và đăng nhập lại sau khi gán quyền chưa?
Nếu chưa, frontend vẫn có thể đang giữ session/profile cũ.

### E. Migration đã chạy thành công chưa?
Kiểm tra bảng và hàm:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'is_admin_user';

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'projects', 'listings', 'listing_images', 'system_settings');
```

## 8) Khuyến nghị vận hành

- chỉ nên có 1–2 tài khoản admin thật
- mọi tài khoản admin nên để `status = 'approved'`
- không dùng lại localStorage như nguồn dữ liệu chính
- sau khi thay đổi dữ liệu lớn trong DB, vào admin dashboard bấm **Đồng bộ nhanh** để làm mới cache hiển thị

## 9) Lệnh mẫu đầy đủ nhất để gán 1 admin mới

```sql
update public.profiles
set system_role = 'admin',
    status = 'approved',
    updated_at = now()
where lower(email) = lower('email-admin-cua-ban@example.com');

select id, email, full_name, system_role, status, updated_at
from public.profiles
where lower(email) = lower('email-admin-cua-ban@example.com');
```
