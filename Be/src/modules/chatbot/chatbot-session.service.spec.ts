import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotSessionService } from './chatbot-session.service';

type ChatbotPrismaMock = {
  chatbotSession: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
};

describe('ChatbotSessionService', () => {
  let service: ChatbotSessionService;
  let prisma: ChatbotPrismaMock;

  beforeEach(() => {
    prisma = {
      chatbotSession: {
        findFirst: jest.fn().mockResolvedValue({ id: 'session-1' }),
        update: jest.fn().mockResolvedValue({
          id: 'session-1',
          title: 'Tiêu đề mới',
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      },
    };

    service = new ChatbotSessionService(prisma as unknown as PrismaService);
  });

  it('updates title only when current user owns session', async () => {
    const result = await service.updateSessionTitle(
      10,
      'session-1',
      'Tiêu đề mới',
    );

    expect(prisma.chatbotSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 10 },
      select: { id: true },
    });
    expect(prisma.chatbotSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { title: 'Tiêu đề mới' },
      select: { id: true, title: true, updatedAt: true },
    });
    expect(result.data.title).toBe('Tiêu đề mới');
  });

  it('rejects title update when user is not owner', async () => {
    prisma.chatbotSession.findFirst.mockResolvedValue(null);

    await expect(
      service.updateSessionTitle(10, 'session-1', 'Tiêu đề mới'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.chatbotSession.update).not.toHaveBeenCalled();
  });
});
