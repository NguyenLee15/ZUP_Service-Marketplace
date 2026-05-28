import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import {
  AuthenticatedSocket,
  extractSocketToken,
  isJwtTokenPayload,
  toAuthenticatedUser,
} from '../types/auth.types';

/**
 * WsGuard — xác thực token từ handshake.headers.authorization
 * trước khi cho phép join room chat/notification.
 */
@Injectable()
export class WsGuard implements CanActivate {
  private readonly logger = new Logger('WsGuard');

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = extractSocketToken(client);

    if (!token) {
      this.logger.warn('WebSocket connection rejected: no token');
      throw new WsException('Unauthorized');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      if (!isJwtTokenPayload(payload)) {
        throw new WsException('Unauthorized');
      }

      client.data.user = toAuthenticatedUser(payload);
      return true;
    } catch {
      this.logger.warn('WebSocket connection rejected: invalid token');
      throw new WsException('Unauthorized');
    }
  }
}
