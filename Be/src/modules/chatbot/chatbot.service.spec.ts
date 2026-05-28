import { ForbiddenException } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { BookingLifecycleService } from '../bookings/booking-lifecycle.service';
import { BookingQueryService } from '../bookings/booking-query.service';
import { ChatsService } from '../chats/chats.service';
import { ServicesService } from '../services/services.service';

type MockPrisma = {
  chatbotSession: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  chatbotSessionMessage: {
    create: jest.Mock;
    count: jest.Mock;
  };
};

type ChatbotPrivate = {
  extractDistrictFromText(text: string): string | null;
};

type SessionMessageCreateArg = {
  data: {
    sessionId: string;
    role: string;
    content: string;
    metadata?: { serviceIds: number[]; action: null };
  };
};

type SessionUpdateArg = {
  where: { id: string };
  data: { state: { pendingActions: Record<string, never> } };
};

describe('ChatbotService stream persistence', () => {
  let service: ChatbotService;

  const mockPrisma: MockPrisma = {
    chatbotSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    chatbotSessionMessage: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAiService = {};
  const mockBookingLifecycleService = {};
  const mockBookingQueryService = {};
  const mockChatsService = {};
  const mockServicesService = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.chatbotSessionMessage.count.mockResolvedValue(2);
    service = new ChatbotService(
      mockPrisma as unknown as PrismaService,
      mockAiService as unknown as AiService,
      mockBookingLifecycleService as unknown as BookingLifecycleService,
      mockBookingQueryService as unknown as BookingQueryService,
      mockChatsService as unknown as ChatsService,
      mockServicesService as unknown as ServicesService,
    );
  });

  it('persists user and assistant messages for the owning user session', async () => {
    mockPrisma.chatbotSession.findFirst.mockResolvedValue({
      id: 'session-1',
      state: { pendingActions: {} },
    });

    const result = await service.persistStreamResult(1, {
      sessionId: 'session-1',
      userMessage: 'tim ve sinh may lanh',
      assistantMessage: 'Toi tim thay 2 dich vu phu hop.',
      services: [
        {
          id: 10,
          name: 'Ve sinh may lanh',
          referencePrice: 200000,
          providerId: 20,
          providerName: 'Tho A',
          avgRating: 4.8,
          totalReviews: 12,
          categoryName: 'Dien lanh',
        },
      ],
      quickReplies: [{ label: 'Dat lich', message: 'Toi muon dat lich' }],
      confidence: 0.8,
      citations: [
        {
          type: 'service',
          id: 10,
          label: 'Ve sinh may lanh',
          href: '/services/10',
        },
      ],
    });

    expect(result).toEqual({
      data: { persisted: true, sessionId: 'session-1' },
    });
    expect(mockPrisma.chatbotSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 1 },
      select: { id: true, state: true },
    });
    expect(mockPrisma.chatbotSessionMessage.create).toHaveBeenCalledTimes(2);
    const createMock = mockPrisma.chatbotSessionMessage.create as jest.Mock<
      unknown,
      [SessionMessageCreateArg]
    >;
    const firstCreateArg = createMock.mock.calls[0]?.[0];
    expect(firstCreateArg.data).toMatchObject({
      sessionId: 'session-1',
      role: 'user',
      content: 'tim ve sinh may lanh',
    });

    const secondCreateArg = createMock.mock.calls[1]?.[0];
    expect(secondCreateArg.data.sessionId).toBe('session-1');
    expect(secondCreateArg.data.role).toBe('assistant');
    expect(secondCreateArg.data.content).toBe(
      'Toi tim thay 2 dich vu phu hop.',
    );
    expect(secondCreateArg.data.metadata).toBeDefined();
    const metadata = secondCreateArg.data.metadata;
    expect(metadata?.serviceIds).toEqual([10]);
    expect(metadata?.action).toBeNull();

    const updateMock = mockPrisma.chatbotSession.update as jest.Mock<
      unknown,
      [SessionUpdateArg]
    >;
    const updateArg = updateMock.mock.calls[0]?.[0];
    expect(updateArg.where).toEqual({ id: 'session-1' });
    expect(updateArg.data.state).toEqual({ pendingActions: {} });
  });

  it('blocks persistence when the session does not belong to the user', async () => {
    mockPrisma.chatbotSession.findFirst.mockResolvedValue(null);

    await expect(
      service.persistStreamResult(2, {
        sessionId: 'session-1',
        assistantMessage: 'Noi dung tra loi',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.chatbotSessionMessage.create).not.toHaveBeenCalled();
    expect(mockPrisma.chatbotSession.update).not.toHaveBeenCalled();
  });

  it('no-ops safely for guest users', async () => {
    const result = await service.persistStreamResult(undefined, {
      sessionId: 'guest-session',
      userMessage: 'tim dich vu',
      assistantMessage: 'Ket qua',
    });

    expect(result).toEqual({ data: { persisted: false, reason: 'guest' } });
    expect(mockPrisma.chatbotSession.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.chatbotSessionMessage.create).not.toHaveBeenCalled();
  });

  describe('extractDistrictFromText', () => {
    it('should extract district names correctly from Vietnamese chat message', () => {
      const privateService = service as unknown as ChatbotPrivate;
      expect(
        privateService.extractDistrictFromText(
          'Tôi muốn tìm thợ sửa điều hòa ở Quận 7',
        ),
      ).toBe('Quận 7');
      expect(
        privateService.extractDistrictFromText(
          'Cần dọn nhà gấp tại Q. Bình Thạnh',
        ),
      ).toBe('Quận Bình Thạnh');
      expect(
        privateService.extractDistrictFromText('Alo, có thợ nào gần Q1 không'),
      ).toBe('Quận 1');
      expect(
        privateService.extractDistrictFromText('Tìm thợ tại Quận Gò Vấp'),
      ).toBe('Quận Gò Vấp');
      expect(
        privateService.extractDistrictFromText('Tôi ở quận phú nhuận'),
      ).toBe('Quận Phú Nhuận');
      expect(
        privateService.extractDistrictFromText('Không có thông tin quận'),
      ).toBeNull();
    });
  });
});
