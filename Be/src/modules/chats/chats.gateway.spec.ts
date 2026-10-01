import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ChatsGateway } from './chats.gateway';
import { SendMessageWsDto } from './dto/send-message-ws.dto';
import { TypingWsDto } from './dto/typing-ws.dto';
import { RevokeMessageWsDto } from './dto/revoke-message-ws.dto';

describe('ChatsGateway sendMessage boundary', () => {
  const createGateway = () => {
    const chatsService = {
      isMember: jest.fn().mockResolvedValue(true),
      createMessage: jest.fn().mockResolvedValue({ id: 55 }),
      recallMessage: jest.fn(),
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      conversation: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const jobsService = { enqueue: jest.fn() };
    const presence = { fetchSockets: jest.fn().mockResolvedValue([]) };
    const gateway = new ChatsGateway(
      chatsService as never,
      {} as never,
      prisma as never,
      jobsService as never,
    );
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnValue(presence),
      emit: jest.fn(),
    } as never;
    return { gateway, chatsService, prisma, jobsService, presence };
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

  it('validates typing payloads before membership checks', async () => {
    const { gateway: _gateway, chatsService } = createGateway();

    await expect(
      validationPipe.transform(
        { conversationId: 0, extra: true },
        { type: 'body', metatype: TypingWsDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(chatsService.isMember).not.toHaveBeenCalled();
  });

  it('validates revoke payloads before service calls', async () => {
    const { gateway: _gateway, chatsService } = createGateway();

    await expect(
      validationPipe.transform(
        { messageId: 'invalid' },
        { type: 'body', metatype: RevokeMessageWsDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(chatsService.recallMessage).not.toHaveBeenCalled();
  });

  it('forwards a valid typing payload only after membership validation', async () => {
    const { gateway, chatsService } = createGateway();
    const emit = jest.fn();
    const client = {
      data: { user: { id: 7, role: 'CUSTOMER' } },
      to: jest.fn().mockReturnValue({ emit }),
    };

    const dto = (await validationPipe.transform(
      { conversationId: 12 },
      { type: 'body', metatype: TypingWsDto },
    )) as TypingWsDto;
    await gateway.handleTyping(client as never, dto);

    expect(chatsService.isMember).toHaveBeenCalledWith(12, 7);
    expect(emit).toHaveBeenCalledWith('typing', { userId: 7 });
  });

  it('forwards a valid revoke payload to the ownership-aware service', async () => {
    const { gateway, chatsService } = createGateway();
    const client = { data: { user: { id: 7, role: 'CUSTOMER' } } };
    const dto = (await validationPipe.transform(
      { messageId: 22 },
      { type: 'body', metatype: RevokeMessageWsDto },
    )) as RevokeMessageWsDto;

    await gateway.handleRevokeMessage(client as never, dto);

    expect(chatsService.recallMessage).toHaveBeenCalledWith(22, 7);
  });

  it('uses adapter-backed presence for online users', async () => {
    const { gateway, presence } = createGateway();
    presence.fetchSockets.mockResolvedValueOnce([{ id: 'remote-socket' }]);

    await expect(gateway.isUserOnline(8)).resolves.toBe(true);
    expect(presence.fetchSockets).toHaveBeenCalled();
  });

  it('fails closed against AI fallback when presence lookup errors', async () => {
    const { gateway, presence, jobsService, prisma } = createGateway();
    presence.fetchSockets.mockRejectedValueOnce(new Error('redis unavailable'));
    prisma.conversation.findUnique.mockResolvedValue({
      id: 12,
      customerId: 7,
      providerId: 8,
    });
    const client = {
      data: { user: { id: 7, role: 'CUSTOMER' } },
      emit: jest.fn(),
    };

    await gateway.handleSendMessage(client as never, {
      conversationId: 12,
      content: 'hello',
      messageType: 'TEXT',
    });

    expect(jobsService.enqueue).not.toHaveBeenCalled();
  });
});
