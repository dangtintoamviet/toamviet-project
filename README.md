# toamviet-project

ToamViet hiện được chốt theo chiến lược **Supabase-first**.

## Kiến trúc hiện tại
- **Auth:** Supabase Auth
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage
- **Frontend:** HTML / CSS / JS tĩnh hiện có
- **Backend chiến lược:** **không dùng Node/Mongo song song nữa**

## Mục tiêu của bản này
- Giữ nguyên giao diện, card, bố cục đang ổn định.
- Làm sạch code theo hướng một nguồn dữ liệu trung tâm.
- Đồng bộ luồng auth, user, admin và public theo Supabase.
- Giảm tối đa dữ liệu local chỉ còn vai trò cache phụ trợ cho hiển thị nhanh.

## File Supabase quan trọng
- `assets/js/api-config.js`: cấu hình Supabase URL + publishable key
- `assets/js/auth-api.js`: đăng ký / đăng nhập bằng Supabase Auth
- `assets/js/supabase-data-service.js`: lớp dữ liệu trung tâm cho profile, listings, projects, admin
- `toamviet-supabase-schema.sql`: schema chuẩn cho dự án mới
- `supabase-setup-next-step.sql`: bước tạo bảng hồ sơ user cơ bản
- `supabase-admin-migration.sql`: migration nâng quyền admin thật theo DB trung tâm cho dự án đang chạy
- `SUPABASE_ADMIN_SETUP_GUIDE.md`: hướng dẫn chi tiết để chạy migration, gán quyền admin và kiểm tra lỗi
- `supabase-set-admin-snippets.sql`: các câu lệnh SQL mẫu để tìm user, gán admin và kiểm tra lại quyền

## Khuyến nghị triển khai
1. Chạy `toamviet-supabase-schema.sql` nếu dựng mới toàn bộ database.
2. Nếu project Supabase đã có dữ liệu rồi, chạy thêm `supabase-admin-migration.sql` để siết lại quyền admin / RLS.
3. Đặt ít nhất 1 tài khoản admin bằng cách cập nhật `profiles.system_role = 'admin'` cho user quản trị.
4. Test 4 luồng chính:
   - đăng ký / đăng nhập
   - cập nhật tài khoản
   - đăng tin / sửa tin / quản lý tin
   - admin duyệt tin / quản lý thành viên / quản lý dự án

## Ghi chú
- LocalStorage vẫn còn được dùng làm cache giao diện và store phụ để các trang public đang có tiếp tục hoạt động mượt.
- Nguồn dữ liệu chiến lược đã chốt là **Supabase**.
- Node/Mongo backend cũ đã được loại khỏi bộ mã nguồn này để tránh duy trì 2 hệ dữ liệu chính song song.
