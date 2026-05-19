import { ForbiddenException } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

describe('ChatbotService stream persistence', () => {
  let service: ChatbotService;

  const mockPrisma: any = {
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
  const mockBookingsService = {};
  const mockChatsService = {};
  const mockServicesService = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.chatbotSessionMessage.count.mockResolvedValue(2);
    service = new ChatbotService(
      mockPrisma,
      mockAiService as any,
      mockBookingsService as any,
      mockChatsService as any,
      mockServicesService as any,
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
    expect(mockPrisma.chatbotSessionMessage.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: 'session-1',
          role: 'user',
          content: 'tim ve sinh may lanh',
        }),
      }),
    );
    expect(mockPrisma.chatbotSessionMessage.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: 'session-1',
          role: 'assistant',
          content: 'Toi tim thay 2 dich vu phu hop.',
          metadata: expect.objectContaining({
            serviceIds: [10],
            action: null,
          }),
        }),
      }),
    );
    expect(mockPrisma.chatbotSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          state: { pendingActions: {} },
        }),
      }),
    );
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
});
