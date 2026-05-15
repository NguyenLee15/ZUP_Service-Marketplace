import {
  Controller,
  Body,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatsService } from './chats.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async getConversations(@CurrentUser('id') userId: number) {
    return this.chatsService.getConversations(userId);
  }

  @Post('conversations')
  async getOrCreateConversation(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Body() body: { serviceId?: number; bookingId?: number },
  ) {
    return this.chatsService.getOrCreateConversationForUser(userId, role, body);
  }

  @Get(':conversationId/messages')
  async getHistory(
    @CurrentUser('id') userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatsService.getHistory(
      conversationId,
      userId,
      cursor ? parseInt(cursor) : undefined,
    );
  }

  @Get(':conversationId/smart-reply')
  async getSmartReplies(
    @CurrentUser('id') userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.chatsService.getSmartReplies(conversationId, userId);
  }
}
