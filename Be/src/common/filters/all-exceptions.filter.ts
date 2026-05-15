import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes } from '../errors/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCodes.INTERNAL_ERROR;
    let message = 'Lỗi hệ thống. Vui lòng thử lại sau.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;
        // Hỗ trợ format: throw new BadRequestException({ code: '...', message: '...' })
        code = resp.code || resp.error || this.statusToCode(status);
        message = resp.message || exception.message;

        // class-validator trả về mảng message
        if (Array.isArray(message)) {
          message = message.join('; ');
        }
      } else {
        code = this.statusToCode(status);
        message = exceptionResponse;
      }
    }

    // Logging theo quy tắc ARCHITECTURE.md mục 18.2
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${code}: ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400:
        return ErrorCodes.VALIDATION_ERROR;
      case 401:
        return ErrorCodes.UNAUTHORIZED;
      case 403:
        return ErrorCodes.FORBIDDEN;
      case 404:
        return ErrorCodes.NOT_FOUND;
      case 500:
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }
}
