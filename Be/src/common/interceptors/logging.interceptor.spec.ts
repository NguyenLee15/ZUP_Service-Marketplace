import { of, lastValueFrom } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor request id', () => {
  const run = async (requestId?: string) => {
    const interceptor = new LoggingInterceptor();
    const request = {
      method: 'GET',
      url: '/health',
      headers: requestId === undefined ? {} : { 'x-request-id': requestId },
      user: { id: 7 },
    };
    const response = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };
    const next = { handle: () => of({ ok: true }) };
    await lastValueFrom(interceptor.intercept(context as never, next as never));
    return response.setHeader.mock.calls[0]?.[1] as string;
  };

  it('preserves a bounded safe request id', async () => {
    await expect(run('req-123')).resolves.toBe('req-123');
  });

  it('replaces oversized and control-character request ids', async () => {
    await expect(run('x'.repeat(65))).resolves.toMatch(/^[0-9a-f-]{36}$/);
    await expect(run('bad\nrequest')).resolves.toMatch(/^[0-9a-f-]{36}$/);
  });
});
