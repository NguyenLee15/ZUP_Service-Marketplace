import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticatedUserPayload,
  JwtTokenPayload,
  toAuthenticatedUser,
} from '../../../common/types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.getOrThrow<string>('app.jwtSecret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /** Passport tự gọi, kết quả được gán vào request.user */
  validate(payload: JwtTokenPayload): AuthenticatedUserPayload {
    return toAuthenticatedUser(payload);
  }
}
