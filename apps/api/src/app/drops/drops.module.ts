import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';
import { DropsRepository } from './drops.repository';
import { DropsService } from './drops.service';
import { DropsController } from './drops.controller';
import { DropsCronService } from './drops-cron.service';
import { MediaAssetsService, SupabaseStorageService } from '../../common';

import { DropPhoto } from './entities/drop-photo.entity';
import { DropSpark } from './entities/drop-spark.entity';
import { DropItem } from './entities/drop-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Drop, DropActivityLog, DropCrew, DropPhoto, DropSpark, DropItem]), UsersModule, NotificationsModule],
  providers: [DropsRepository, DropsService, DropsCronService, SupabaseStorageService, MediaAssetsService],
  controllers: [DropsController],
  exports: [DropsService],
})
export class DropsModule {}
