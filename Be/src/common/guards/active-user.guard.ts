import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { ErrorCodes } from '../errors/error-codes';
import { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Chưa đăng nhập hoặc phiên đăng nhập không hợp lệ',
      });
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message:
          'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    if (user.status && user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản chưa được kích hoạt hoặc không khả dụng.',
      });
    }

    return true;
  }
}
