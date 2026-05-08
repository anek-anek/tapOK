import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from '../../common';
import { EmailService } from '../../common/email/email.service';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

const EMAIL_TRIGGER_TYPES = new Set<NotificationType>([
  NotificationType.JOIN_REQUESTED,
  NotificationType.JOIN_APPROVED,
  NotificationType.JOIN_REJECTED,
  NotificationType.DROP_STARTING_SOON,
]);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
    private readonly emailService: EmailService,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, string | null> | null,
    emailContext?: { email: string; dropUrl?: string; scheduledAt?: Date },
  ): Promise<Notification> {
    const notification = this.repo.create({
      userId,
      type,
      title,
      body,
      metadata: metadata ?? null,
      isRead: false,
    });
    const saved = await this.repo.save(notification);

    this.gateway.emit(userId, 'notification', saved);

    if (EMAIL_TRIGGER_TYPES.has(type) && emailContext?.email) {
      this.sendEmail(type, emailContext.email, title, body, emailContext.dropUrl, emailContext.scheduledAt).catch(
        (err) => this.logger.warn(`Failed to send notification email (type=${type}): ${err}`),
      );
    }

    return saved;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 30,
  ): Promise<{ data: Notification[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) || 0 };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.countBy({ userId, isRead: false });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  private async sendEmail(
    type: NotificationType,
    email: string,
    title: string,
    body: string,
    dropUrl?: string,
    scheduledAt?: Date,
  ): Promise<void> {
    switch (type) {
      case NotificationType.JOIN_REQUESTED:
        await this.emailService.sendJoinRequestEmail(email, title, body, dropUrl);
        break;
      case NotificationType.JOIN_APPROVED:
        await this.emailService.sendJoinApprovedEmail(email, title, body, dropUrl);
        break;
      case NotificationType.JOIN_REJECTED:
        await this.emailService.sendJoinRejectedEmail(email, title, body);
        break;
      case NotificationType.DROP_STARTING_SOON:
        await this.emailService.sendDropStartingSoonEmail(email, title, body, dropUrl, scheduledAt);
        break;
    }
  }
}
