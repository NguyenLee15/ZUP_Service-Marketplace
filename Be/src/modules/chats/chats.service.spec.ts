import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { ChatsService } from './chats.service';

type ChatsPrismaMock = {
  conversation: {
    findFirst: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  message: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

type MessageFindFirstArg = {
  where: {
    id: number;
    senderId: number;
    recalledAt: null;
    senderType: unknown;
  };
};

describe('ChatsService ownership', () => {
  let service: ChatsService;
  let prisma: ChatsPrismaMock;

  beforeEach(() => {
    prisma = {
      conversation: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    service = new ChatsService(
      prisma as unknown as PrismaService,
      { suggestReplies: jest.fn() } as unknown as AiService,
      { emit: jest.fn() } as unknown as EventEmitter2,
    );
  });

  it('returns no history and does not read messages for non-participants', async () => {
    await expect(service.getHistory(50, 10)).resolves.toEqual({ data: [] });

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 50,
        OR: [{ customerId: 10 }, { providerId: 10 }],
      },
    });
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('rejects recall when the message was not sent by the current user', async () => {
    await expect(service.recallMessage(70, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const findFirstMock = prisma.message.findFirst as jest.Mock<
      unknown,
      [MessageFindFirstArg]
    >;
    const findFirstArg = findFirstMock.mock.calls[0]?.[0];
    expect(findFirstArg?.where).toMatchObject({
      id: 70,
      senderId: 10,
      recalledAt: null,
    });
    expect(prisma.message.update).not.toHaveBeenCalled();
    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });
});
