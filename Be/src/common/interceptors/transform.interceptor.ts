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
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Nếu response đã có field success → giữ nguyên (VNPay IPN trả raw)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Hỗ trợ trả { data, message? } từ service
        if (data && typeof data === 'object' && 'data' in data) {
          return {
            success: true as const,
            data: data.data,
            ...(data.message && { message: data.message }),
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
