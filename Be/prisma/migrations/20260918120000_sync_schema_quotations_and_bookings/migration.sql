-- 1. Thêm giá trị 'ACCEPTED' vào enum BookingStatus (nếu chưa có)
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

-- 2. Thêm cột provider_arrived_at vào bảng bookings (nếu chưa có)
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "provider_arrived_at" TIMESTAMP(3);

-- 3. Bổ sung các cột type và status cho bảng quotations (nếu chưa có)
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) NOT NULL DEFAULT 'ORIGINAL';
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- 4. Đảm bảo các cột timestamp tồn tại trên bảng quotations
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 5. Xóa bỏ ràng buộc UNIQUE trên quotations(booking_id) để hỗ trợ nhiều báo giá phát sinh (SUPPLEMENTARY)
DROP INDEX IF EXISTS "quotations_booking_id_key";

-- 6. Tạo index thông thường cho quotations(booking_id)
CREATE INDEX IF NOT EXISTS "quotations_booking_id_idx" ON "quotations"("booking_id");

