import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { UsersController } from './app/users/users.controller';
import { UsersService } from './app/users/users.service';
import { UsersRepository } from './app/users/users.repository';
import { User } from './app/users/entities/user.entity';
import { AuthEmailController } from './app/auth-email/auth-email.controller';
import { AuthEmailService } from './app/auth-email/auth-email.service';
import { BetterAuthService } from './common/better-auth/better-auth.service';
import { DropsController } from './app/drops/drops.controller';
import { DropsService } from './app/drops/drops.service';
import { DropsCronService } from './app/drops/drops-cron.service';
import { DropsRepository } from './app/drops/drops.repository';
import { NotificationsController } from './app/notifications/notifications.controller';
import { NotificationsService } from './app/notifications/notifications.service';
import { SupabaseStorageService } from './common';
import { Drop } from './app/drops/entities/drop.entity';
import { DropActivityLog } from './app/drops/entities/drop-activity-log.entity';
import { DropCrew } from './app/drops/entities/drop-crew.entity';
import { DropItem } from './app/drops/entities/drop-item.entity';
import { DropItemAmot } from './app/drops/entities/drop-item-amot.entity';
import { DropExpenseLog } from './app/drops/entities/drop-expense-log.entity';
import { Notification } from './app/notifications/entities/notification.entity';
import { THROTTLE_DEFAULT, THROTTLE_STRICT } from './common';

function stub<T>(token: T): { provide: T; useValue: object } {
  const proxy = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'then') return undefined;
      return () => Promise.resolve(null);
    },
  });
  return { provide: token, useValue: proxy };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ...THROTTLE_DEFAULT },
      { name: 'strict', ...THROTTLE_STRICT },
    ]),
  ],
  controllers: [UsersController, DropsController, AuthEmailController, NotificationsController],
  providers: [
    stub(UsersService),
    stub(AuthEmailService),
    stub(BetterAuthService),
    stub(UsersRepository),
    stub(getRepositoryToken(User)),
    stub(DropsService),
    stub(DropsCronService),
    stub(DropsRepository),
    stub(NotificationsService),
    stub(SupabaseStorageService),
    stub(getRepositoryToken(Drop)),
    stub(getRepositoryToken(DropActivityLog)),
    stub(getRepositoryToken(DropCrew)),
    stub(getRepositoryToken(DropItem)),
    stub(getRepositoryToken(DropItemAmot)),
    stub(getRepositoryToken(DropExpenseLog)),
    stub(getRepositoryToken(Notification)),
    stub(getDataSourceToken()),
  ],
})
export class GenerateAppModule {}
