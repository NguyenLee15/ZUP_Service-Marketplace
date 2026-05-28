import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: unknown;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T> | T> {
    const request = context.switchToHttp().getRequest<{ path?: string }>();
    const isRawVnpayIpn = request.path?.includes('/vnpay/ipn') ?? false;

    return next.handle().pipe(
      map((data: T): SuccessResponse<T> | T => {
        if (isRawVnpayIpn) {
          return data;
        }

        // Nếu response đã có field success → giữ nguyên (VNPay IPN trả raw)
        if (isRecord(data) && 'success' in data) {
          return data;
        }

        // Hỗ trợ trả { data, message? } từ service
        if (isRecord(data) && 'data' in data) {
          const message =
            typeof data.message === 'string' ? data.message : undefined;
          const meta = 'meta' in data ? data.meta : undefined;

          return {
            success: true as const,
            data: data.data as T,
            ...(message && { message }),
            ...(meta !== undefined && { meta }),
          };
        }

        return {
          success: true as const,
          data,
        };
      }),
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
