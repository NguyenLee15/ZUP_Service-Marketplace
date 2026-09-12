export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  ACCEPTED: 'Đã nhận / Đang đến',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Tranh chấp',
};

import type { ColorScheme } from './colors';

export const BOOKING_STATUS_COLOR_KEY: Record<string, keyof ColorScheme> = {
  PENDING: 'statusPending',
  ACCEPTED: 'statusAccepted',
  QUOTED: 'statusQuoted',
  CONFIRMED: 'statusConfirmed',
  IN_PROGRESS: 'statusInProgress',
  DONE: 'statusDone',
  CANCELLED: 'statusCancelled',
  DISPUTED: 'statusDisputed',
};

export function getBookingStatusColor(status: string | null | undefined, colors: ColorScheme) {
  const key = status ? BOOKING_STATUS_COLOR_KEY[status] : undefined;
  return key ? colors[key] : colors.textSecondary;
}
