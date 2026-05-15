import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import vnpayConfig from './config/vnpay.config';
import cloudinaryConfig from './config/cloudinary.config';
import mailConfig from './config/mail.config';
import aiConfig from './config/ai.config';
import runtimeConfig, { isRedisQueueEnabled } from './config/runtime.config';

// Core
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { JobsModule } from './shared/jobs/jobs.module';

// Health
import { HealthController } from './modules/health/health.controller';

// Business modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ProviderWalletsModule } from './modules/provider-wallets/provider-wallets.module';
import { ChatsModule } from './modules/chats/chats.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { StorageModule } from './modules/storage/storage.module';
import { SettingsModule } from './modules/settings/settings.module';

const throttleTtl = Number(process.env.THROTTLE_TTL || 60000);
const throttleLimit = Number(process.env.THROTTLE_LIMIT || 100);

@Module({
  imports: [
    // Config — đọc .env, inject vào toàn bộ app
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        vnpayConfig,
        cloudinaryConfig,
        mailConfig,
        aiConfig,
        runtimeConfig,
      ],
    }),

    // Schedule — cho cronjob registry
    ScheduleModule.forRoot(),

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Rate Limiting (Chống Spam/DDoS) - 100 reqs/phút
    ThrottlerModule.forRoot([
      {
        ttl: Number.isFinite(throttleTtl) ? throttleTtl : 60000,
        limit: Number.isFinite(throttleLimit) ? throttleLimit : 100,
      },
    ]),

    // Core modules
    PrismaModule,
    RedisModule,
    JobsModule,
    ...(isRedisQueueEnabled()
      ? [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              connection: {
                host: configService.get('redis.host'),
                port: configService.get('redis.port'),
                password: configService.get('redis.password'),
                tls: configService.get('redis.tls'),
              },
            }),
            inject: [ConfigService],
          }),
        ]
      : []),

    // Business modules
    AuthModule,
    UsersModule,
    CategoriesModule,
    ServicesModule,
    BookingsModule,
    ProviderWalletsModule,
    ChatsModule,
    NotificationsModule,
    ReviewsModule,
    AdminModule,
    ChatbotModule,
    StorageModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
