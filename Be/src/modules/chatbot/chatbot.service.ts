import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BookingStatus,
  Prisma,
  ServiceStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { BookingLifecycleService } from '../bookings/booking-lifecycle.service';
import { BookingQueryService } from '../bookings/booking-query.service';
import { ChatsService } from '../chats/chats.service';
import { ServicesService } from '../services/services.service';
import { calculateHaversineDistance } from '../../shared/utils/geo';
import { ChatbotIntentService } from './chatbot-intent.service';
import { ChatbotPersistenceService } from './chatbot-persistence.service';
import { ChatbotDraftService } from './chatbot-draft.service';
import { ChatbotFormatterService } from './chatbot-formatter.service';
import type {
  BookingDraft,
  ChatbotAction,
  ChatbotAskRequest,
  ChatbotCitation,
  ChatbotPageContext,
  ChatbotQuickReply,
  ChatbotStreamResultRequest,
  ChatResponse,
  ChatServiceResult,
  ChatbotSessionState,
  DetectedChatbotIntent,
  SessionContext,
  StoredChatbotAction,
} from './chatbot.types';

const districtCoords: Record<string, { lat: number; lng: number }> = {
  // TP.HCM
  'Quận 1': { lat: 10.7769, lng: 106.7009 },
  'Quận 2': { lat: 10.7872, lng: 106.7498 },
  'Quận 3': { lat: 10.7794, lng: 106.6816 },
  'Quận 4': { lat: 10.758, lng: 106.7067 },
  'Quận 5': { lat: 10.7541, lng: 106.6631 },
  'Quận 6': { lat: 10.7483, lng: 106.6358 },
  'Quận 7': { lat: 10.7327, lng: 106.7268 },
  'Quận 8': { lat: 10.7236, lng: 106.6346 },
  'Quận 9': { lat: 10.8428, lng: 106.8286 },
  'Quận 10': { lat: 10.7746, lng: 106.6669 },
  'Quận 11': { lat: 10.7629, lng: 106.6508 },
  'Quận 12': { lat: 10.8671, lng: 106.6413 },
  'Quận Bình Thạnh': { lat: 10.8106, lng: 106.7091 },
  'Quận Gò Vấp': { lat: 10.8388, lng: 106.6657 },
  'Thành phố Thủ Đức': { lat: 10.8494, lng: 106.7716 },
  'Quận Phú Nhuận': { lat: 10.7992, lng: 106.6803 },
  'Quận Tân Bình': { lat: 10.8014, lng: 106.6525 },
  'Quận Tân Phú': { lat: 10.7923, lng: 106.6183 },
  'Quận Bình Tân': { lat: 10.7656, lng: 106.5813 },
  'Huyện Củ Chi': { lat: 10.985, lng: 106.4984 },
  'Huyện Hóc Môn': { lat: 10.8854, lng: 106.591 },
  'Huyện Nhà Bè': { lat: 10.6661, lng: 106.7317 },
  'Huyện Bình Chánh': { lat: 10.6875, lng: 106.5938 },
  'Huyện Cần Giờ': { lat: 10.5083, lng: 106.8635 },
  // Hà Nội
  'Quận Hoàn Kiếm': { lat: 21.0285, lng: 105.8522 },
  'Quận Ba Đình': { lat: 21.0362, lng: 105.829 },
  'Quận Tây Hồ': { lat: 21.0718, lng: 105.8227 },
  'Quận Cầu Giấy': { lat: 21.0358, lng: 105.7952 },
  'Quận Đống Đa': { lat: 21.0122, lng: 105.828 },
  'Quận Hai Bà Trưng': { lat: 21.0102, lng: 105.8573 },
  'Quận Hoàng Mai': { lat: 20.9704, lng: 105.845 },
  'Quận Long Biên': { lat: 21.0428, lng: 105.8943 },
  'Quận Thanh Xuân': { lat: 20.9938, lng: 105.8048 },
};

const serviceCardInclude = {
  category: { select: { id: true, name: true } },
  provider: {
    select: { id: true, fullName: true, avatarUrl: true, status: true },
  },
  images: {
    select: { id: true, imageUrl: true },
    orderBy: { displayOrder: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.ServiceInclude;

type ServiceWithRelations = Prisma.ServiceGetPayload<{
  include: typeof serviceCardInclude;
}>;

type UserAddressRecord = Prisma.UserAddressGetPayload<object>;

type ServiceWithGeo = ServiceWithRelations & {
  distanceKm?: number;
  providerAddress?: string;
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly bookingLifecycleService: BookingLifecycleService,
    private readonly bookingQueryService: BookingQueryService,
    private readonly chatsService: ChatsService,
    private readonly servicesService: ServicesService,
    private readonly persistence: ChatbotPersistenceService,
    private readonly intentService: ChatbotIntentService,
    private readonly draftService: ChatbotDraftService,
    private readonly formatter: ChatbotFormatterService,
  ) {}

  async askQuestion(
    userId: number | undefined,
    input: ChatbotAskRequest | string,
    legacyHistory: Array<{ role: string; content: string }> = [],
  ): Promise<ChatResponse> {
    const request: ChatbotAskRequest =
      typeof input === 'string'
        ? { message: input, history: legacyHistory }
        : input || {};

    const message = (request.message || '').trim();
    const session = await this.persistence.resolveSession(
      userId,
      request.sessionId,
      message,
    );

    try {
      let response: ChatResponse;

      if (request.confirmedActionId) {
        response = await this.executeConfirmedAction(
          userId,
          session,
          request.confirmedActionId,
        );
      } else {
        if (!message) {
          response = this.withSession(session, {
            reply:
              'Bạn muốn tôi tìm dịch vụ, so sánh lựa chọn, tạo lịch đặt hay tra cứu đơn hàng?',
            services: [],
            quickReplies: this.formatter.defaultQuickReplies(),
            confidence: 0.7,
            citations: [],
          });
        } else if (this.intentService.isCancelDraftMessage(message)) {
          delete session.state.bookingDraft;
          session.state.pendingActions = {};
          response = this.withSession(session, {
            reply:
              'Tôi đã hủy nháp và các thao tác đang chờ xác nhận trong phiên chat này.',
            services: [],
            quickReplies: this.formatter.defaultQuickReplies(),
            confidence: 1,
            citations: [],
          });
        } else {
          const intent = this.intentService.detectIntent(message);
          const customerCoords = await this.getCustomerCoords(
            userId,
            message,
            request.pageContext,
          );
          response = await this.handleIntent(
            userId,
            session,
            message,
            request.history || [],
            request.pageContext,
            intent,
            customerCoords,
          );
        }
      }

      await this.persistence.persistTurn(session, message, response);
      return response;
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Chatbot error: ${messageText}`);

      let userFriendlyReply =
        'Tôi đang gặp lỗi kết nối. Bạn thử lại sau vài giây.';
      const exceptionMessage = this.getExceptionResponseMessage(error);
      if (exceptionMessage) {
        userFriendlyReply = exceptionMessage;
      } else if (
        error instanceof Error &&
        !(error instanceof Prisma.PrismaClientKnownRequestError)
      ) {
        userFriendlyReply = error.message;
      }

      const response = this.withSession(session, {
        reply: userFriendlyReply,
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.2,
        citations: [],
      });
      await this.persistence.persistTurn(session, message, response);
      return response;
    }
  }

  async persistStreamResult(
    userId: number | undefined,
    input: ChatbotStreamResultRequest,
  ) {
    return this.persistence.persistStreamResult(userId, input);
  }

  /**
   * Xử lý logic nghiệp vụ (detect intent, tìm dịch vụ, resolve session, tạo booking draft)
   * mà KHÔNG gọi AI. Trả về context + structured data để NextJS streaming route sử dụng.
   */
  async prepareContext(
    userId: number | undefined,
    input: ChatbotAskRequest,
  ): Promise<{
    needsAiStream: boolean;
    systemPrompt: string;
    serviceContext: string;
    sessionId: string;
    reply?: string;
    services: ChatServiceResult[];
    quickReplies: ChatbotQuickReply[];
    action?: ChatbotAction;
    confidence: number;
    citations: ChatbotCitation[];
  }> {
    const message = (input.message || '').trim();
    const session = await this.persistence.resolveSession(
      userId,
      input.sessionId,
      message,
    );

    const baseResult = {
      sessionId: session.id,
      services: [] as ChatServiceResult[],
      quickReplies: [] as ChatbotQuickReply[],
      confidence: 0.7,
      citations: [] as ChatbotCitation[],
      needsAiStream: false,
      systemPrompt: '',
      serviceContext: '',
    };

    // Xử lý confirmed action — không cần stream
    if (input.confirmedActionId) {
      const response = await this.executeConfirmedAction(
        userId,
        session,
        input.confirmedActionId,
      );
      await this.persistence.persistTurn(session, message, response);
      return {
        ...baseResult,
        ...response,
        needsAiStream: false,
        reply: response.reply,
      };
    }

    // Tin nhắn trống
    if (!message) {
      const reply =
        'Bạn muốn tôi tìm dịch vụ, so sánh lựa chọn, tạo lịch đặt hay tra cứu đơn hàng?';
      const quickReplies = this.formatter.defaultQuickReplies();
      const response = this.withSession(session, {
        reply,
        services: [],
        quickReplies,
        confidence: 0.7,
        citations: [],
      });
      await this.persistence.persistTurn(session, message, response);
      return { ...baseResult, reply, quickReplies, needsAiStream: false };
    }

    // Hủy nháp
    if (this.intentService.isCancelDraftMessage(message)) {
      delete session.state.bookingDraft;
      session.state.pendingActions = {};
      const reply =
        'Tôi đã hủy nháp và các thao tác đang chờ xác nhận trong phiên chat này.';
      const quickReplies = this.formatter.defaultQuickReplies();
      const response = this.withSession(session, {
        reply,
        services: [],
        quickReplies,
        confidence: 1,
        citations: [],
      });
      await this.persistence.persistTurn(session, message, response);
      return {
        ...baseResult,
        reply,
        quickReplies,
        confidence: 1,
        needsAiStream: false,
      };
    }

    const intent = this.intentService.detectIntent(message);
    const customerCoords = await this.getCustomerCoords(
      userId,
      message,
      input.pageContext,
    );

    // Các intent không cần AI stream — xử lý trực tiếp
    if (intent.name !== 'search') {
      const response = await this.handleIntent(
        userId,
        session,
        message,
        input.history || [],
        input.pageContext,
        intent,
        customerCoords,
      );
      await this.persistence.persistTurn(session, message, response);
      return {
        ...baseResult,
        ...response,
        needsAiStream: false,
        reply: response.reply,
      };
    }

    // Intent 'search' — cần AI stream
    const services = await this.findRelevantServices(
      message,
      input.pageContext,
      customerCoords,
    );
    const serviceCards = services.map((s) => this.formatter.toServiceCard(s));

    if (services.length === 0) {
      const reply =
        'Tôi chưa tìm thấy dịch vụ phù hợp trong hệ thống. Bạn có thể mô tả cụ thể hơn, ví dụ "máy lạnh chảy nước", "ổ điện bị chập" hoặc "dọn nhà cuối tuần".';
      const quickReplies = this.formatter.defaultQuickReplies();
      const response = this.withSession(session, {
        reply,
        services: [],
        quickReplies,
        confidence: 0.45,
        citations: [],
      });
      await this.persistence.persistTurn(session, message, response);
      return {
        ...baseResult,
        reply,
        quickReplies,
        confidence: 0.45,
        needsAiStream: false,
      };
    }

    const context = this.formatter.buildServiceContext(services);
    const systemPrompt =
      'Bạn là trợ lý ảo của HomeService Marketplace. Trả lời tiếng Việt ngắn gọn, rõ ràng, không bịa dữ liệu. ' +
      'Chỉ nhắc tới dịch vụ, giá, nhà cung cấp, trạng thái nếu có trong dữ liệu hệ thống bên dưới. ' +
      'Hãy tư vấn dựa trên danh sách dịch vụ thật. Nếu phù hợp, hỏi thêm thời gian hoặc địa chỉ để tạo nháp đặt lịch.\n\n' +
      `Dữ liệu hệ thống:\n${context}`;

    return {
      needsAiStream: true,
      systemPrompt,
      serviceContext: context,
      sessionId: session.id,
      services: serviceCards,
      quickReplies: [
        {
          label: 'So sánh các dịch vụ',
          message: 'So sánh các dịch vụ này giúp tôi',
        },
        { label: 'Tạo lịch đặt', message: 'Tôi muốn đặt lịch dịch vụ này' },
        {
          label: 'Chat với nhà cung cấp',
          message: 'Tôi muốn nhắn tin với nhà cung cấp',
        },
      ],
      confidence: intent.confidence,
      citations: serviceCards.map((s) => ({
        type: 'service' as const,
        id: s.id,
        label: s.name,
        href: `/services/${s.id}`,
      })),
    };
  }

  private async handleIntent(
    userId: number | undefined,
    session: SessionContext,
    message: string,
    history: Array<{ role: string; content: string }>,
    pageContext: ChatbotPageContext | undefined,
    intent: DetectedChatbotIntent,
    customerCoords?: { lat: number; lng: number },
  ): Promise<ChatResponse> {
    if (intent.name === 'smalltalk') {
      return this.withSession(session, {
        reply:
          'Tôi có thể giúp bạn tìm dịch vụ, so sánh nhà cung cấp, tạo nháp đặt lịch, mở chat với nhà cung cấp hoặc tra cứu đơn hàng.',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: intent.confidence,
        citations: [],
      });
    }

    if (intent.name === 'booking_status') {
      return this.handleBookingStatus(userId, session);
    }

    if (intent.name === 'rebook') {
      return this.handleRebook(userId, session, message, pageContext);
    }

    if (intent.name === 'open_chat') {
      return this.handleOpenProviderChat(
        userId,
        session,
        message,
        pageContext,
        customerCoords,
      );
    }

    const services = await this.findRelevantServices(
      message,
      pageContext,
      customerCoords,
    );

    if (intent.name === 'compare') {
      return this.handleCompare(session, services, intent.confidence);
    }

    if (intent.name === 'create_booking') {
      return this.handleCreateBookingDraft(
        userId,
        session,
        message,
        pageContext,
        services,
        intent.confidence,
      );
    }

    return this.handleSearchAdvice(
      session,
      message,
      history,
      services,
      intent.confidence,
    );
  }

  private async handleSearchAdvice(
    session: SessionContext,
    message: string,
    history: Array<{ role: string; content: string }>,
    services: ServiceWithRelations[],
    confidence: number,
  ): Promise<ChatResponse> {
    const serviceCards = services.map((service) =>
      this.formatter.toServiceCard(service),
    );

    if (services.length === 0) {
      return this.withSession(session, {
        reply:
          'Tôi chưa tìm thấy dịch vụ phù hợp trong hệ thống. Bạn có thể mô tả cụ thể hơn, ví dụ "máy lạnh chảy nước", "ổ điện bị chập" hoặc "dọn nhà cuối tuần".',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.45,
        citations: [],
      });
    }

    const context = this.formatter.buildServiceContext(services);
    const aiReply = await this.aiService.chat(
      `${message}\n\nHãy tư vấn dựa trên danh sách dịch vụ thật. Nếu phù hợp, hỏi thêm thời gian hoặc địa chỉ để tạo nháp đặt lịch.`,
      context,
      history,
    );

    const reply = aiReply.includes('hệ thống AI đang bận')
      ? `Tôi tìm thấy ${services.length} dịch vụ phù hợp. Bạn có thể xem các thẻ bên dưới, hoặc nhắn "so sánh" / "đặt lịch" để tôi hỗ trợ bước tiếp theo.`
      : aiReply;

    return this.withSession(session, {
      reply,
      services: serviceCards,
      quickReplies: [
        {
          label: 'So sánh các dịch vụ',
          message: 'So sánh các dịch vụ này giúp tôi',
        },
        { label: 'Tạo lịch đặt', message: 'Tôi muốn đặt lịch dịch vụ này' },
        {
          label: 'Chat với nhà cung cấp',
          message: 'Tôi muốn nhắn tin với nhà cung cấp',
        },
      ],
      confidence,
      citations: serviceCards.map((service) => ({
        type: 'service',
        id: service.id,
        label: service.name,
        href: `/services/${service.id}`,
      })),
    });
  }

  private handleCompare(
    session: SessionContext,
    services: ServiceWithRelations[],
    confidence: number,
  ): ChatResponse {
    const serviceCards = services
      .slice(0, 5)
      .map((service) => this.formatter.toServiceCard(service));

    if (serviceCards.length < 2) {
      return this.withSession(session, {
        reply:
          'Tôi cần ít nhất 2 dịch vụ để so sánh. Bạn hãy nói rõ nhóm dịch vụ cần tìm, ví dụ "so sánh dịch vụ vệ sinh máy lạnh".',
        services: serviceCards,
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.45,
        citations: [],
      });
    }

    const lines = serviceCards.map(
      (service, index) =>
        `${index + 1}. ${service.name}: ${this.formatter.formatPrice(service.referencePrice)}, đánh giá ${service.avgRating.toFixed(1)}/5, nhà cung cấp ${service.providerName}.`,
    );

    return this.withSession(session, {
      reply: `So sánh nhanh:\n${lines.join('\n')}\n\nNếu ưu tiên an toàn, hãy chọn dịch vụ có đánh giá cao và nhiều lượt đánh giá. Nếu ưu tiên chi phí, chọn mức giá tham khảo thấp hơn rồi chat để hỏi thêm phạm vi công việc.`,
      services: serviceCards,
      quickReplies: [
        {
          label: 'Đặt dịch vụ phù hợp',
          message: 'Tôi muốn đặt dịch vụ phù hợp nhất',
        },
        {
          label: 'Chat nhà cung cấp',
          message: 'Tôi muốn nhắn tin với nhà cung cấp',
        },
      ],
      confidence,
      citations: serviceCards.map((service) => ({
        type: 'service',
        id: service.id,
        label: service.name,
        href: `/services/${service.id}`,
      })),
    });
  }

  private async handleCreateBookingDraft(
    userId: number | undefined,
    session: SessionContext,
    message: string,
    pageContext: ChatbotPageContext | undefined,
    services: ServiceWithRelations[],
    confidence: number,
  ): Promise<ChatResponse> {
    const serviceCards = services.map((service) =>
      this.formatter.toServiceCard(service),
    );

    if (!userId) {
      return this.withSession(session, {
        reply:
          'Tôi có thể tư vấn dịch vụ trước. Để tạo lịch đặt hoặc tra cứu đơn, bạn cần đăng nhập bằng tài khoản khách hàng.',
        services: serviceCards,
        quickReplies: [
          {
            label: 'Xem dịch vụ phù hợp',
            message: 'Tìm dịch vụ phù hợp cho tôi',
          },
        ],
        confidence: 0.75,
        citations: [],
      });
    }

    await this.ensureCustomer(userId);

    const selectedServiceId = this.resolveServiceId(
      message,
      pageContext,
      services,
    );
    const defaultAddress = await this.getDefaultAddress(userId);
    const currentDraft = session.state.bookingDraft || {};
    const draft: BookingDraft = {
      ...currentDraft,
      serviceId: selectedServiceId || currentDraft.serviceId,
      description:
        this.extractProblemDescription(message) || currentDraft.description,
      desiredTime:
        this.draftService.parseDesiredTime(message) || currentDraft.desiredTime,
      province: currentDraft.province || defaultAddress?.province,
      district: currentDraft.district || defaultAddress?.district,
      ward: currentDraft.ward || defaultAddress?.ward,
      addressDetail:
        currentDraft.addressDetail || defaultAddress?.addressDetail,
    };
    session.state.bookingDraft = draft;

    const missing = this.draftService.getDraftMissingFields(draft);
    if (missing.length > 0) {
      return this.withSession(session, {
        reply: this.draftService.composeDraftMissingReply(
          missing,
          serviceCards,
        ),
        services: serviceCards,
        quickReplies: this.draftService.draftQuickReplies(missing),
        action: this.createDraftAction(session, draft),
        confidence,
        citations: serviceCards.map((service) => ({
          type: 'service',
          id: service.id,
          label: service.name,
          href: `/services/${service.id}`,
        })),
      });
    }

    const service = await this.getActiveServiceOrThrow(draft.serviceId!);
    const action = this.rememberAction(session.state, {
      type: 'CONFIRM_CREATE_BOOKING',
      label: 'Xác nhận đặt lịch',
      summary: `Đặt "${service.name}" vào ${this.formatter.formatDate(draft.desiredTime!)} tại ${draft.addressDetail}, ${draft.ward}, ${draft.district}, ${draft.province}.`,
      payload: { draft },
      requiresConfirmation: true,
    });

    return this.withSession(session, {
      reply:
        `Tôi đã chuẩn bị nháp đặt lịch cho dịch vụ "${service.name}". ` +
        `Thời gian mong muốn: ${this.formatter.formatDate(draft.desiredTime!)}. ` +
        `Địa chỉ: ${draft.addressDetail}, ${draft.ward}, ${draft.district}, ${draft.province}. ` +
        'Bạn kiểm tra lại rồi bấm xác nhận để tạo đơn.',
      services: [this.formatter.toServiceCard(service)],
      quickReplies: [
        { label: 'Đổi thời gian', message: 'Tôi muốn đổi thời gian đặt lịch' },
      ],
      action,
      confidence: 0.92,
      citations: [
        {
          type: 'service',
          id: service.id,
          label: service.name,
          href: `/services/${service.id}`,
        },
      ],
    });
  }

  private async handleBookingStatus(
    userId: number | undefined,
    session: SessionContext,
  ): Promise<ChatResponse> {
    if (!userId) {
      return this.withSession(session, {
        reply: 'Bạn cần đăng nhập để tôi tra cứu đơn hàng của bạn.',
        services: [],
        quickReplies: [
          { label: 'Tìm dịch vụ', message: 'Tìm dịch vụ phù hợp cho tôi' },
        ],
        confidence: 0.75,
        citations: [],
      });
    }

    const result = await this.bookingQueryService.getMyBookings(
      userId,
      'customer',
      undefined,
      1,
      5,
    );
    const bookings = result.data;

    if (bookings.length === 0) {
      return this.withSession(session, {
        reply:
          'Bạn chưa có đơn hàng nào. Tôi có thể giúp bạn tìm dịch vụ và tạo nháp đặt lịch.',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.85,
        citations: [],
      });
    }

    const lines = bookings.map(
      (booking) =>
        `#${booking.bookingCode}: ${booking.service?.name || 'Dịch vụ'} - ${this.formatter.statusLabel(booking.status)}. Nhà cung cấp: ${booking.provider?.fullName || 'chưa rõ'}.`,
    );
    const latest = bookings[0];

    return this.withSession(session, {
      reply:
        `Đây là các đơn gần nhất của bạn:\n${lines.join('\n')}\n\n` +
        `Đơn mới nhất #${latest.bookingCode}: ${this.formatter.nextStepForStatus(latest.status)}.`,
      services: [],
      quickReplies: [
        {
          label: 'Xem đơn mới nhất',
          message: `Xem chi tiết đơn ${latest.bookingCode}`,
        },
        {
          label: 'Đặt lại dịch vụ',
          message: `Tôi muốn đặt lại đơn ${latest.bookingCode}`,
        },
      ],
      action: {
        id: `view-booking-${latest.id}`,
        type: 'VIEW_BOOKING',
        label: 'Xem chi tiết đơn',
        summary: `Mở đơn #${latest.bookingCode}`,
        payload: { bookingId: latest.id },
        requiresConfirmation: false,
        href: `/bookings/${latest.id}`,
      },
      confidence: 0.9,
      citations: bookings.map((booking) => ({
        type: 'booking',
        id: booking.id,
        label: `Đơn #${booking.bookingCode}`,
        href: `/bookings/${booking.id}`,
      })),
    });
  }

  private async handleOpenProviderChat(
    userId: number | undefined,
    session: SessionContext,
    message: string,
    pageContext: ChatbotPageContext | undefined,
    customerCoords?: { lat: number; lng: number },
  ): Promise<ChatResponse> {
    if (!userId) {
      return this.withSession(session, {
        reply: 'Bạn cần đăng nhập để mở cuộc trò chuyện với nhà cung cấp.',
        services: [],
        quickReplies: [
          { label: 'Tìm dịch vụ', message: 'Tìm dịch vụ phù hợp cho tôi' },
        ],
        confidence: 0.75,
        citations: [],
      });
    }

    await this.ensureCustomer(userId);

    const services = await this.findRelevantServices(
      message,
      pageContext,
      customerCoords,
    );
    const serviceId = this.resolveServiceId(message, pageContext, services);

    if (!serviceId) {
      return this.withSession(session, {
        reply:
          'Bạn muốn chat với nhà cung cấp của dịch vụ nào? Hãy mở trang chi tiết dịch vụ hoặc nhắn tên dịch vụ cụ thể.',
        services: services.map((service) =>
          this.formatter.toServiceCard(service),
        ),
        quickReplies: [
          { label: 'Tìm dịch vụ', message: 'Tìm dịch vụ phù hợp cho tôi' },
        ],
        confidence: 0.65,
        citations: [],
      });
    }

    const service = await this.getActiveServiceOrThrow(serviceId);
    const action = this.rememberAction(session.state, {
      type: 'OPEN_PROVIDER_CHAT',
      label: 'Mở chat',
      summary: `Mở cuộc trò chuyện với nhà cung cấp của "${service.name}".`,
      payload: { serviceId },
      requiresConfirmation: true,
    });

    return this.withSession(session, {
      reply: `Tôi có thể mở chat với nhà cung cấp của dịch vụ "${service.name}". Bạn bấm xác nhận để tạo/mở cuộc trò chuyện.`,
      services: [this.formatter.toServiceCard(service)],
      quickReplies: [
        { label: 'Đặt lịch luôn', message: 'Tôi muốn đặt lịch dịch vụ này' },
      ],
      action,
      confidence: 0.9,
      citations: [
        {
          type: 'service',
          id: service.id,
          label: service.name,
          href: `/services/${service.id}`,
        },
      ],
    });
  }

  private async handleRebook(
    userId: number | undefined,
    session: SessionContext,
    message: string,
    pageContext: ChatbotPageContext | undefined,
  ): Promise<ChatResponse> {
    if (!userId) {
      return this.withSession(session, {
        reply: 'Bạn cần đăng nhập để đặt lại đơn hàng.',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.75,
        citations: [],
      });
    }

    await this.ensureCustomer(userId);
    const booking = await this.findBookingForRebook(
      userId,
      message,
      pageContext,
    );

    if (!booking) {
      return this.withSession(session, {
        reply:
          'Tôi chưa xác định được đơn cần đặt lại. Bạn hãy mở chi tiết đơn hoặc nhắn mã đơn, ví dụ "đặt lại đơn BK123".',
        services: [],
        quickReplies: [
          { label: 'Tra cứu đơn', message: 'Đơn của tôi tới đâu rồi?' },
        ],
        confidence: 0.55,
        citations: [],
      });
    }

    const action = this.rememberAction(session.state, {
      type: 'REBOOK',
      label: 'Xác nhận đặt lại',
      summary: `Đặt lại đơn #${booking.bookingCode} cho dịch vụ "${booking.service.name}".`,
      payload: { bookingId: booking.id },
      requiresConfirmation: true,
    });

    return this.withSession(session, {
      reply: `Tôi sẽ tạo đơn mới dựa trên đơn #${booking.bookingCode} (${booking.service.name}) và thời gian mặc định là ngày mai. Bạn bấm xác nhận để đặt lại.`,
      services: [this.formatter.toServiceCard(booking.service)],
      quickReplies: [
        { label: 'Tra cứu đơn', message: 'Đơn của tôi tới đâu rồi?' },
      ],
      action,
      confidence: 0.88,
      citations: [
        {
          type: 'booking',
          id: booking.id,
          label: `Đơn #${booking.bookingCode}`,
          href: `/bookings/${booking.id}`,
        },
      ],
    });
  }

  private async executeConfirmedAction(
    userId: number | undefined,
    session: SessionContext,
    actionId: string,
  ): Promise<ChatResponse> {
    const action = session.state.pendingActions?.[actionId];

    if (!action) {
      return this.withSession(session, {
        reply:
          'Hành động này đã hết hạn hoặc không còn trong phiên chat. Bạn hãy yêu cầu lại để tôi chuẩn bị thao tác mới.',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.5,
        citations: [],
      });
    }

    if (!userId) {
      return this.withSession(session, {
        reply: 'Bạn cần đăng nhập trước khi xác nhận thao tác này.',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 0.7,
        citations: [],
      });
    }

    await this.ensureCustomer(userId);

    if (action.type === 'CONFIRM_CREATE_BOOKING') {
      const draft = action.payload.draft as BookingDraft;
      if (draft?.desiredTime) {
        const desiredDate = new Date(draft.desiredTime);
        const minDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // Hiện tại + 2 tiếng
        if (
          isNaN(desiredDate.getTime()) ||
          desiredDate.getTime() < minDate.getTime()
        ) {
          throw new BadRequestException(
            'Thời gian đặt lịch không hợp lệ hoặc phải sau ít nhất 2 giờ tính từ thời điểm hiện tại.',
          );
        }
      }
      const dto = this.draftService.toCreateBookingDto(draft);
      const result = await this.bookingLifecycleService.create(userId, dto);
      const booking = result.data;
      if (!booking) {
        throw new BadRequestException('Không thể tạo đặt lịch');
      }
      delete session.state.pendingActions?.[actionId];
      delete session.state.bookingDraft;

      return this.withSession(session, {
        reply: `Đã tạo đơn #${booking.bookingCode}. Nhà cung cấp sẽ nhận thông báo và phản hồi báo giá/xác nhận khảo sát.`,
        services: [],
        quickReplies: [
          {
            label: 'Xem đơn hàng',
            message: `Xem chi tiết đơn ${booking.bookingCode}`,
          },
          { label: 'Mở chat', message: 'Tôi muốn nhắn tin với nhà cung cấp' },
        ],
        action: {
          id: `view-booking-${booking.id}`,
          type: 'VIEW_BOOKING',
          label: 'Xem đơn hàng',
          summary: `Mở đơn #${booking.bookingCode}`,
          payload: { bookingId: booking.id },
          requiresConfirmation: false,
          href: `/bookings/${booking.id}`,
        },
        confidence: 1,
        citations: [
          {
            type: 'booking',
            id: booking.id,
            label: `Đơn #${booking.bookingCode}`,
            href: `/bookings/${booking.id}`,
          },
        ],
      });
    }

    if (action.type === 'OPEN_PROVIDER_CHAT') {
      const serviceId = Number(action.payload.serviceId);
      const result = await this.chatsService.getOrCreateConversationForUser(
        userId,
        UserRole.CUSTOMER,
        { serviceId },
      );
      const conversation = result.data;
      delete session.state.pendingActions?.[actionId];

      return this.withSession(session, {
        reply:
          'Đã mở cuộc trò chuyện với nhà cung cấp. Bạn có thể hỏi thêm phạm vi công việc, thời gian và báo giá.',
        services: [],
        quickReplies: [
          { label: 'Tạo lịch đặt', message: 'Tôi muốn đặt lịch dịch vụ này' },
        ],
        action: {
          id: `open-chat-${conversation.id}`,
          type: 'OPEN_PROVIDER_CHAT',
          label: 'Vào chat',
          summary: 'Mở trang chat với nhà cung cấp',
          payload: { conversationId: conversation.id },
          requiresConfirmation: false,
          href: `/chat?conversationId=${conversation.id}`,
        },
        confidence: 1,
        citations: [],
      });
    }

    if (action.type === 'REBOOK') {
      const bookingId = Number(action.payload.bookingId);
      const result = await this.bookingLifecycleService.rebook(
        userId,
        bookingId,
      );
      const booking = result.data;
      if (!booking) {
        throw new BadRequestException('Không thể đặt lại đơn');
      }
      delete session.state.pendingActions?.[actionId];

      return this.withSession(session, {
        reply: `Đã tạo đơn đặt lại #${booking.bookingCode}.`,
        services: [],
        quickReplies: [
          {
            label: 'Xem đơn mới',
            message: `Xem chi tiết đơn ${booking.bookingCode}`,
          },
        ],
        action: {
          id: `view-booking-${booking.id}`,
          type: 'VIEW_BOOKING',
          label: 'Xem đơn mới',
          summary: `Mở đơn #${booking.bookingCode}`,
          payload: { bookingId: booking.id },
          requiresConfirmation: false,
          href: `/bookings/${booking.id}`,
        },
        confidence: 1,
        citations: [
          {
            type: 'booking',
            id: booking.id,
            label: `Đơn #${booking.bookingCode}`,
            href: `/bookings/${booking.id}`,
          },
        ],
      });
    }

    if (action.type === 'CANCEL_BOOKING_DRAFT') {
      delete session.state.pendingActions?.[actionId];
      delete session.state.bookingDraft;
      return this.withSession(session, {
        reply: 'Tôi đã hủy nháp đặt lịch trong phiên chat này.',
        services: [],
        quickReplies: this.formatter.defaultQuickReplies(),
        confidence: 1,
        citations: [],
      });
    }

    throw new BadRequestException('Action không được hỗ trợ');
  }

  private async findRelevantServices(
    query: string,
    pageContext?: ChatbotPageContext,
    customerCoords?: { lat: number; lng: number },
  ): Promise<
    (ServiceWithRelations & { distanceKm?: number; providerAddress?: string })[]
  > {
    const results: ServiceWithRelations[] = [];
    const contextServiceId = this.intentService.parsePositiveInt(
      pageContext?.serviceId,
    );

    if (contextServiceId) {
      const service = await this.prisma.service.findFirst({
        where: {
          id: contextServiceId,
          status: ServiceStatus.ACTIVE,
          isDeleted: false,
          provider: {
            status: UserStatus.ACTIVE,
          },
        },
        include: serviceCardInclude,
      });
      if (service) results.push(service);
    }

    if (query.trim()) {
      try {
        const aiResult = await this.servicesService.aiSearch(query);
        const ids: number[] = (aiResult.data || [])
          .map((item: { id?: number }) => Number(item.id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
          .slice(0, 8);

        if (ids.length > 0) {
          const hydrated = await this.prisma.service.findMany({
            where: {
              id: { in: ids },
              status: ServiceStatus.ACTIVE,
              isDeleted: false,
              provider: {
                status: UserStatus.ACTIVE,
              },
            },
            include: serviceCardInclude,
          });
          const order = new Map<number, number>(
            ids.map((id: number, index: number) => [id, index]),
          );
          results.push(
            ...hydrated.sort(
              (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
            ),
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Semantic service search failed: ${message}`);
      }

      if (results.length < 3) {
        const keywords = this.extractKeywords(query);
        const fallback = await this.prisma.service.findMany({
          where: {
            status: ServiceStatus.ACTIVE,
            isDeleted: false,
            provider: {
              status: UserStatus.ACTIVE,
            },
            OR:
              keywords.length > 0
                ? keywords.map((keyword) => ({
                    OR: [
                      {
                        name: {
                          contains: keyword,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                      {
                        description: {
                          contains: keyword,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                      {
                        category: {
                          name: {
                            contains: keyword,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    ],
                  }))
                : [
                    {
                      name: {
                        contains: query,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  ],
          },
          include: serviceCardInclude,
          orderBy: [{ avgRating: 'desc' }, { totalReviews: 'desc' }],
          take: 8,
        });
        results.push(...fallback);
      }
    }

    const unique = this.uniqueServices(results);
    const providerIds = Array.from(new Set(unique.map((s) => s.providerId)));
    const addresses = await this.prisma.userAddress.findMany({
      where: {
        userId: { in: providerIds },
      },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });

    const addressMap = new Map<number, UserAddressRecord>();
    for (const addr of addresses) {
      if (!addressMap.has(addr.userId)) {
        addressMap.set(addr.userId, addr);
      }
    }

    const servicesWithGeo = unique.map((service) => {
      const geoService: ServiceWithGeo = { ...service };
      const addr = addressMap.get(service.providerId);
      if (addr) {
        geoService.providerAddress = `${addr.addressDetail}, ${addr.ward}, ${addr.district}, ${addr.province}`;
        if (customerCoords && addr.latitude && addr.longitude) {
          geoService.distanceKm = calculateHaversineDistance(
            customerCoords.lat,
            customerCoords.lng,
            Number(addr.latitude),
            Number(addr.longitude),
          );
        }
      }
      return geoService;
    });

    if (customerCoords) {
      servicesWithGeo.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
    }

    return servicesWithGeo.slice(0, 5);
  }

  private async getActiveServiceOrThrow(serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, status: ServiceStatus.ACTIVE, isDeleted: false },
      include: serviceCardInclude,
    });
    if (!service) {
      throw new NotFoundException('Dịch vụ không khả dụng');
    }
    if (service.provider.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'Nhà cung cấp dịch vụ hiện đang bị khóa hoặc ngưng hoạt động.',
      );
    }
    return service;
  }

  private async getDefaultAddress(userId: number) {
    return this.prisma.userAddress.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
      select: {
        province: true,
        district: true,
        ward: true,
        addressDetail: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  private async ensureCustomer(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Tài khoản chưa sẵn sàng để dùng chatbot thao tác',
      );
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Customer AI Assistant chỉ hỗ trợ tài khoản khách hàng trong phiên bản này',
      );
    }
  }

  private async findBookingForRebook(
    userId: number,
    message: string,
    pageContext?: ChatbotPageContext,
  ) {
    const bookingId = this.intentService.parsePositiveInt(
      pageContext?.bookingId,
    );
    const bookingCode = this.intentService.extractBookingCode(message);

    return this.prisma.booking.findFirst({
      where: {
        customerId: userId,
        ...(bookingId
          ? { id: bookingId }
          : bookingCode
            ? { bookingCode }
            : {
                status: { in: [BookingStatus.DONE, BookingStatus.CANCELLED] },
              }),
      },
      include: {
        service: { include: serviceCardInclude },
      },
      orderBy: { id: 'desc' },
    });
  }

  private resolveServiceId(
    message: string,
    pageContext: ChatbotPageContext | undefined,
    services: ServiceWithRelations[],
  ): number | undefined {
    const contextId = this.intentService.parsePositiveInt(
      pageContext?.serviceId,
    );
    if (contextId) return contextId;

    const explicitId = this.intentService.extractServiceId(message);
    if (explicitId) return explicitId;

    const normalizedMessage = this.intentService.normalize(message);
    const exact = services.find((service) =>
      normalizedMessage.includes(this.intentService.normalize(service.name)),
    );
    if (exact) return exact.id;

    return services.length === 1 ? services[0].id : undefined;
  }

  private extractProblemDescription(message: string) {
    const normalized = this.intentService.normalize(message);
    if (normalized.length < 12) return undefined;
    return message.slice(0, 800);
  }

  private createDraftAction(session: SessionContext, draft: BookingDraft) {
    return this.rememberAction(session.state, {
      type: 'CREATE_BOOKING_DRAFT',
      label: 'Tiếp tục tạo nháp',
      summary: 'Nháp đặt lịch đang thiếu thông tin',
      payload: { draft },
      requiresConfirmation: false,
    });
  }

  private rememberAction(
    state: ChatbotSessionState,
    action: Omit<ChatbotAction, 'id'>,
  ): ChatbotAction {
    const id = `${action.type.toLowerCase()}-${randomUUID().slice(0, 8)}`;
    const stored: StoredChatbotAction = {
      id,
      ...action,
      createdAt: new Date().toISOString(),
    };

    const pendingActions = state.pendingActions || {};
    const recentEntries = Object.entries(pendingActions)
      .filter(
        ([, pending]) =>
          Date.now() - new Date(pending.createdAt).getTime() < 30 * 60 * 1000,
      )
      .slice(-4);
    state.pendingActions = Object.fromEntries(recentEntries);
    state.pendingActions[id] = stored;

    return {
      id: stored.id,
      type: stored.type,
      label: stored.label,
      summary: stored.summary,
      payload: stored.payload,
      requiresConfirmation: stored.requiresConfirmation,
      href: stored.href,
    };
  }

  private withSession(
    session: SessionContext,
    response: Omit<ChatResponse, 'sessionId'>,
  ): ChatResponse {
    return { sessionId: session.id, ...response };
  }

  private getExceptionResponseMessage(error: unknown): string | undefined {
    if (!this.isRecord(error) || !('response' in error)) return undefined;
    const response = error.response;
    if (typeof response === 'string') return response;
    if (!this.isRecord(response) || !('message' in response)) return undefined;

    const message = response.message;
    if (typeof message === 'string') return message;
    if (
      Array.isArray(message) &&
      message.length > 0 &&
      typeof message[0] === 'string'
    ) {
      return message[0];
    }
    return undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private uniqueServices(services: ServiceWithRelations[]) {
    const seen = new Set<number>();
    return services.filter((service) => {
      if (seen.has(service.id)) return false;
      seen.add(service.id);
      return true;
    });
  }

  private extractKeywords(message: string) {
    const stopwords = new Set([
      'toi',
      'minh',
      'ban',
      'cua',
      'va',
      'la',
      'co',
      'khong',
      'duoc',
      'nay',
      'cho',
      'voi',
      'cac',
      'mot',
      'nhung',
      'muon',
      'can',
      'tim',
      'kiem',
      'tho',
      'dich',
      'vu',
      'gia',
      'nhat',
      'tot',
      'gan',
      'ngay',
      'hom',
      'giup',
      'ho',
      'tro',
      'hoi',
      'dau',
      'nao',
      'gi',
      'sao',
      'lam',
    ]);

    return this.intentService
      .normalize(message)
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopwords.has(word))
      .slice(0, 8);
  }

  private async getCustomerCoords(
    userId: number | undefined,
    message: string,
    pageContext?: ChatbotPageContext,
  ): Promise<{ lat: number; lng: number } | undefined> {
    if (
      pageContext &&
      typeof pageContext.latitude === 'number' &&
      typeof pageContext.longitude === 'number'
    ) {
      return {
        lat: pageContext.latitude,
        lng: pageContext.longitude,
      };
    }

    if (userId) {
      const defaultAddress = await this.getDefaultAddress(userId);
      if (
        defaultAddress &&
        defaultAddress.latitude !== null &&
        defaultAddress.latitude !== undefined &&
        defaultAddress.longitude !== null &&
        defaultAddress.longitude !== undefined
      ) {
        return {
          lat: Number(defaultAddress.latitude),
          lng: Number(defaultAddress.longitude),
        };
      }
    }

    if (message) {
      const detectedDistrict =
        this.intentService.extractDistrictFromText(message);
      if (detectedDistrict && districtCoords[detectedDistrict]) {
        return districtCoords[detectedDistrict];
      }
    }

    return undefined;
  }
}
