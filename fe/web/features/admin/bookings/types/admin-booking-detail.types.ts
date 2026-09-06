export interface BookingStatusConfig {
  label: string;
  color: string;
}

export const BOOKING_STATUS_CONFIG: Record<string, BookingStatusConfig> = {
  PENDING: {
    label: 'Chờ xử lý',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  ACCEPTED: {
    label: 'Đã tiếp nhận',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  QUOTED: {
    label: 'Đã báo giá',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  DONE: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  DISPUTED: {
    label: 'Khiếu nại',
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

export interface AdminBookingUser {
  id: number;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface AdminBookingServiceCategory {
  id: number;
  name: string;
}

export interface AdminBookingService {
  id: number;
  name: string;
  category?: AdminBookingServiceCategory | null;
}

export interface AdminBookingQuotation {
  id: number;
  actualPrice: number | string;
  estimatedTime?: string | null;
  commissionRateSnapshot?: number | null;
  note?: string | null;
}

export interface AdminBookingDispute {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
  resolutionReason?: string | null;
  resolutionAction?: 'COMPLETE' | 'PENALIZE' | null;
}

export interface AdminBookingReview {
  id: number;
  rating: number;
  comment?: string | null;
}

export interface AdminBookingTimelineItem {
  id?: number;
  fromStatus?: string | null;
  toStatus: string;
  createdAt: string;
  note?: string | null;
  changedBy?: number | null;
}

export interface AdminBookingDetailData {
  id: number;
  bookingCode: string;
  status: string;
  description?: string | null;
  desiredTime?: string | null;
  surveyorName?: string | null;
  surveyorPhone?: string | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  customer?: AdminBookingUser | null;
  provider?: AdminBookingUser | null;
  service?: AdminBookingService | null;
  quotation?: AdminBookingQuotation | null;
  dispute?: AdminBookingDispute | null;
  review?: AdminBookingReview | null;
  statusHistories?: AdminBookingTimelineItem[];
}

