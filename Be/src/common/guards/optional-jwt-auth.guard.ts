import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      request.user = null;
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser) {
    if (err || !user) return null;
    return user;
  }
}
