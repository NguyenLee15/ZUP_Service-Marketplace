import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, tap, catchError } from 'rxjs';
import { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<{
      setHeader(name: string, value: string): void;
    }>();
    const { method, url } = req;
    const userId = req.user?.id ?? 'anon';
    const forwardedRequestId = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(forwardedRequestId)
        ? forwardedRequestId[0]
        : forwardedRequestId) || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(
          `${method} ${url} ${ms}ms [user:${userId}] [req:${requestId}]`,
        );
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `${method} ${url} ${ms}ms [user:${userId}] [req:${requestId}] ERROR: ${message}`,
        );
        throw err; // re-throw để AllExceptionsFilter xử lý
      }),
    );
  }
}
