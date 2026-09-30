import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ChatsGateway } from './chats.gateway';
import { SendMessageWsDto } from './dto/send-message-ws.dto';

describe('ChatsGateway sendMessage boundary', () => {
  const createGateway = () => {
    const chatsService = {
      isMember: jest.fn().mockResolvedValue(true),
      createMessage: jest.fn().mockResolvedValue({ id: 55 }),
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      conversation: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const jobsService = { enqueue: jest.fn() };
    const gateway = new ChatsGateway(
      chatsService as never,
      {} as never,
      prisma as never,
      jobsService as never,
    );
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as never;
    return { gateway, chatsService, prisma };
  };

  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('accepts a valid message and preserves the client id', async () => {
    const { gateway, chatsService } = createGateway();
    const client = {
      data: { user: { id: 7, role: 'CUSTOMER' } },
      emit: jest.fn(),
    };

    const dto = (await validationPipe.transform(
      {
        conversationId: 12,
        content: 'hello',
        messageType: 'TEXT',
        clientId: 'client-1',
      },
      { type: 'body', metatype: SendMessageWsDto },
    )) as SendMessageWsDto;

    const result = await gateway.handleSendMessage(client as never, dto);

    expect(chatsService.createMessage).toHaveBeenCalledWith(
      12,
      7,
      'CUSTOMER',
      'hello',
      'TEXT',
      undefined,
    );
    expect(result).toEqual({
      success: true,
      messageId: 55,
      clientId: 'client-1',
    });
  });

  it.each([
    ['oversized content', { conversationId: 1, content: 'x'.repeat(5001) }],
    [
      'invalid message type',
      { conversationId: 1, content: 'x', messageType: 'VIDEO' },
    ],
    ['invalid conversation id', { conversationId: 0, content: 'x' }],
    ['unknown property', { conversationId: 1, content: 'x', extra: true }],
  ])('rejects %s before gateway handling', async (_case, payload) => {
    await expect(
      validationPipe.transform(payload, {
        type: 'body',
        metatype: SendMessageWsDto,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
