import * as crypto from 'crypto';

/**
 * Tạo OTP 6 chữ số ngẫu nhiên
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Tạo token ngẫu nhiên (reset password, etc.)
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Tạo mã booking duy nhất: BK + YYYYMMDD + 3 số ngẫu nhiên
 */
export function generateBookingCode(): string {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900).toString();
  return `BK${dateStr}${rand}`;
}

/**
 * Tạo VNPay transaction ref: VNPAY + timestamp + 4 số random
 */
export function generateVnpayTxnRef(): string {
  const ts = Date.now().toString();
  const rand = Math.floor(1000 + Math.random() * 9000).toString();
  return `VNPAY${ts}${rand}`;
}

/**
 * Tạo password ngẫu nhiên 12 ký tự (cho tạo staff account)
 */
export function generateRandomPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;

  // Đảm bảo ít nhất 1 ký tự mỗi loại
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
