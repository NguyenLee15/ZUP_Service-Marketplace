import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SenderType, ServiceStatus, UserRole } from '@prisma/client';

import { AiService } from '../../shared/ai/ai.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

type CreateConversationInput = {
  serviceId?: number | string;
  bookingId?: number | string;
};

@Injectable()
export class ChatsService {
  private readonly logger = new Logger('ChatsService');

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private eventEmitter: EventEmitter2,
  ) {}

  async isMember(conversationId: number, userId: number): Promise<boolean> {
    const count = await this.prisma.conversation.count({
      where: {
        id: conversationId,
        OR: [{ customerId: userId }, { providerId: userId }],
      },
    });
    return count > 0;
  }

  private readonly conversationInclude = {
    customer: { select: { id: true, fullName: true, avatarUrl: true } },
    provider: { select: { id: true, fullName: true, avatarUrl: true } },
    service: { select: { id: true, name: true } },
    booking: {
      select: {
        id: true,
        bookingCode: true,
        status: true,
        service: { select: { id: true, name: true } },
      },
    },
    messages: { orderBy: { id: 'desc' as const }, take: 1 },
  };

  private toConversationResponse<T extends { messages?: unknown[] }>(
    conversation: T,
  ) {
    return {
      ...conversation,
      lastMessage: conversation.messages?.[0] || null,
    };
  }

  private parseOptionalId(
    value: number | string | undefined,
  ): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  async getOrCreateConversation(
    bookingId: number,
    customerId: number,
    providerId: number,
  ) {
    const existing = await this.prisma.conversation.findUnique({
      where: { bookingId },
      include: this.conversationInclude,
    });
    if (existing) return this.toConversationResponse(existing);

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId, providerId },
      select: { serviceId: true },
    });

    const conversation = await this.prisma.conversation.create({
      data: {
        bookingId,
        customerId,
        providerId,
        serviceId: booking?.serviceId,
      },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(conversation);
  }

  async getOrCreateConversationForUser(
    userId: number,
    role: UserRole,
    input: CreateConversationInput,
  ) {
    const serviceId = this.parseOptionalId(input.serviceId);
    const bookingId = this.parseOptionalId(input.bookingId);

    if ((!serviceId && !bookingId) || (serviceId && bookingId)) {
      throw new BadRequestException({
        message:
          'Vui lòng gửi đúng một trong hai trường serviceId hoặc bookingId',
      });
    }

    if (serviceId) {
      return { data: await this.getOrCreateByService(userId, role, serviceId) };
    }

    return { data: await this.getOrCreateByBooking(userId, bookingId!) };
  }

  private async getOrCreateByService(
    customerId: number,
    role: UserRole,
    serviceId: number,
  ) {
    if (role !== UserRole.CUSTOMER) {
      throw new ForbiddenException({
        message: 'Chỉ khách hàng có thể bắt đầu chat từ trang dịch vụ',
      });
    }

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, status: ServiceStatus.ACTIVE, isDeleted: false },
      select: { id: true, providerId: true },
    });

    if (!service) {
      throw new NotFoundException({ message: 'Dịch vụ không khả dụng' });
    }

    if (service.providerId === customerId) {
      throw new BadRequestException({
        message: 'Bạn không thể nhắn tin với chính nhà cung cấp của mình',
      });
    }

    const existingForService = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        providerId: service.providerId,
        serviceId: service.id,
      },
      include: this.conversationInclude,
    });
    if (existingForService)
      return this.toConversationResponse(existingForService);

    const existingForProvider = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        providerId: service.providerId,
      },
      orderBy: { updatedAt: 'desc' },
      include: this.conversationInclude,
    });

    if (existingForProvider) {
      const updated = await this.prisma.conversation.update({
        where: { id: existingForProvider.id },
        data: { serviceId: service.id },
        include: this.conversationInclude,
      });
      return this.toConversationResponse(updated);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        customerId,
        providerId: service.providerId,
        serviceId: service.id,
      },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(conversation);
  }

  private async getOrCreateByBooking(userId: number, bookingId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ customerId: userId }, { providerId: userId }],
      },
      select: {
        id: true,
        customerId: true,
        providerId: true,
        serviceId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({ message: 'Đơn hàng không tồn tại' });
    }

    const existingByBooking = await this.prisma.conversation.findUnique({
      where: { bookingId: booking.id },
      include: this.conversationInclude,
    });
    if (existingByBooking)
      return this.toConversationResponse(existingByBooking);

    const existingByService = await this.prisma.conversation.findFirst({
      where: {
        customerId: booking.customerId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
      },
      include: this.conversationInclude,
    });

    if (existingByService) {
      const updated = await this.prisma.conversation.update({
        where: { id: existingByService.id },
        data: { bookingId: booking.id },
        include: this.conversationInclude,
      });
      return this.toConversationResponse(updated);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        bookingId: booking.id,
        serviceId: booking.serviceId,
        customerId: booking.customerId,
        providerId: booking.providerId,
      },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(conversation);
  }

  async getHistory(
    conversationId: number,
    userId: number,
    cursor?: number,
    limit = 50,
  ) {
    // Kiểm tra user thuộc conversation
    const convo = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ customerId: userId }, { providerId: userId }],
      },
    });
    if (!convo) return { data: [] };

    const where: Prisma.MessageWhereInput = { conversationId };
    if (cursor) where.id = { lt: cursor };

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { id: 'desc' },
      take: limit,
    });

    return { data: messages.reverse() };
  }

  async createMessage(
    conversationId: number,
    senderId: number | null,
    senderType: SenderType,
    content: string,
    messageType: string = 'TEXT',
    imageUrl?: string,
  ) {
    const message = await this.prisma.message.create({
      data: { conversationId, senderId, senderType, content, messageType, imageUrl },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async recallMessage(messageId: number, userId: number) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        senderType: { in: [SenderType.CUSTOMER, SenderType.PROVIDER] },
        recalledAt: null,
      },
      include: {
        conversation: {
          select: { id: true, customerId: true, providerId: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException({
        message: 'Tin nhắn không tồn tại hoặc không thể thu hồi',
      });
    }

    const recallWindowMs = 5 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > recallWindowMs) {
      throw new BadRequestException({
        message: 'Chỉ có thể thu hồi tin nhắn trong 5 phút sau khi gửi',
      });
    }

    const recalled = await this.prisma.message.update({
      where: { id: message.id },
      data: {
        recalledAt: new Date(),
        content: 'Tin nhắn đã được thu hồi',
        imageUrl: null,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: message.conversationId },
      data: { updatedAt: new Date() },
    });

    this.eventEmitter.emit('chat.message.recalled', recalled);

    return recalled;
  }

  async markAsRead(conversationId: number, userId: number) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ customerId: userId }, { providerId: userId }],
      },
      include: this.conversationInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return { data: conversations.map((c) => this.toConversationResponse(c)) };
  }

  async getSmartReplies(conversationId: number, userId: number) {
    // Check if user is in conversation
    const convo = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ customerId: userId }, { providerId: userId }],
      },
    });
    if (!convo) return { data: [] };

    // Get last 3 messages
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { id: 'desc' },
      take: 3,
    });

    if (messages.length === 0) {
      return {
        data: [
          'Xin chào!',
          'Mình có thể giúp gì cho bạn?',
          'Bạn cần hỗ trợ gì ạ?',
        ],
      };
    }

    const messageTexts = messages.reverse().map((m) => m.content);
    const replies = await this.aiService.suggestReplies(messageTexts);

    return {
      data: replies.length > 0 ? replies : ['Vâng ạ', 'Dạ được', 'Xin cảm ơn'],
    };
  }
}
