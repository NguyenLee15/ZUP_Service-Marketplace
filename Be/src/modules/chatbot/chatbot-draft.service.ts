import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../bookings/dto/bookings.dto';
import type {
  BookingDraft,
  ChatbotQuickReply,
  ChatServiceResult,
} from './chatbot.types';
import { ChatbotFormatterService } from './chatbot-formatter.service';
import { ChatbotIntentService } from './chatbot-intent.service';

export type BookingDraftMissingField =
  | 'service'
  | 'description'
  | 'address'
  | 'desiredTime';

@Injectable()
export class ChatbotDraftService {
  constructor(
    private readonly formatter: ChatbotFormatterService,
    private readonly intentService: ChatbotIntentService,
  ) {}

  parseDesiredTime(message: string): string | undefined {
    const normalized = this.intentService.normalize(message);
    const now = new Date();
    const date = new Date(now);
    let hasDate = false;

    if (normalized.includes('ngay mai')) {
      date.setDate(now.getDate() + 1);
      hasDate = true;
    } else if (normalized.includes('hom nay')) {
      hasDate = true;
    } else if (normalized.includes('cuoi tuan')) {
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7 || 7;
      date.setDate(now.getDate() + daysUntilSaturday);
      hasDate = true;
    } else {
      const dateMatch = normalized.match(
        /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/,
      );
      if (dateMatch) {
        const day = Number(dateMatch[1]);
        const month = Number(dateMatch[2]) - 1;
        const year = dateMatch[3] ? Number(dateMatch[3]) : now.getFullYear();
        date.setFullYear(year, month, day);
        hasDate = true;
      }
    }

    const hourMatch = normalized.match(/(\d{1,2})(?:h| gio|:)(\d{2})?/);
    const hour = hourMatch ? Number(hourMatch[1]) : 9;
    const minute = hourMatch?.[2] ? Number(hourMatch[2]) : 0;
    date.setHours(Math.min(Math.max(hour, 7), 21), minute, 0, 0);

    if (!hasDate) return undefined;
    if (date.getTime() <= now.getTime()) {
      date.setDate(date.getDate() + 1);
    }

    return date.toISOString();
  }

  getDraftMissingFields(draft: BookingDraft): BookingDraftMissingField[] {
    const missing: BookingDraftMissingField[] = [];
    if (!draft.serviceId) missing.push('service');
    if (!draft.description) missing.push('description');
    if (
      !draft.province ||
      !draft.district ||
      !draft.ward ||
      !draft.addressDetail
    ) {
      missing.push('address');
    }
    if (!draft.desiredTime) missing.push('desiredTime');
    return missing;
  }

  composeDraftMissingReply(
    missing: BookingDraftMissingField[],
    services: ChatServiceResult[],
  ) {
    const parts = missing.map((field) => {
      if (field === 'service') return 'dịch vụ cần đặt';
      if (field === 'description') return 'mô tả vấn đề/công việc';
      if (field === 'address') return 'địa chỉ mặc định của bạn';
      return 'thời gian mong muốn';
    });

    const serviceHint =
      missing.includes('service') && services.length > 0
        ? ` Tôi đã tìm thấy ${services.length} dịch vụ gợi ý ở bên dưới, bạn có thể mở dịch vụ hoặc nhắn tên dịch vụ muốn chọn.`
        : '';

    return `Tôi cần thêm ${parts.join(', ')} để tạo nháp đặt lịch.${serviceHint}`;
  }

  draftQuickReplies(missing: BookingDraftMissingField[]): ChatbotQuickReply[] {
    const replies: ChatbotQuickReply[] = [];
    if (missing.includes('desiredTime')) {
      replies.push({
        label: 'Ngày mai 9h',
        message: 'Tôi muốn đặt ngày mai lúc 9h',
      });
      replies.push({
        label: 'Cuối tuần',
        message: 'Tôi muốn đặt vào cuối tuần lúc 9h',
      });
    }
    if (missing.includes('description')) {
      replies.push({
        label: 'Mô tả vấn đề',
        message: 'Thiết bị đang gặp sự cố và cần thợ kiểm tra',
      });
    }
    if (missing.includes('address')) {
      replies.push({
        label: 'Cần địa chỉ',
        message: 'Tôi cần cập nhật địa chỉ mặc định ở hồ sơ',
      });
    }
    return replies.length > 0 ? replies : this.formatter.defaultQuickReplies();
  }

  toCreateBookingDto(draft: BookingDraft): CreateBookingDto {
    const missing = this.getDraftMissingFields(draft);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Thiếu thông tin đặt lịch: ${missing.join(', ')}`,
      );
    }

    return {
      serviceId: Number(draft.serviceId),
      description: String(draft.description),
      province: String(draft.province),
      district: String(draft.district),
      ward: String(draft.ward),
      addressDetail: String(draft.addressDetail),
      desiredTime: String(draft.desiredTime),
    };
  }
}
