import { useMemo } from 'react';
import { Timeline } from '../../../components/customer/customer-ui';
import { BOOKING_STATUS_LABEL } from '../../../constants/booking-status';
import { formatDateTime } from '../../../lib/format';
import type { CustomerBookingDetail, CustomerBookingTimelineItem } from './customer-booking-detail.types';

const BASE_STEPS = [
  { key: 'PENDING', label: 'Đã gửi yêu cầu', description: 'Đang chờ nhà cung cấp xác nhận.' },
  { key: 'ACCEPTED', label: 'Đã tiếp nhận', description: 'Nhà cung cấp đã nhận đơn, chờ báo giá hoặc đang đến.' },
  { key: 'QUOTED', label: 'Đã có báo giá', description: 'Bạn có thể xác nhận hoặc từ chối báo giá.' },
  { key: 'CONFIRMED', label: 'Đã xác nhận', description: 'Lịch hẹn đã được chốt.' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện', description: 'Theo dõi tiến độ và vị trí nếu có.' },
  { key: 'DONE', label: 'Hoàn thành', description: 'Bạn có thể nghiệm thu và đánh giá.' },
];

export function CustomerBookingTimeline({ booking, history }: { booking: CustomerBookingDetail; history?: CustomerBookingTimelineItem[] }) {
  const steps = useMemo(() => {
    if (!history?.length) return booking.status === 'CANCELLED' || booking.status === 'DISPUTED'
      ? [...BASE_STEPS.slice(0, 2), { key: booking.status, label: BOOKING_STATUS_LABEL[booking.status], description: 'Đơn hàng đã kết thúc.' }]
      : BASE_STEPS;
    return history.map((item, index) => {
      const status = item.toStatus || item.fromStatus || 'PENDING';
      return { key: `${status}-${item.id || index}`, label: BOOKING_STATUS_LABEL[status] || status, description: [item.note, item.createdAt ? formatDateTime(item.createdAt) : null].filter(Boolean).join(' · ') };
    });
  }, [booking.status, history]);
  const current = history?.length ? steps[steps.length - 1]?.key.split('-')[0] : booking.status;
  return <Timeline status={current || 'PENDING'} steps={steps} />;
}
