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
import { BookingsService } from '../bookings/bookings.service';
import { ChatsService } from '../chats/chats.service';
import { ServicesService } from '../services/services.service';
import { CreateBookingDto } from '../bookings/dto/bookings.dto';
import { calculateHaversineDistance } from '../../shared/utils/geo';

const districtCoords: Record<string, { lat: number; lng: number }> = {
  // TP.HCM
  'Quận 1': { lat: 10.7769, lng: 106.7009 },
  'Quận 2': { lat: 10.7872, lng: 106.7498 },
  'Quận 3': { lat: 10.7794, lng: 106.6816 },
  'Quận 4': { lat: 10.7580, lng: 106.7067 },
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
  'Huyện Củ Chi': { lat: 10.9850, lng: 106.4984 },
  'Huyện Hóc Môn': { lat: 10.8854, lng: 106.5910 },
  'Huyện Nhà Bè': { lat: 10.6661, lng: 106.7317 },
  'Huyện Bình Chánh': { lat: 10.6875, lng: 106.5938 },
  'Huyện Cần Giờ': { lat: 10.5083, lng: 106.8635 },
  // Hà Nội
  'Quận Hoàn Kiếm': { lat: 21.0285, lng: 105.8522 },
  'Quận Ba Đình': { lat: 21.0362, lng: 105.8290 },
  'Quận Tây Hồ': { lat: 21.0718, lng: 105.8227 },
  'Quận Cầu Giấy': { lat: 21.0358, lng: 105.7952 },
  'Quận Đống Đa': { lat: 21.0122, lng: 105.8280 },
  'Quận Hai Bà Trưng': { lat: 21.0102, lng: 105.8573 },
  'Quận Hoàng Mai': { lat: 20.9704, lng: 105.8450 },
  'Quận Long Biên': { lat: 21.0428, lng: 105.8943 },
  'Quận Thanh Xuân': { lat: 20.9938, lng: 105.8048 },
};

const serviceCardInclude = {
  category: { select: { id: true, name: true } },
  provider: { select: { id: true, fullName: true, avatarUrl: true, status: true } },
  images: {
    select: { id: true, imageUrl: true },
    orderBy: { displayOrder: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.ServiceInclude;

type ServiceWithRelations = Prisma.ServiceGetPayload<{
  include: typeof serviceCardInclude;
}>;

type IntentName =
  | 'search'
  | 'compare'
  | 'create_booking'
  | 'booking_status'
  | 'open_chat'
  | 'rebook'
  | 'smalltalk';

export type ChatbotActionType =
  | 'CREATE_BOOKING_DRAFT'
  | 'CONFIRM_CREATE_BOOKING'
  | 'OPEN_PROVIDER_CHAT'
  | 'VIEW_BOOKING'
  | 'REBOOK'
  | 'CANCEL_BOOKING_DRAFT';

export interface ChatServiceResult {
  id: number;
  name: string;
  description?: string;
  referencePrice: number;
  providerId: number;
  providerName: string;
  avgRating: number;
  totalReviews: number;
  categoryName: string;
  imageUrl?: string;
  distanceKm?: number;
  providerAddress?: string;
}

export interface ChatbotQuickReply {
  label: string;
  message: string;
}

export interface ChatbotCitation {
  type: 'service' | 'booking';
  id: number;
  label: string;
  href?: string;
}

export interface ChatbotAction {
  id: string;
  type: ChatbotActionType;
  label: string;
  summary: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  href?: string;
}

type StoredAction = ChatbotAction & { createdAt: string };

type BookingDraft = {
  serviceId?: number;
  description?: string;
  desiredTime?: string;
  province?: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
};

type ChatbotSessionState = {
  bookingDraft?: BookingDraft;
  pendingActions?: Record<string, StoredAction>;
};

export interface ChatbotPageContext {
  path?: string;
  serviceId?: number | string;
  bookingId?: number | string;
  serviceName?: string;
  latitude?: number;
  longitude?: number;
  addressText?: string;
}

export interface ChatbotAskRequest {
  message?: string;
  sessionId?: string;
  history?: Array<{ role: string; content: string }>;
  pageContext?: ChatbotPageContext;
  confirmedActionId?: string;
}

export interface ChatbotStreamResultRequest {
  sessionId?: string;
  userMessage?: string;
  assistantMessage?: string;
  services?: ChatServiceResult[];
  quickReplies?: ChatbotQuickReply[];
  action?: ChatbotAction;
  confidence?: number;
  citations?: ChatbotCitation[];
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  services: ChatServiceResult[];
  quickReplies: ChatbotQuickReply[];
  action?: ChatbotAction;
  confidence: number;
  citations: ChatbotCitation[];
}

type DetectedIntent = { name: IntentName; confidence: number };
type SessionContext = {
  id: string;
  state: ChatbotSessionState;
  isPersistent: boolean;
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly bookingsService: BookingsService,
    private readonly chatsService: ChatsService,
    private readonly servicesService: ServicesService,
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
    const session = await this.resolveSession(
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
            quickReplies: this.defaultQuickReplies(),
            confidence: 0.7,
            citations: [],
          });
        } else if (this.isCancelDraftMessage(message)) {
          delete session.state.bookingDraft;
          session.state.pendingActions = {};
          response = this.withSession(session, {
            reply:
              'Tôi đã hủy nháp và các thao tác đang chờ xác nhận trong phiên chat này.',
            services: [],
            quickReplies: this.defaultQuickReplies(),
            confidence: 1,
            citations: [],
          });
        } else {
          const intent = this.detectIntent(message);
          const customerCoords = await this.getCustomerCoords(userId, message, request.pageContext);
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

      await this.persistTurn(session, message, response);
      return response;
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chatbot error: ${messageText}`);

      let userFriendlyReply = 'Tôi đang gặp lỗi kết nối. Bạn thử lại sau vài giây.';
      if (error && typeof error === 'object' && 'response' in error) {
        const errResp = (error as any).response;
        if (errResp && typeof errResp === 'object' && 'message' in errResp) {
          userFriendlyReply = Array.isArray(errResp.message) ? errResp.message[0] : errResp.message;
        } else if (errResp && typeof errResp === 'string') {
          userFriendlyReply = errResp;
        }
      } else if (error instanceof Error && !(error instanceof Prisma.PrismaClientKnownRequestError)) {
        userFriendlyReply = error.message;
      }

      const response = this.withSession(session, {
        reply: userFriendlyReply,
        services: [],
        quickReplies: this.defaultQuickReplies(),
        confidence: 0.2,
        citations: [],
      });
      await this.persistTurn(session, message, response);
      return response;
    }
  }

  async listSessions(userId: number) {
    const sessions = await this.prisma.chatbotSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { role: true, content: true, createdAt: true },
        },
      },
    });

    return { data: sessions };
  }

  async deleteSession(userId: number, sessionId: string) {
    await this.prisma.chatbotSession.deleteMany({
      where: { id: sessionId, userId },
    });
    return { message: 'Đã xóa phiên chatbot' };
  }

  async getSessionHistory(userId: number, sessionId: string): Promise<any[]> {
    const session = await this.prisma.chatbotSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, state: true },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên trò chuyện');
    }

    const messages = await this.prisma.chatbotSessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    // 1. Thu thập tất cả serviceIds từ metadata tin nhắn
    const serviceIds: number[] = [];
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.metadata) {
        const meta = msg.metadata as any;
        if (Array.isArray(meta.serviceIds)) {
          meta.serviceIds.forEach((id: number) => {
            if (typeof id === 'number') serviceIds.push(id);
          });
        }
      }
    });

    // 2. Hydrate services
    const uniqueServiceIds = Array.from(new Set(serviceIds));
    const services = uniqueServiceIds.length > 0
      ? await this.prisma.service.findMany({
          where: {
            id: { in: uniqueServiceIds },
            isDeleted: false,
          },
          include: serviceCardInclude,
        })
      : [];

    const defaultAddress = await this.getDefaultAddress(userId);
    const customerCoords = defaultAddress && defaultAddress.latitude && defaultAddress.longitude
      ? { lat: Number(defaultAddress.latitude), lng: Number(defaultAddress.longitude) }
      : undefined;

    const providerIds = Array.from(new Set(services.map(s => s.providerId)));
    const addresses = providerIds.length > 0
      ? await this.prisma.userAddress.findMany({
          where: { userId: { in: providerIds } },
          orderBy: [{ isDefault: 'desc' }, { id: 'desc' }]
        })
      : [];

    const addressMap = new Map<number, any>();
    for (const addr of addresses) {
      if (!addressMap.has(addr.userId)) {
        addressMap.set(addr.userId, addr);
      }
    }

    const serviceMap = new Map<number, ChatServiceResult>();
    services.forEach((s) => {
      const geoService = s as any;
      const addr = addressMap.get(s.providerId);
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
      serviceMap.set(s.id, this.toServiceCard(geoService));
    });

    // 3. Phục dựng trạng thái action từ session state
    const sessionState = this.deserializeState(session.state);
    const pendingActions = sessionState.pendingActions || {};

    // 4. Map tin nhắn sang UIMessage
    return messages.map((msg) => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      const uiMsg: any = {
        id: `msg-${msg.id}`,
        role,
        parts: [{ type: 'text', text: msg.content }],
        createdAt: msg.createdAt.toISOString(),
      };

      if (role === 'assistant') {
        const meta = msg.metadata as any;
        const msgServices: ChatServiceResult[] = [];
        let msgAction: any = undefined;

        if (meta) {
          if (Array.isArray(meta.serviceIds)) {
            meta.serviceIds.forEach((id: number) => {
              const svc = serviceMap.get(id);
              if (svc) msgServices.push(svc);
            });
          }

          if (meta.action && meta.action.id) {
            const act = pendingActions[meta.action.id];
            if (act) {
              msgAction = act;
            } else {
              // Action dự phòng nếu đã bị trim/hết hạn
              msgAction = {
                id: meta.action.id,
                type: meta.action.type,
                label: 'Thao tác liên quan',
                summary: 'Thao tác này đã kết thúc',
                requiresConfirmation: false,
              };
            }
          }
        }

        uiMsg.metadata = {
          sessionId,
          services: msgServices,
          action: msgAction,
          quickReplies: [],
        };
      }

      return uiMsg;
    });
  }

  async persistStreamResult(
    userId: number | undefined,
    input: ChatbotStreamResultRequest,
  ) {
    if (!userId) {
      return { data: { persisted: false, reason: 'guest' } };
    }

    const sessionId = input.sessionId?.trim();
    if (!sessionId) {
      return { data: { persisted: false, reason: 'missing_session' } };
    }

    const assistantMessage = input.assistantMessage?.trim();
    if (!assistantMessage) {
      return { data: { persisted: false, reason: 'missing_assistant_message' } };
    }

    const existing = await this.prisma.chatbotSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, state: true },
    });

    if (!existing) {
      throw new ForbiddenException('Phiên chatbot không hợp lệ');
    }

    const session: SessionContext = {
      id: existing.id,
      state: this.deserializeState(existing.state),
      isPersistent: true,
    };

    await this.persistTurn(session, input.userMessage?.trim() || '', {
      reply: assistantMessage,
      sessionId: existing.id,
      services: input.services || [],
      quickReplies: input.quickReplies || [],
      action: input.action,
      confidence:
        typeof input.confidence === 'number' ? input.confidence : 0.7,
      citations: input.citations || [],
    });

    return { data: { persisted: true, sessionId: existing.id } };
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
    const session = await this.resolveSession(userId, input.sessionId, message);

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
      const response = await this.executeConfirmedAction(userId, session, input.confirmedActionId);
      await this.persistTurn(session, message, response);
      return { ...baseResult, ...response, needsAiStream: false, reply: response.reply };
    }

    // Tin nhắn trống
    if (!message) {
      const reply = 'Bạn muốn tôi tìm dịch vụ, so sánh lựa chọn, tạo lịch đặt hay tra cứu đơn hàng?';
      const quickReplies = this.defaultQuickReplies();
      const response = this.withSession(session, { reply, services: [], quickReplies, confidence: 0.7, citations: [] });
      await this.persistTurn(session, message, response);
      return { ...baseResult, reply, quickReplies, needsAiStream: false };
    }

    // Hủy nháp
    if (this.isCancelDraftMessage(message)) {
      delete session.state.bookingDraft;
      session.state.pendingActions = {};
      const reply = 'Tôi đã hủy nháp và các thao tác đang chờ xác nhận trong phiên chat này.';
      const quickReplies = this.defaultQuickReplies();
      const response = this.withSession(session, { reply, services: [], quickReplies, confidence: 1, citations: [] });
      await this.persistTurn(session, message, response);
      return { ...baseResult, reply, quickReplies, confidence: 1, needsAiStream: false };
    }

    const intent = this.detectIntent(message);
    const customerCoords = await this.getCustomerCoords(userId, message, input.pageContext);

    // Các intent không cần AI stream — xử lý trực tiếp
    if (intent.name !== 'search') {
      const response = await this.handleIntent(userId, session, message, input.history || [], input.pageContext, intent, customerCoords);
      await this.persistTurn(session, message, response);
      return { ...baseResult, ...response, needsAiStream: false, reply: response.reply };
    }

    // Intent 'search' — cần AI stream
    const services = await this.findRelevantServices(message, input.pageContext, customerCoords);
    const serviceCards = services.map((s) => this.toServiceCard(s));

    if (services.length === 0) {
      const reply = 'Tôi chưa tìm thấy dịch vụ phù hợp trong hệ thống. Bạn có thể mô tả cụ thể hơn, ví dụ "máy lạnh chảy nước", "ổ điện bị chập" hoặc "dọn nhà cuối tuần".';
      const quickReplies = this.defaultQuickReplies();
      const response = this.withSession(session, { reply, services: [], quickReplies, confidence: 0.45, citations: [] });
      await this.persistTurn(session, message, response);
      return { ...baseResult, reply, quickReplies, confidence: 0.45, needsAiStream: false };
    }

    const context = this.buildServiceContext(services);
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
        { label: 'So sánh các dịch vụ', message: 'So sánh các dịch vụ này giúp tôi' },
        { label: 'Tạo lịch đặt', message: 'Tôi muốn đặt lịch dịch vụ này' },
        { label: 'Chat với nhà cung cấp', message: 'Tôi muốn nhắn tin với nhà cung cấp' },
      ],
      confidence: intent.confidence,
      citations: serviceCards.map((s) => ({ type: 'service' as const, id: s.id, label: s.name, href: `/services/${s.id}` })),
    };
  }

  private async handleIntent(
    userId: number | undefined,
    session: SessionContext,
    message: string,
    history: Array<{ role: string; content: string }>,
    pageContext: ChatbotPageContext | undefined,
    intent: DetectedIntent,
    customerCoords?: { lat: number; lng: number },
  ): Promise<ChatResponse> {
    if (intent.name === 'smalltalk') {
      return this.withSession(session, {
        reply:
          'Tôi có thể giúp bạn tìm dịch vụ, so sánh nhà cung cấp, tạo nháp đặt lịch, mở chat với nhà cung cấp hoặc tra cứu đơn hàng.',
        services: [],
        quickReplies: this.defaultQuickReplies(),
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
      return this.handleOpenProviderChat(userId, session, message, pageContext, customerCoords);
    }

    const services = await this.findRelevantServices(message, pageContext, customerCoords);

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
    const serviceCards = services.map((service) => this.toServiceCard(service));

    if (services.length === 0) {
      return this.withSession(session, {
        reply:
          'Tôi chưa tìm thấy dịch vụ phù hợp trong hệ thống. Bạn có thể mô tả cụ thể hơn, ví dụ "máy lạnh chảy nước", "ổ điện bị chập" hoặc "dọn nhà cuối tuần".',
        services: [],
        quickReplies: this.defaultQuickReplies(),
        confidence: 0.45,
        citations: [],
      });
    }

    const context = this.buildServiceContext(services);
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
      .map((service) => this.toServiceCard(service));

    if (serviceCards.length < 2) {
      return this.withSession(session, {
        reply:
          'Tôi cần ít nhất 2 dịch vụ để so sánh. Bạn hãy nói rõ nhóm dịch vụ cần tìm, ví dụ "so sánh dịch vụ vệ sinh máy lạnh".',
        services: serviceCards,
        quickReplies: this.defaultQuickReplies(),
        confidence: 0.45,
        citations: [],
      });
    }

    const lines = serviceCards.map(
      (service, index) =>
        `${index + 1}. ${service.name}: ${this.formatPrice(service.referencePrice)}, đánh giá ${service.avgRating.toFixed(1)}/5, nhà cung cấp ${service.providerName}.`,
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
    const serviceCards = services.map((service) => this.toServiceCard(service));

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
      desiredTime: this.parseDesiredTime(message) || currentDraft.desiredTime,
      province: currentDraft.province || defaultAddress?.province,
      district: currentDraft.district || defaultAddress?.district,
      ward: currentDraft.ward || defaultAddress?.ward,
      addressDetail:
        currentDraft.addressDetail || defaultAddress?.addressDetail,
    };
    session.state.bookingDraft = draft;

    const missing = this.getDraftMissingFields(draft);
    if (missing.length > 0) {
      return this.withSession(session, {
        reply: this.composeDraftMissingReply(missing, serviceCards),
        services: serviceCards,
        quickReplies: this.draftQuickReplies(missing),
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
      summary: `Đặt "${service.name}" vào ${this.formatDate(draft.desiredTime!)} tại ${draft.addressDetail}, ${draft.ward}, ${draft.district}, ${draft.province}.`,
      payload: { draft },
      requiresConfirmation: true,
    });

    return this.withSession(session, {
      reply:
        `Tôi đã chuẩn bị nháp đặt lịch cho dịch vụ "${service.name}". ` +
        `Thời gian mong muốn: ${this.formatDate(draft.desiredTime!)}. ` +
        `Địa chỉ: ${draft.addressDetail}, ${draft.ward}, ${draft.district}, ${draft.province}. ` +
        'Bạn kiểm tra lại rồi bấm xác nhận để tạo đơn.',
      services: [this.toServiceCard(service)],
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

    const result = await this.bookingsService.getMyBookings(
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
        quickReplies: this.defaultQuickReplies(),
        confidence: 0.85,
        citations: [],
      });
    }

    const lines = bookings.map(
      (booking) =>
        `#${booking.bookingCode}: ${booking.service?.name || 'Dịch vụ'} - ${this.statusLabel(booking.status)}. Nhà cung cấp: ${booking.provider?.fullName || 'chưa rõ'}.`,
    );
    const latest = bookings[0];

    return this.withSession(session, {
      reply:
        `Đây là các đơn gần nhất của bạn:\n${lines.join('\n')}\n\n` +
        `Đơn mới nhất #${latest.bookingCode}: ${this.nextStepForStatus(latest.status)}.`,
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

    const services = await this.findRelevantServices(message, pageContext, customerCoords);
    const serviceId = this.resolveServiceId(message, pageContext, services);

    if (!serviceId) {
      return this.withSession(session, {
        reply:
          'Bạn muốn chat với nhà cung cấp của dịch vụ nào? Hãy mở trang chi tiết dịch vụ hoặc nhắn tên dịch vụ cụ thể.',
        services: services.map((service) => this.toServiceCard(service)),
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
      services: [this.toServiceCard(service)],
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
        quickReplies: this.defaultQuickReplies(),
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
      services: [this.toServiceCard(booking.service as ServiceWithRelations)],
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
        quickReplies: this.defaultQuickReplies(),
        confidence: 0.5,
        citations: [],
      });
    }

    if (!userId) {
      return this.withSession(session, {
        reply: 'Bạn cần đăng nhập trước khi xác nhận thao tác này.',
        services: [],
        quickReplies: this.defaultQuickReplies(),
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
        if (isNaN(desiredDate.getTime()) || desiredDate.getTime() < minDate.getTime()) {
          throw new BadRequestException('Thời gian đặt lịch không hợp lệ hoặc phải sau ít nhất 2 giờ tính từ thời điểm hiện tại.');
        }
      }
      const dto = this.toCreateBookingDto(draft);
      const result = await this.bookingsService.create(userId, dto);
      const booking = result.data;
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
      const result = await this.bookingsService.rebook(userId, bookingId);
      const booking = result.data;
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
        quickReplies: this.defaultQuickReplies(),
        confidence: 1,
        citations: [],
      });
    }

    throw new BadRequestException('Action không được hỗ trợ');
  }

  private async resolveSession(
    userId: number | undefined,
    sessionId: string | undefined,
    firstMessage: string,
  ): Promise<SessionContext> {
    if (!userId) {
      return {
        id: sessionId || `guest-${randomUUID()}`,
        state: {},
        isPersistent: false,
      };
    }

    const existing = sessionId
      ? await this.prisma.chatbotSession.findFirst({
          where: { id: sessionId, userId },
          select: { id: true, state: true },
        })
      : null;

    if (existing) {
      return {
        id: existing.id,
        state: this.deserializeState(existing.state),
        isPersistent: true,
      };
    }

    const session = await this.prisma.chatbotSession.create({
      data: {
        userId,
        title: this.makeTitle(firstMessage),
        state: this.toJson({ pendingActions: {} }),
      },
      select: { id: true },
    });

    return {
      id: session.id,
      state: { pendingActions: {} },
      isPersistent: true,
    };
  }

  private async persistTurn(
    session: SessionContext,
    userMessage: string,
    response: ChatResponse,
  ) {
    if (!session.isPersistent) return;

    if (userMessage) {
      await this.prisma.chatbotSessionMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: userMessage.slice(0, 4000),
        },
      });
    }

    await this.prisma.chatbotSessionMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: response.reply.slice(0, 4000),
        metadata: this.toJson({
          serviceIds: response.services.map((service) => service.id),
          action: response.action
            ? { id: response.action.id, type: response.action.type }
            : null,
        }),
      },
    });

    const messageCount = await this.prisma.chatbotSessionMessage.count({
      where: { sessionId: session.id },
    });

    await this.prisma.chatbotSession.update({
      where: { id: session.id },
      data: {
        state: this.toJson(this.trimSessionState(session.state)),
        summary:
          messageCount > 20 ? this.makeSummary(response.reply) : undefined,
      },
    });
  }

  private async findRelevantServices(
    query: string,
    pageContext?: ChatbotPageContext,
    customerCoords?: { lat: number; lng: number },
  ): Promise<(ServiceWithRelations & { distanceKm?: number; providerAddress?: string })[]> {
    const results: ServiceWithRelations[] = [];
    const contextServiceId = this.parsePositiveInt(pageContext?.serviceId);

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
    const providerIds = Array.from(new Set(unique.map(s => s.providerId)));
    const addresses = await this.prisma.userAddress.findMany({
      where: {
        userId: { in: providerIds },
      },
      orderBy: [
        { isDefault: 'desc' },
        { id: 'desc' }
      ]
    });

    const addressMap = new Map<number, any>();
    for (const addr of addresses) {
      if (!addressMap.has(addr.userId)) {
        addressMap.set(addr.userId, addr);
      }
    }

    const servicesWithGeo = unique.map(service => {
      const geoService = service as ServiceWithRelations & { distanceKm?: number; providerAddress?: string };
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
      throw new BadRequestException('Nhà cung cấp dịch vụ hiện đang bị khóa hoặc ngưng hoạt động.');
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
    const bookingId = this.parsePositiveInt(pageContext?.bookingId);
    const bookingCode = this.extractBookingCode(message);

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

  private detectIntent(message: string): DetectedIntent {
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

  private resolveServiceId(
    message: string,
    pageContext: ChatbotPageContext | undefined,
    services: ServiceWithRelations[],
  ): number | undefined {
    const contextId = this.parsePositiveInt(pageContext?.serviceId);
    if (contextId) return contextId;

    const explicitId = this.extractServiceId(message);
    if (explicitId) return explicitId;

    const normalizedMessage = this.normalize(message);
    const exact = services.find((service) =>
      normalizedMessage.includes(this.normalize(service.name)),
    );
    if (exact) return exact.id;

    return services.length === 1 ? services[0].id : undefined;
  }

  private extractProblemDescription(message: string) {
    const normalized = this.normalize(message);
    if (normalized.length < 12) return undefined;
    return message.slice(0, 800);
  }

  private parseDesiredTime(message: string): string | undefined {
    const normalized = this.normalize(message);
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

  private getDraftMissingFields(draft: BookingDraft) {
    const missing: Array<
      'service' | 'description' | 'address' | 'desiredTime'
    > = [];
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

  private composeDraftMissingReply(
    missing: Array<'service' | 'description' | 'address' | 'desiredTime'>,
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

  private draftQuickReplies(
    missing: Array<'service' | 'description' | 'address' | 'desiredTime'>,
  ) {
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
    return replies.length > 0 ? replies : this.defaultQuickReplies();
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
    const stored: StoredAction = {
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

  private toCreateBookingDto(draft: BookingDraft): CreateBookingDto {
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

  private toServiceCard(
    service: ServiceWithRelations & { distanceKm?: number; providerAddress?: string },
  ): ChatServiceResult {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      referencePrice: Number(service.referencePrice),
      providerId: service.providerId,
      providerName: service.provider.fullName,
      avgRating: Number(service.avgRating || 0),
      totalReviews: service.totalReviews || 0,
      categoryName: service.category?.name || 'Khác',
      imageUrl: service.images?.[0]?.imageUrl,
      distanceKm: service.distanceKm !== undefined ? Number(service.distanceKm) : undefined,
      providerAddress: service.providerAddress,
    };
  }

  private buildServiceContext(
    services: (ServiceWithRelations & { distanceKm?: number; providerAddress?: string })[],
  ) {
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

  private withSession(
    session: SessionContext,
    response: Omit<ChatResponse, 'sessionId'>,
  ): ChatResponse {
    return { sessionId: session.id, ...response };
  }

  private deserializeState(
    value: Prisma.JsonValue | null | undefined,
  ): ChatbotSessionState {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { pendingActions: {} };
    }
    return value as ChatbotSessionState;
  }

  private trimSessionState(state: ChatbotSessionState): ChatbotSessionState {
    return {
      bookingDraft: state.bookingDraft,
      pendingActions: state.pendingActions,
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
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

    return this.normalize(message)
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopwords.has(word))
      .slice(0, 8);
  }

  private extractServiceId(message: string) {
    const match = message.match(/(?:service|dịch vụ|dich vu|id|#)\s*(\d+)/i);
    return match ? this.parsePositiveInt(match[1]) : undefined;
  }

  private extractBookingCode(message: string) {
    const match = message.toUpperCase().match(/#?([A-Z]{2,}\d{3,})/);
    return match?.[1];
  }

  private isCancelDraftMessage(message: string) {
    const normalized = this.normalize(message);
    return this.hasAny(normalized, [
      'huy nhap',
      'huy dat lich',
      'huy thao tac',
      'bo qua',
      'khong dat nua',
    ]);
  }

  private parsePositiveInt(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s/-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hasAny(value: string, terms: string[]) {
    return terms.some((term) => value.includes(term));
  }

  private statusLabel(status: string) {
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

  private nextStepForStatus(status: string) {
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

  private formatPrice(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private makeTitle(message: string) {
    return (message || 'Phiên trợ lý mới').slice(0, 80);
  }

  private makeSummary(reply: string) {
    return reply.replace(/\s+/g, ' ').slice(0, 240);
  }

  private defaultQuickReplies(): ChatbotQuickReply[] {
    return [
      { label: 'Tìm dịch vụ', message: 'Tìm dịch vụ phù hợp cho tôi' },
      { label: 'So sánh dịch vụ', message: 'So sánh các dịch vụ giúp tôi' },
      { label: 'Đơn của tôi', message: 'Đơn của tôi tới đâu rồi?' },
    ];
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
      const detectedDistrict = this.extractDistrictFromText(message);
      if (detectedDistrict && districtCoords[detectedDistrict]) {
        return districtCoords[detectedDistrict];
      }
    }

    return undefined;
  }

  private extractDistrictFromText(text: string): string | null {
    if (!text) return null;
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ');

    // 1. Tìm quận số trước: q1, q.1, q 1, quan 1, quan 12...
    const matchNumber = normalized.match(/(?:quan|q\.?\s?)\s*(\d+)\b/i);
    if (matchNumber) {
      return `Quận ${matchNumber[1]}`;
    }

    // 2. Tìm quận chữ bằng cách quét từ khóa đặc trưng trong districtMap
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
