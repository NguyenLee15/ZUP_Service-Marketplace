import {
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiTags('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  async getAll(
    @CurrentUser('id') userId: number,
    @Query() query: NotificationsQueryDto,
  ) {
    return this.notificationsService.getAll(userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: number) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markRead(userId, id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser('id') userId: number) {
    return this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.delete(userId, id);
  }
}
