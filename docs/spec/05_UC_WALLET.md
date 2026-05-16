<!-- FILE: 05_UC_WALLET.md | SCOPE: UC14 Ví NCC & Payment Flow (VNPay IPN · Hoa hồng · Phạt tranh chấp) -->

## UC14 – QUẢN LÝ VÍ NHÀ CUNG CẤP {#uc14}

> **Mô hình thanh toán thực tế:** Hệ thống dùng **thanh toán trực tiếp** — KH trả tiền cho NCC ngoài nền tảng (tiền mặt hoặc chuyển khoản). Nền tảng không giữ tiền của KH, không có `customer_wallets`, không có escrow.
>
> Nền tảng chỉ quản lý ví của NCC (`provider_wallets`) để:
> 1. Yêu cầu NCC nạp tiền đặt cọc uy tín trước khi nhận đơn
> 2. Tự động trừ hoa hồng sau khi đơn hoàn thành
> 3. Phạt NCC khi thua tranh chấp

---

> **DB Schema thực tế (nguồn sự thật):**
> ```
> provider_wallets:     provider_id, balance, is_restricted, updated_at
> wallet_transactions:  wallet_id, type (DEPOSIT|COMMISSION|PENALTY), amount,
>                       booking_id (nullable), status, vnpay_txn_ref, created_at
> commission_configs:   rate, reason, configured_by, effective_from
> ```
> Không có `customer_wallets`. Không có `escrow_transactions`. Không có `locked_balance`.

---

### UC14.1 – Xem số dư và lịch sử giao dịch ví

**Actor:** Nhà cung cấp | **Priority:** Trung bình

**Hiển thị:**
- Số dư hiện tại (màu đỏ nếu âm + banner cảnh báo "Tài khoản bị hạn chế")
- Tổng đã nạp, Tổng hoa hồng đã trả
- Line Chart: xu hướng số dư theo thời gian
- Bảng lịch sử giao dịch (phân trang): thời gian, loại, mã tham chiếu, số tiền

**Phân loại dòng tiền hiển thị:**
- `DEPOSIT`: màu xanh (+), nhãn "Nạp tiền"
- `COMMISSION`: màu đỏ (-), nhãn "Hoa hồng" + link đến booking tương ứng
- `PENALTY`: màu đỏ đậm (-), nhãn "Phạt tranh chấp" + link đến dispute tương ứng

**Bộ lọc:** Tất cả / Nạp tiền / Hoa hồng / Phạt; khoảng thời gian.

**Business Rules:**
- BR1: Tenant Isolation — chỉ xem ví của NCC đang đăng nhập
- BR2: Số dư âm hiển thị màu đỏ + cảnh báo "Không nhận được đơn mới cho đến khi nạp bù"
- BR3: Mỗi COMMISSION và PENALTY có `booking_id` / `dispute_id` có thể click-through

---

### UC14.2 – Nạp tiền vào ví (VNPay)

**Actor:** Nhà cung cấp | **Priority:** Cao

**Mục đích:** NCC nạp tiền để duy trì số dư dương — điều kiện để nhận đơn mới. Nếu số dư âm (do hoa hồng trừ quá), NCC phải nạp bù để mở khóa.

**Luồng kỹ thuật:**

```
1. NCC chọn số tiền (≥ 50.000 VNĐ) → nhấn "Nạp tiền qua VNPay"

2. Hệ thống:
   - Sinh idempotency_key = UUID
   - INSERT wallet_transactions (wallet_id, type='DEPOSIT', amount, status='PENDING',
                                  vnpay_txn_ref=idempotency_key)
   - Redirect sang VNPay với vnp_TxnRef = idempotency_key

3. VNPay callback POST /wallet/vnpay-ipn:
   a. Xác thực chữ ký HMAC-SHA512 (bắt buộc, từ chối nếu sai)
   b. SELECT id FROM wallet_transactions WHERE vnpay_txn_ref = ? AND status = 'SUCCESS'
      → Nếu tìm thấy → trả HTTP 200 RspCode=00 ngay (idempotency, không xử lý lại)
   c. prisma.$transaction([
        UPDATE wallet_transactions SET status='SUCCESS' WHERE vnpay_txn_ref=?
        UPDATE provider_wallets SET balance = balance + amount WHERE provider_id=?
        // Nếu balance >= 0 sau nạp: SET is_restricted = false
      ])
   d. Gửi notification "Nạp tiền thành công" (UC19)

4. Redirect về trang ví với toast thành công/thất bại
```

**Business Rules:**
- BR1: Số tiền nạp tối thiểu 50.000 VNĐ
- BR2: `vnpay_txn_ref` = idempotency key, sinh phía server trước khi redirect, lưu DB
- BR3: Xác thực HMAC-SHA512 bắt buộc — từ chối callback nếu chữ ký sai
- BR4: Callback gọi 2 lần → lần 2 check `status = 'SUCCESS'` → trả 200 ngay, không cộng tiền lần 2
- BR5: Toàn bộ cập nhật ví trong `prisma.$transaction()` — rollback nếu bất kỳ bước nào fail
- BR6: Nếu nạp thành công và `balance >= 0`: tự động set `is_restricted = false`

**Failure Scenarios:** Xem FS02 (VNPay callback gọi 2 lần).

---

### UC14.3 – Tự động trừ hoa hồng khi đơn hoàn thành

**Actor:** System (trigger từ UC17.2 hoặc Cronjob auto-complete) | **Priority:** Cao — CỐT LÕI

**Trigger:** KH xác nhận nghiệm thu (UC17.2) HOẶC Cronjob auto-complete sau 24h.

**Luồng trong `prisma.$transaction()`:**

```typescript
// Idempotency check (chống FS05 — cronjob chạy 2 lần)
// Kiểm tra: đã có wallet_transaction COMMISSION cho booking này chưa?
const existing = await prisma.walletTransaction.findFirst({
  where: { bookingId, type: 'COMMISSION', status: 'SUCCESS' }
});
if (existing) return; // đã xử lý, bỏ qua

// Lấy thông tin cần thiết
const quotation = await prisma.quotation.findUnique({ where: { bookingId } });
const commissionAmt = quotation.actualPrice * (quotation.commissionRateSnapshot / 100);

await prisma.$transaction([
  // 1. Ghi wallet_transaction COMMISSION
  prisma.walletTransaction.create({
    data: {
      walletId,
      type: 'COMMISSION',
      amount: -commissionAmt,       // âm = trừ tiền
      bookingId,
      status: 'SUCCESS',
    }
  }),

  // 2. Trừ balance ví NCC
  prisma.providerWallet.update({
    where: { providerId },
    data: {
      balance: { decrement: commissionAmt },
      // is_restricted sẽ được set trong step 3 nếu balance âm
    }
  }),

  // 3. Ghi auto_completed_at vào booking
  prisma.booking.update({
    where: { id: bookingId },
    data: { autoCompletedAt: new Date() }
  }),

  // 4. Ghi audit_log
  prisma.auditLog.create({
    data: {
      actorId: 0, // system
      action: 'AUTO_COMPLETE_BOOKING',
      targetType: 'BOOKING',
      targetId: bookingId,
      description: `Tự động chốt đơn, trừ hoa hồng ${commissionAmt.toLocaleString()}đ`,
    }
  }),
]);

// 5. Sau transaction: check balance, nếu âm → set is_restricted = true
const updatedWallet = await prisma.providerWallet.findUnique({ where: { providerId } });
if (updatedWallet.balance < 0) {
  await prisma.providerWallet.update({
    where: { providerId },
    data: { isRestricted: true }
  });
}
```

**Business Rules:**
- BR1: `commission_rate_snapshot` đã chốt cứng tại UC12.3 — dùng giá trị đó, không lấy rate hiện tại
- BR2: Idempotency bắt buộc — kiểm tra `wallet_transactions` trước khi thực thi
- BR3: Ví âm sau khi trừ → vẫn commit (ghi nợ), sau đó set `is_restricted = true`
- BR4: NCC bị `is_restricted` → dịch vụ ẩn khỏi search và AI gợi ý cho đến khi nạp bù
- BR5: Xử lý **tuần tự** trong Worker nếu nhiều đơn của cùng NCC — tránh deadlock (xem FS10)

**Failure Scenarios:** Xem FS05 (cronjob chạy 2 lần), FS06 (transaction không nguyên tử), FS10 (deadlock).

---

### UC14.4 – Trừ phạt NCC khi thua tranh chấp

**Actor:** System (trigger từ UC09.2 sau phán quyết Admin PENALIZE) | **Priority:** Cao

**Trigger:** Admin chốt tranh chấp với `resolution_action = PENALIZE`.

**Bối cảnh:** KH đã tự thanh toán trực tiếp cho NCC (ngoài nền tảng). Khi NCC thua tranh chấp, nền tảng không thể hoàn tiền cho KH (vì không giữ tiền). Thay vào đó, Admin có thể phạt NCC bằng cách trừ tiền ví hoặc khóa tài khoản.

**Admin chọn một trong hai hành động:**

**Hành động A — Trừ tiền phạt:**
```typescript
// Admin nhập penalty_amount (tùy quyết định)
await prisma.$transaction([
  prisma.walletTransaction.create({
    data: {
      walletId,
      type: 'PENALTY',
      amount: -penaltyAmount,
      bookingId,
      status: 'SUCCESS',
    }
  }),
  prisma.providerWallet.update({
    where: { providerId },
    data: { balance: { decrement: penaltyAmount } }
  }),
  prisma.dispute.update({
    where: { id: disputeId },
    data: { status: 'RESOLVED', resolutionAction: 'PENALIZE', resolutionReason }
  }),
  prisma.auditLog.create({ ... })
]);

// Sau transaction: set is_restricted nếu balance âm
```

**Hành động B — Khóa tài khoản vĩnh viễn (vi phạm nghiêm trọng):**
```typescript
await prisma.$transaction([
  prisma.user.update({
    where: { id: providerId },
    data: { status: 'LOCKED' }
  }),
  // Thu hồi toàn bộ refresh token
  prisma.refreshToken.updateMany({
    where: { userId: providerId },
    data: { revoked: true }
  }),
  // Ẩn toàn bộ dịch vụ
  prisma.service.updateMany({
    where: { providerId },
    data: { status: 'HIDDEN' }
  }),
  prisma.dispute.update({
    where: { id: disputeId },
    data: { status: 'RESOLVED', resolutionAction: 'PENALIZE', resolutionReason }
  }),
  prisma.auditLog.create({ ... })
]);
```

**Business Rules:**
- BR1: Chỉ Admin mới có quyền thực hiện hành động này
- BR2: `resolution_action` chỉ nhận giá trị `COMPLETE` hoặc `PENALIZE` — không có `REFUND`
- BR3: Booking vẫn giữ `status = DISPUTED` sau phán quyết — không đổi sang status khác
- BR4: Penalty amount do Admin quyết định — không có công thức cố định
- BR5: Toàn bộ trong `prisma.$transaction()`, ghi audit_log bắt buộc
- BR6: Gửi notification cho cả KH (kết quả tranh chấp) và NCC (hình thức xử phạt)

---

### UC14.5 – Xử lý ví NCC âm (ghi nợ hoa hồng)

**Actor:** System | **Priority:** Trung bình

**Tình huống:** NCC rút hết tiền trước khi đơn hoàn thành, sau đó hoa hồng bị trừ → ví âm. Hệ thống cho phép ghi nợ thay vì block transaction.

**Business Rules:**
- BR1: Cho phép `balance < 0` — ghi nợ, không rollback lệnh trừ
- BR2: Khi `balance < 0`: set `is_restricted = true`
  - Dịch vụ của NCC ẩn khỏi search và AI gợi ý
  - NCC không nhận được thông báo đơn mới
- BR3: Khi NCC nạp tiền và `balance >= 0`: tự động set `is_restricted = false` + dịch vụ hiện lại
- BR4: Hiển thị cảnh báo rõ trong dashboard NCC khi số dư âm
