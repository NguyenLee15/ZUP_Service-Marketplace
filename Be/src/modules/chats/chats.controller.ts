import {
  Controller,
  Body,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatsService } from './chats.service';
import { ChatHistoryQueryDto, CreateConversationDto } from './dto/chats.dto';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiTags('chats')
@ApiBearerAuth()
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List current user conversations' })
  async getConversations(@CurrentUser('id') userId: number) {
    return this.chatsService.getConversations(userId);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Upload chat image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh');
    }
    const uploaded = await this.cloudinaryService.uploadFile(
      file.buffer,
      'chat_images',
    );
    return {
      success: true,
      data: {
        imageUrl: uploaded.url,
      },
    };
  }

  @Post('conversations')
  async getOrCreateConversation(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Body() body: CreateConversationDto,
  ) {
    return this.chatsService.getOrCreateConversationForUser(userId, role, body);
  }

  @Get(':conversationId/messages')
  async getHistory(
    @CurrentUser('id') userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query() query: ChatHistoryQueryDto,
  ) {
    return this.chatsService.getHistory(conversationId, userId, query.cursor);
  }

  @Get(':conversationId/smart-reply')
  async getSmartReplies(
    @CurrentUser('id') userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.chatsService.getSmartReplies(conversationId, userId);
  }

  @Patch('messages/:messageId/recall')
  async recallMessage(
    @CurrentUser('id') userId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return { data: await this.chatsService.recallMessage(messageId, userId) };
  }
}
