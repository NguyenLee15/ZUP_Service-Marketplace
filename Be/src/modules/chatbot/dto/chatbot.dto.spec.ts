import 'reflect-metadata';
import { validate } from 'class-validator';
import { ChatbotAskDto, ChatbotStreamResultDto } from './chatbot.dto';

describe('chatbot AI request bounds', () => {
  it('rejects oversized messages and unbounded history', async () => {
    const dto = Object.assign(new ChatbotAskDto(), {
      message: 'x'.repeat(4001),
      history: Array.from({ length: 13 }, () => ({
        role: 'user',
        content: 'ok',
      })),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['message', 'history']),
    );
  });

  it('rejects oversized persisted stream payloads', async () => {
    const dto = Object.assign(new ChatbotStreamResultDto(), {
      assistantMessage: 'x'.repeat(4001),
      services: Array.from({ length: 21 }, () => ({})),
      citations: Array.from({ length: 21 }, () => 'citation'),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['assistantMessage', 'services', 'citations']),
    );
  });
});
