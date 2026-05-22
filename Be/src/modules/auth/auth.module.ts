import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../../shared/mail/mail.module';

import { AuthProcessor } from './auth.processor';
import {
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          secret: configService.getOrThrow<string>('app.jwtSecret'),
          signOptions: {
            expiresIn: configService.get<string>('app.jwtExpiresIn') || '30m',
          },
        }) as any,
      inject: [ConfigService],
    }),
    MailModule,
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'auth-queue' })]
      : []),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ...(isWorkerEnabled() ? [AuthProcessor] : []),
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
