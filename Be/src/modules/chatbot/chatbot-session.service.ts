import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateHaversineDistance } from '../../shared/utils/geo';
import type {
  ChatbotAction,
  ChatbotActionType,
  ChatbotUiMessage,
  ChatServiceResult,
} from './chatbot.types';

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

type StoredAction = ChatbotAction & { createdAt: string };

type ChatbotSessionState = {
  pendingActions?: Record<string, StoredAction>;
};

interface AssistantMessageMetadata {
  serviceIds?: number[];
  action?: {
    id: string;
    type?: ChatbotActionType;
  };
}

@Injectable()
export class ChatbotSessionService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getSessionHistory(
    userId: number,
    sessionId: string,
  ): Promise<ChatbotUiMessage[]> {
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

    const serviceIds: number[] = [];
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.metadata) {
        const meta = this.parseAssistantMetadata(message.metadata);
        meta?.serviceIds?.forEach((id) => serviceIds.push(id));
      }
    });

    const uniqueServiceIds = Array.from(new Set(serviceIds));
    const services =
      uniqueServiceIds.length > 0
        ? await this.prisma.service.findMany({
            where: {
              id: { in: uniqueServiceIds },
              isDeleted: false,
            },
            include: serviceCardInclude,
          })
        : [];

    const defaultAddress = await this.getDefaultAddress(userId);
    const customerCoords =
      defaultAddress && defaultAddress.latitude && defaultAddress.longitude
        ? {
            lat: Number(defaultAddress.latitude),
            lng: Number(defaultAddress.longitude),
          }
        : undefined;

    const providerIds = Array.from(
      new Set(services.map((service) => service.providerId)),
    );
    const addresses =
      providerIds.length > 0
        ? await this.prisma.userAddress.findMany({
            where: { userId: { in: providerIds } },
            orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
          })
        : [];

    const addressMap = new Map<number, (typeof addresses)[number]>();
    for (const address of addresses) {
      if (!addressMap.has(address.userId)) {
        addressMap.set(address.userId, address);
      }
    }

    const serviceMap = new Map<number, ChatServiceResult>();
    services.forEach((service) => {
      const address = addressMap.get(service.providerId);
      const serviceWithGeo: ServiceWithRelations & {
        distanceKm?: number;
        providerAddress?: string;
      } = { ...service };
      if (address) {
        serviceWithGeo.providerAddress = `${address.addressDetail}, ${address.ward}, ${address.district}, ${address.province}`;
        if (customerCoords && address.latitude && address.longitude) {
          serviceWithGeo.distanceKm = calculateHaversineDistance(
            customerCoords.lat,
            customerCoords.lng,
            Number(address.latitude),
            Number(address.longitude),
          );
        }
      }
      serviceMap.set(service.id, this.toServiceCard(serviceWithGeo));
    });

    const sessionState = this.deserializeState(session.state);
    const pendingActions = sessionState.pendingActions || {};

    return messages.map((message) => {
      const role = message.role === 'user' ? 'user' : 'assistant';
      const uiMessage: ChatbotUiMessage = {
        id: `msg-${message.id}`,
        role,
        parts: [{ type: 'text', text: message.content }],
        createdAt: message.createdAt.toISOString(),
      };

      if (role === 'assistant') {
        const meta = this.parseAssistantMetadata(message.metadata);
        const messageServices: ChatServiceResult[] = [];
        let messageAction: ChatbotAction | undefined;

        if (meta) {
          meta.serviceIds?.forEach((id) => {
            const service = serviceMap.get(id);
            if (service) messageServices.push(service);
          });

          if (meta.action && meta.action.id) {
            const action = pendingActions[meta.action.id];
            messageAction =
              action ||
              ({
                id: meta.action.id,
                type: meta.action.type ?? 'VIEW_BOOKING',
                label: 'Thao tác liên quan',
                summary: 'Thao tác này đã kết thúc',
                payload: {},
                requiresConfirmation: false,
              } satisfies ChatbotAction);
          }
        }

        uiMessage.metadata = {
          sessionId,
          services: messageServices,
          action: messageAction,
          quickReplies: [],
        };
      }

      return uiMessage;
    });
  }

  private async getDefaultAddress(userId: number) {
    return this.prisma.userAddress.findFirst({
      where: { userId, isDefault: true },
      orderBy: { id: 'desc' },
    });
  }

  private toServiceCard(
    service: ServiceWithRelations & {
      distanceKm?: number;
      providerAddress?: string;
    },
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
      distanceKm:
        service.distanceKm !== undefined
          ? Number(service.distanceKm)
          : undefined,
      providerAddress: service.providerAddress,
    };
  }

  private deserializeState(
    value: Prisma.JsonValue | null | undefined,
  ): ChatbotSessionState {
    if (!this.isRecord(value)) return { pendingActions: {} };
    return this.normalizeSessionState(value);
  }

  private parseAssistantMetadata(
    value: Prisma.JsonValue | null | undefined,
  ): AssistantMessageMetadata | null {
    if (!this.isRecord(value)) return null;
    const metadata: AssistantMessageMetadata = {};

    if (Array.isArray(value.serviceIds)) {
      const serviceIds = value.serviceIds.filter(
        (id): id is number => typeof id === 'number',
      );
      if (serviceIds.length > 0) metadata.serviceIds = serviceIds;
    }

    if (this.isRecord(value.action) && typeof value.action.id === 'string') {
      metadata.action = {
        id: value.action.id,
        type: this.isChatbotActionType(value.action.type)
          ? value.action.type
          : undefined,
      };
    }

    return metadata;
  }

  private normalizeSessionState(
    value: Record<string, unknown>,
  ): ChatbotSessionState {
    const pendingActions: Record<string, StoredAction> = {};
    if (this.isRecord(value.pendingActions)) {
      for (const [id, action] of Object.entries(value.pendingActions)) {
        if (this.isStoredAction(action)) pendingActions[id] = action;
      }
    }

    return { pendingActions };
  }

  private isStoredAction(value: unknown): value is StoredAction {
    if (!this.isRecord(value)) return false;
    return (
      typeof value.id === 'string' &&
      this.isChatbotActionType(value.type) &&
      typeof value.label === 'string' &&
      typeof value.summary === 'string' &&
      this.isRecord(value.payload) &&
      typeof value.requiresConfirmation === 'boolean' &&
      typeof value.createdAt === 'string'
    );
  }

  private isChatbotActionType(value: unknown): value is ChatbotActionType {
    return (
      value === 'CREATE_BOOKING_DRAFT' ||
      value === 'CONFIRM_CREATE_BOOKING' ||
      value === 'OPEN_PROVIDER_CHAT' ||
      value === 'VIEW_BOOKING' ||
      value === 'REBOOK' ||
      value === 'CANCEL_BOOKING_DRAFT'
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}
