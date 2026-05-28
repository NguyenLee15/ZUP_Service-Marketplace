import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ErrorCodes } from '../errors/error-codes';
import { AuthenticatedRequest } from '../types/auth.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu endpoint không yêu cầu permission cụ thể → cho qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Không đủ quyền truy cập',
      });
    }

    // ADMIN luôn có toàn quyền, bypass qua kiểm tra permission
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Nếu không phải STAFF hoặc ADMIN -> Từ chối truy cập
    if (user.role !== UserRole.STAFF) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Không đủ quyền truy cập',
      });
    }

    // Tìm thông tin permissions trong cơ sở dữ liệu thật (Real-time DB query)
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { permissions: true },
    });

    if (!dbUser) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Không tìm thấy thông tin tài khoản',
      });
    }

    const userPermissions = dbUser.permissions || [];

    // Kiểm tra xem nhân viên có ít nhất một trong các permission yêu cầu không (OR logic)
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Bạn không có quyền thực hiện hành động này trong module tương ứng',
      });
    }

    return true;
  }
}
