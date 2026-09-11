import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotSessionService } from './chatbot-session.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateChatbotSessionTitleDto } from './dto/chatbot-session.dto';
import { ChatbotAskDto, ChatbotStreamResultDto } from './dto/chatbot.dto';

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
    @Body() body: ChatbotAskDto,
  ) {
    const result = await this.chatbotService.askQuestion(userId, body);
    return { data: result };
  }

  @Post('prepare')
  @UseGuards(OptionalJwtAuthGuard)
  async prepareContext(
    @CurrentUser('id') userId: number | undefined,
    @Body() body: ChatbotAskDto,
  ) {
    const result = await this.chatbotService.prepareContext(userId, body);
    return { data: result };
  }

  @Post('stream-result')
  @UseGuards(OptionalJwtAuthGuard)
  async persistStreamResult(
    @CurrentUser('id') userId: number | undefined,
    @Body() body: ChatbotStreamResultDto,
  ) {
    return this.chatbotService.persistStreamResult(userId, body);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@CurrentUser('id') userId: number) {
    return this.chatbotSessionService.listSessions(userId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @CurrentUser('id') userId: number,
    @Param('id') sessionId: string,
  ) {
    await this.chatbotSessionService.deleteSession(userId, sessionId);
  }

  @Patch('sessions/:id/title')
  @UseGuards(JwtAuthGuard)
  async updateSessionTitle(
    @CurrentUser('id') userId: number,
    @Param('id') sessionId: string,
    @Body() dto: UpdateChatbotSessionTitleDto,
  ) {
    return this.chatbotSessionService.updateSessionTitle(
      userId,
      sessionId,
      dto.title,
    );
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
