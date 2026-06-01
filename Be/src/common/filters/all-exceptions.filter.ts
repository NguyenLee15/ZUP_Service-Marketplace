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

type RequestWithId = Request & { requestId?: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCodes.INTERNAL_ERROR;
    let message = 'Lỗi hệ thống. Vui lòng thử lại sau.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        // Hỗ trợ format: throw new BadRequestException({ code: '...', message: '...' })
        code =
          this.stringValue(resp.code) ??
          this.stringValue(resp.error) ??
          this.statusToCode(status);
        const responseMessage =
          this.messageValue(resp.message) ?? exception.message;
        message = Array.isArray(responseMessage)
          ? responseMessage.join('; ')
          : responseMessage;
        details = resp.details;

        // class-validator trả về mảng message
      } else {
        code = this.statusToCode(status);
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message;
      }
    }

    // Logging theo quy tắc ARCHITECTURE.md mục 18.2
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${code}: ${message}`,
      );
    }

    const errorDetails =
      request.requestId || details !== undefined
        ? {
            ...(details !== undefined && { details }),
            ...(request.requestId && { requestId: request.requestId }),
          }
        : undefined;

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(errorDetails !== undefined && { details: errorDetails }),
      },
    });
  }

  private statusToCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private messageValue(value: unknown): string | string[] | undefined {
    if (typeof value === 'string') return value;
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      return value;
    }
    return undefined;
  }
}
