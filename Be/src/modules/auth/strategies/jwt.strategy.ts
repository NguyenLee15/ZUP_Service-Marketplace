import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import {
  AuthenticatedUserPayload,
  JwtTokenPayload,
} from '../../../common/types/auth.types';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCodes } from '../../../common/errors/error-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.getOrThrow<string>('app.jwtSecret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /** Passport tự gọi, kết quả được gán vào request.user */
  async validate(payload: JwtTokenPayload): Promise<AuthenticatedUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Tài khoản không tồn tại hoặc phiên đăng nhập không hợp lệ',
      });
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message:
          'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản chưa được kích hoạt hoặc không khả dụng.',
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
