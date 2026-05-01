import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';
import { DropsRepository } from './drops.repository';
import { DropsService } from './drops.service';
import { DropsController } from './drops.controller';
import { DropsCronService } from './drops-cron.service';
import { SupabaseStorageService } from '../../common';

@Module({
  imports: [TypeOrmModule.forFeature([Drop, DropActivityLog, DropCrew]), UsersModule],
  providers: [DropsRepository, DropsService, DropsCronService, SupabaseStorageService],
  controllers: [DropsController],
  exports: [DropsService],
})
export class DropsModule {}
