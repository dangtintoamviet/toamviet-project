# Hướng dẫn cấu hình lớp thanh toán VIP

Bản nâng cấp này đã thêm đầy đủ các lớp sau:
- tạo đơn hàng `listing_orders`
- log giao dịch `payment_transactions`
- callback/IPN thật cho VNPay
- tự cấp entitlement sau thanh toán thành công
- tự nâng `vip_level` cho tin gắn với đơn hàng đã thanh toán
- trang kết quả thanh toán `pages/thanh-toan-ket-qua.html`

## 1) SQL cần chạy trong Supabase

Chạy theo thứ tự:
1. `supabase-hardening-2026-04-10.sql`
2. `supabase-platform-upgrade-2026-04-10.sql`
3. `supabase-payment-upgrade-2026-04-10.sql`

## 2) Biến môi trường cần thêm trên Vercel

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_BASE_URL`
- `VNPAY_RETURN_URL` (khuyến nghị, nếu bỏ trống hệ thống tự dùng `/api/payment/vnpay-return`)
- `VNPAY_LOCALE` (không bắt buộc, mặc định `vn`)
- `VNPAY_CURRENCY` (không bắt buộc, mặc định `VND`)
- `VNPAY_BANK_CODE` (không bắt buộc)

Gợi ý:
- sandbox: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- production: URL theo merchant thật VNPay cấp

## 3) URL cần khai báo với cổng VNPay

- Return URL: `https://ten-mien-cua-ban/api/payment/vnpay-return`
- IPN URL: `https://ten-mien-cua-ban/api/payment/vnpay-ipn`

## 4) Cách vận hành

- Khi `monetizationEnabled = false`: user vẫn chọn VIP miễn phí như trước.
- Khi `monetizationEnabled = true`: user chọn VIP cao hơn mức entitlement hiện có thì tin được lưu trước, sau đó hệ thống tự điều hướng sang cổng thanh toán.
- Sau callback/IPN thành công:
  - `listing_orders.status = paid`
  - thêm dòng `payment_transactions`
  - thêm `user_entitlements`
  - cập nhật `listings.vip_level` đúng gói đã mua

## 5) Lưu ý bảo mật

- Không đưa `SUPABASE_SERVICE_ROLE_KEY`, `VNPAY_HASH_SECRET`, `VNPAY_TMN_CODE` vào frontend.
- Admin chỉ chỉnh giá / catalog package ở giao diện cài đặt hệ thống; thông tin bí mật chỉ để trong biến môi trường.
