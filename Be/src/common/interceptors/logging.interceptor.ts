import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url } = req;
    const userId = req.user?.id ?? 'anon';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} ${ms}ms [user:${userId}]`);
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `${method} ${url} ${ms}ms [user:${userId}] ERROR: ${message}`,
        );
        throw err; // re-throw để AllExceptionsFilter xử lý
      }),
    );
  }
}
