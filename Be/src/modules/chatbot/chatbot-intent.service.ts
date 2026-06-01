import { Injectable } from '@nestjs/common';
import type { DetectedChatbotIntent } from './chatbot.types';

@Injectable()
export class ChatbotIntentService {
  detectIntent(message: string): DetectedChatbotIntent {
    const normalized = this.normalize(message);

    if (
      this.hasAny(normalized, [
        'dat lai',
        'rebook',
        'dat them lan nua',
        'goi lai dich vu',
      ])
    ) {
      return { name: 'rebook', confidence: 0.88 };
    }

    if (
      this.hasAny(normalized, [
        'don cua toi',
        'don hang',
        'lich hen',
        'trang thai',
        'toi dau',
        'bao gia',
        'khao sat',
      ])
    ) {
      return { name: 'booking_status', confidence: 0.86 };
    }

    if (
      this.hasAny(normalized, [
        'nhan tin',
        'chat',
        'lien he',
        'hoi nha cung cap',
        'noi chuyen voi tho',
      ])
    ) {
      return { name: 'open_chat', confidence: 0.86 };
    }

    if (
      this.hasAny(normalized, [
        'so sanh',
        'khac nhau',
        'nen chon',
        'chon cai nao',
        'chon dich vu nao',
      ])
    ) {
      return { name: 'compare', confidence: 0.82 };
    }

    if (
      this.hasAny(normalized, [
        'dat lich',
        'dat dich vu',
        'book',
        'goi tho',
        'can tho',
        'hen lich',
        'toi muon dat',
      ])
    ) {
      return { name: 'create_booking', confidence: 0.84 };
    }

    if (
      this.hasAny(normalized, [
        'xin chao',
        'hello',
        'hi',
        'ban lam duoc gi',
        'tro ly lam duoc gi',
      ])
    ) {
      return { name: 'smalltalk', confidence: 0.7 };
    }

    return { name: 'search', confidence: 0.65 };
  }

  extractServiceId(message: string) {
    const match = message.match(/(?:service|dịch vụ|dich vu|id|#)\s*(\d+)/i);
    return match ? this.parsePositiveInt(match[1]) : undefined;
  }

  extractBookingCode(message: string) {
    const match = message.toUpperCase().match(/#?([A-Z]{2,}\d{3,})/);
    return match?.[1];
  }

  isCancelDraftMessage(message: string) {
    const normalized = this.normalize(message);
    return this.hasAny(normalized, [
      'huy nhap',
      'huy dat lich',
      'huy thao tac',
      'bo qua',
      'khong dat nua',
    ]);
  }

  parsePositiveInt(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s/-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  hasAny(value: string, terms: string[]) {
    return terms.some((term) => value.includes(term));
  }

  extractDistrictFromText(text: string): string | null {
    if (!text) return null;
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ');

    const matchNumber = normalized.match(/(?:quan|q\.?\s?)\s*(\d+)\b/i);
    if (matchNumber) {
      return `Quận ${matchNumber[1]}`;
    }

    const districtMap: Record<string, string> = {
      'binh thanh': 'Quận Bình Thạnh',
      'go vap': 'Quận Gò Vấp',
      'thu duc': 'Thành phố Thủ Đức',
      'phu nhuan': 'Quận Phú Nhuận',
      'tan binh': 'Quận Tân Bình',
      'tan phu': 'Quận Tân Phú',
      'binh tan': 'Quận Bình Tân',
      'cu chi': 'Huyện Củ Chi',
      'hoc mon': 'Huyện Hóc Môn',
      'nha be': 'Huyện Nhà Bè',
      'binh chanh': 'Huyện Bình Chánh',
      'can gio': 'Huyện Cần Giờ',
      'hoan kiem': 'Quận Hoàn Kiếm',
      'ba dinh': 'Quận Ba Đình',
      'tay ho': 'Quận Tây Hồ',
      'cau giay': 'Quận Cầu Giấy',
      'dong da': 'Quận Đống Đa',
      'hai ba trung': 'Quận Hai Bà Trưng',
      'hoang mai': 'Quận Hoàng Mai',
      'long bien': 'Quận Long Biên',
      'thanh xuan': 'Quận Thanh Xuân',
    };

    for (const [key, name] of Object.entries(districtMap)) {
      const regex = new RegExp(`(?:quan|q\\.?\\s?)?\\s*${key}`, 'i');
      if (regex.test(normalized)) {
        return name;
      }
    }

    return null;
  }
}
