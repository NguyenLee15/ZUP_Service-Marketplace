import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { PrismaModule } from '../../prisma/prisma.module';

import { AiModule } from '../../shared/ai/ai.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ChatsModule } from '../chats/chats.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    BookingsModule,
    ChatsModule,
    ServicesModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
