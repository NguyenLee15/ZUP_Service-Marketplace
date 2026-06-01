import { Injectable } from '@nestjs/common';
import type { ChatbotQuickReply, ChatServiceResult } from './chatbot.types';

export interface ChatbotServiceCardSource {
  id: number;
  name: string;
  description?: string | null;
  referencePrice: unknown;
  providerId: number;
  provider: {
    fullName: string;
  };
  avgRating?: unknown;
  totalReviews?: number | null;
  category?: {
    name: string;
  } | null;
  images?: Array<{
    imageUrl: string;
  }>;
  distanceKm?: number;
  providerAddress?: string;
}

@Injectable()
export class ChatbotFormatterService {
  statusLabel(status: string) {
    const labels: Record<string, string> = {
      PENDING: 'đang chờ nhà cung cấp phản hồi',
      QUOTED: 'đã có báo giá, bạn cần xác nhận hoặc từ chối',
      CONFIRMED: 'đã xác nhận lịch',
      IN_PROGRESS: 'đang thực hiện',
      DONE: 'đã hoàn thành',
      DISPUTED: 'đang khiếu nại',
      CANCELLED: 'đã hủy',
    };
    return labels[status] || status;
  }

  nextStepForStatus(status: string) {
    const steps: Record<string, string> = {
      PENDING: 'hãy chờ nhà cung cấp xác nhận khảo sát hoặc gửi báo giá',
      QUOTED: 'bạn nên xem báo giá và xác nhận nếu đồng ý',
      CONFIRMED: 'hãy chuẩn bị theo lịch hẹn đã xác nhận',
      IN_PROGRESS: 'hãy theo dõi quá trình thực hiện và chat nếu cần trao đổi',
      DONE: 'bạn có thể nghiệm thu, đánh giá hoặc đặt lại dịch vụ',
      DISPUTED: 'đội ngũ xử lý khiếu nại sẽ xem xét bằng chứng',
      CANCELLED: 'bạn có thể đặt lại nếu vẫn cần dịch vụ',
    };
    return steps[status] || 'hãy mở chi tiết đơn để xem bước tiếp theo';
  }

  formatPrice(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  defaultQuickReplies(): ChatbotQuickReply[] {
    return [
      { label: 'Tìm dịch vụ', message: 'Tìm dịch vụ phù hợp cho tôi' },
      { label: 'So sánh dịch vụ', message: 'So sánh các dịch vụ giúp tôi' },
      { label: 'Đơn của tôi', message: 'Đơn của tôi tới đâu rồi?' },
    ];
  }

  toServiceCard(service: ChatbotServiceCardSource): ChatServiceResult {
    return {
      id: service.id,
      name: service.name,
      description: service.description ?? undefined,
      referencePrice: Number(service.referencePrice),
      providerId: service.providerId,
      providerName: service.provider.fullName,
      avgRating: Number(service.avgRating || 0),
      totalReviews: service.totalReviews || 0,
      categoryName: service.category?.name || 'Khác',
      imageUrl: service.images?.[0]?.imageUrl,
      distanceKm:
        service.distanceKm !== undefined
          ? Number(service.distanceKm)
          : undefined,
      providerAddress: service.providerAddress,
    };
  }

  buildServiceContext(services: ChatbotServiceCardSource[]) {
    return services
      .map((service) => {
        let text = `- [ID:${service.id}] ${service.name} | Giá tham khảo: ${this.formatPrice(Number(service.referencePrice))} | Đánh giá: ${Number(service.avgRating || 0).toFixed(1)} | Lượt đánh giá: ${service.totalReviews || 0} | Nhà cung cấp: ${service.provider.fullName} | Danh mục: ${service.category?.name || 'Khác'}`;
        if (service.distanceKm !== undefined) {
          text += ` | Khoảng cách đến khách hàng: ${service.distanceKm.toFixed(1)} km`;
        }
        if (service.providerAddress) {
          text += ` | Địa chỉ thợ: ${service.providerAddress}`;
        }
        text += ` | Mô tả: ${service.description}`;
        return text;
      })
      .join('\n');
  }
}
