import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { UsersController } from './app/users/users.controller';
import { OrganizationsController } from './app/organizations/organizations.controller';
import { UsersService } from './app/users/users.service';
import { UsersRepository } from './app/users/users.repository';
import { OrganizationsService } from './app/organizations/organizations.service';
import { OrganizationsRepository } from './app/organizations/organizations.repository';
import { User } from './app/users/entities/user.entity';
import { Organization } from './app/organizations/entities/organization.entity';
import { OrganizationMember } from './app/organizations/entities/organization-member.entity';
import { DropsController } from './app/drops/drops.controller';
import { DropsService } from './app/drops/drops.service';
import { DropsRepository } from './app/drops/drops.repository';
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
    ThrottlerModule.forRoot([
      { name: 'default', ...THROTTLE_DEFAULT },
      { name: 'strict', ...THROTTLE_STRICT },
    ]),
  ],
  controllers: [UsersController, OrganizationsController, DropsController],
  providers: [
    stub(UsersService),
    stub(UsersRepository),
    stub(OrganizationsService),
    stub(OrganizationsRepository),
    stub(getRepositoryToken(User)),
    stub(getRepositoryToken(Organization)),
    stub(getRepositoryToken(OrganizationMember)),
    stub(DropsService),
    stub(DropsRepository),
    stub(getRepositoryToken(Drop)),
    stub(getRepositoryToken(DropActivityLog)),
    stub(getRepositoryToken(DropCrew)),
    stub(getDataSourceToken()),
  ],
})
export class GenerateAppModule {}
