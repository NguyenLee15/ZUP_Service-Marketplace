import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotDraftService } from './chatbot-draft.service';
import { ChatbotFormatterService } from './chatbot-formatter.service';
import { ChatbotIntentService } from './chatbot-intent.service';
import { ChatbotService } from './chatbot.service';
import { ChatbotPersistenceService } from './chatbot-persistence.service';
import { ChatbotSessionService } from './chatbot-session.service';
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
  providers: [
    ChatbotService,
    ChatbotDraftService,
    ChatbotFormatterService,
    ChatbotIntentService,
    ChatbotPersistenceService,
    ChatbotSessionService,
  ],
})
export class ChatbotModule {}
