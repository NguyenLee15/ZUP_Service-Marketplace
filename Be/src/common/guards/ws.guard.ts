import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WsGuard — xác thực token từ handshake.headers.authorization
 * trước khi cho phép join room chat/notification.
 */
@Injectable()
export class WsGuard implements CanActivate {
  private readonly logger = new Logger('WsGuard');

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn('WebSocket connection rejected: no token');
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attach user info vào socket data
      (client as any).user = payload;
      return true;
    } catch {
      this.logger.warn('WebSocket connection rejected: invalid token');
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader =
      client.handshake?.headers?.authorization ||
      (client.handshake?.auth as any)?.token;

    if (!authHeader) return null;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return typeof authHeader === 'string' ? authHeader : null;
  }
}
