import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — lấy user object từ JWT payload đã attach vào request.
 * Dùng trong controller: create(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
