import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { ChatsController } from './chats.controller';

import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../../shared/ai/ai.module';
import { isRedisQueueEnabled } from '../../config/runtime.config';

@Module({
  imports: [
    AiModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('app.jwtSecret'),
      }),
      inject: [ConfigService],
    }),
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'ai-queue' })]
      : []),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
  exports: [ChatsService, ChatsGateway],
})
export class ChatsModule {}
