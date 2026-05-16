import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
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
      useFactory: (configService: ConfigService) =>
        ({
          secret:
            configService.get<string>('app.jwtSecret') || 'fallback-secret',
        }) as any,
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
