export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Tranh chấp',
};

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING: '#F59E0B',
  QUOTED: '#7C3AED',
  CONFIRMED: '#2563EB',
  IN_PROGRESS: '#7C3AED',
  DONE: '#16A34A',
  CANCELLED: '#DC2626',
  DISPUTED: '#EA580C',
};
