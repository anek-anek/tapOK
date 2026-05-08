import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common';
import type { BetterAuthUser } from '../../common/better-auth/better-auth.service';
import { NotificationsService } from './notifications.service';
import { NotificationDto, NotificationsPageDto, UnreadCountDto } from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for the current user' })
  @ApiResponse({ status: 200, type: NotificationsPageDto })
  async findAll(
    @AuthUser() user: BetterAuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ): Promise<NotificationsPageDto> {
    const result = await this.notificationsService.findAll(user.id, page, limit);
    return {
      data: result.data.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        metadata: n.metadata,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, type: UnreadCountDto })
  async getUnreadCount(@AuthUser() user: BetterAuthUser): Promise<UnreadCountDto> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200 })
  async markAllRead(@AuthUser() user: BetterAuthUser): Promise<void> {
    await this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200 })
  async markRead(
    @AuthUser() user: BetterAuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notificationsService.markRead(user.id, id);
  }
}
