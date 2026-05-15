/**
 * Booking status mapping — đồng bộ với DB enum BookingStatus
 */
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  QUOTED: 'QUOTED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ xác nhận',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Tranh chấp',
};

export const BOOKING_STATUS_COLOR_KEY: Record<BookingStatus, string> = {
  PENDING: 'statusPending',
  QUOTED: 'statusQuoted',
  CONFIRMED: 'statusConfirmed',
  IN_PROGRESS: 'statusInProgress',
  DONE: 'statusDone',
  CANCELLED: 'statusCancelled',
  DISPUTED: 'statusDisputed',
};

/** Trạng thái NCC có thể hủy đơn */
export const CANCELLABLE_STATUSES: BookingStatus[] = ['PENDING', 'QUOTED'];
