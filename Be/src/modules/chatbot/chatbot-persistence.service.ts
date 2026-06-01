import { ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  BookingDraft,
  ChatbotActionType,
  ChatbotSessionState,
  ChatbotStreamResultRequest,
  SessionContext,
  StoredChatbotAction,
  ChatResponse,
} from './chatbot.types';

@Injectable()
export class ChatbotPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveSession(
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
      return {
        data: { persisted: false, reason: 'missing_assistant_message' },
      };
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
      confidence: typeof input.confidence === 'number' ? input.confidence : 0.7,
      citations: input.citations || [],
    });

    return { data: { persisted: true, sessionId: existing.id } };
  }

  async persistTurn(
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

  deserializeState(
    value: Prisma.JsonValue | null | undefined,
  ): ChatbotSessionState {
    if (!this.isRecord(value)) return { pendingActions: {} };
    return this.normalizeSessionState(value);
  }

  toJson(value: unknown): Prisma.InputJsonValue {
    const parsed: unknown = JSON.parse(JSON.stringify(value));
    return parsed as Prisma.InputJsonValue;
  }

  private trimSessionState(state: ChatbotSessionState): ChatbotSessionState {
    return {
      bookingDraft: state.bookingDraft,
      pendingActions: state.pendingActions,
    };
  }

  private normalizeSessionState(
    value: Record<string, unknown>,
  ): ChatbotSessionState {
    const pendingActions: Record<string, StoredChatbotAction> = {};
    if (this.isRecord(value.pendingActions)) {
      for (const [id, action] of Object.entries(value.pendingActions)) {
        if (this.isStoredAction(action)) pendingActions[id] = action;
      }
    }

    return {
      bookingDraft: this.isBookingDraft(value.bookingDraft)
        ? value.bookingDraft
        : undefined,
      pendingActions,
    };
  }

  private isStoredAction(value: unknown): value is StoredChatbotAction {
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

  private isBookingDraft(value: unknown): value is BookingDraft {
    if (!this.isRecord(value)) return false;
    return [
      'serviceId',
      'description',
      'desiredTime',
      'province',
      'district',
      'ward',
      'addressDetail',
    ].every((key) => {
      const field = value[key];
      return (
        field === undefined ||
        typeof field === 'string' ||
        typeof field === 'number'
      );
    });
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

  private makeTitle(message: string) {
    return (message || 'Phiên trợ lý mới').slice(0, 80);
  }

  private makeSummary(reply: string) {
    return reply.replace(/\s+/g, ' ').slice(0, 240);
  }
}
