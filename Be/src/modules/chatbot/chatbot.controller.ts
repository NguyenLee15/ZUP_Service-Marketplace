import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotSessionService } from './chatbot-session.service';
import type {
  ChatbotAskRequest,
  ChatbotStreamResultRequest,
} from './chatbot.types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly chatbotSessionService: ChatbotSessionService,
  ) {}

  @Post('ask')
  @UseGuards(OptionalJwtAuthGuard)
  async askQuestion(
    @CurrentUser('id') userId: number | undefined,
    @Body() body: ChatbotAskRequest,
  ) {
    const result = await this.chatbotService.askQuestion(userId, body);
    return { data: result };
  }

  @Post('prepare')
  @UseGuards(OptionalJwtAuthGuard)
  async prepareContext(
    @CurrentUser('id') userId: number | undefined,
    @Body() body: ChatbotAskRequest,
  ) {
    const result = await this.chatbotService.prepareContext(userId, body);
    return { data: result };
  }

  @Post('stream-result')
  @UseGuards(OptionalJwtAuthGuard)
  async persistStreamResult(
    @CurrentUser('id') userId: number | undefined,
    @Body() body: ChatbotStreamResultRequest,
  ) {
    return this.chatbotService.persistStreamResult(userId, body);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@CurrentUser('id') userId: number) {
    return this.chatbotSessionService.listSessions(userId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @CurrentUser('id') userId: number,
    @Param('id') sessionId: string,
  ) {
    return this.chatbotSessionService.deleteSession(userId, sessionId);
  }

  @Get('sessions/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getSessionHistory(
    @CurrentUser('id') userId: number,
    @Param('id') sessionId: string,
  ) {
    const result = await this.chatbotSessionService.getSessionHistory(
      userId,
      sessionId,
    );
    return { data: result };
  }
}
