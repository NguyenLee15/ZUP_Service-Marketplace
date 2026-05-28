import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  isAuthenticatedUserKey,
} from '../types/auth.types';

/**
 * @CurrentUser() — lấy user object từ JWT payload đã attach vào request.
 * Dùng trong controller: create(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!data) return user;
    return isAuthenticatedUserKey(data) ? user?.[data] : undefined;
  },
);
