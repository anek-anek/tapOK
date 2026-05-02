import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { UsersController } from './app/users/users.controller';
import { UsersService } from './app/users/users.service';
import { UsersRepository } from './app/users/users.repository';
import { User } from './app/users/entities/user.entity';
import { DropsController } from './app/drops/drops.controller';
import { DropsService } from './app/drops/drops.service';
import { DropsCronService } from './app/drops/drops-cron.service';
import { DropsRepository } from './app/drops/drops.repository';
import { SupabaseStorageService } from './common';
import { Drop } from './app/drops/entities/drop.entity';
import { DropActivityLog } from './app/drops/entities/drop-activity-log.entity';
import { DropCrew } from './app/drops/entities/drop-crew.entity';
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
  controllers: [UsersController, DropsController],
  providers: [
    stub(UsersService),
    stub(UsersRepository),
    stub(getRepositoryToken(User)),
    stub(DropsService),
    stub(DropsCronService),
    stub(DropsRepository),
    stub(SupabaseStorageService),
    stub(getRepositoryToken(Drop)),
    stub(getRepositoryToken(DropActivityLog)),
    stub(getRepositoryToken(DropCrew)),
    stub(getDataSourceToken()),
  ],
})
export class GenerateAppModule {}
