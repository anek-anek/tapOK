import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropsRepository } from './drops.repository';
import { DropsService } from './drops.service';
import { DropsController } from './drops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Drop, DropActivityLog]), UsersModule],
  providers: [DropsRepository, DropsService],
  controllers: [DropsController],
  exports: [DropsService],
})
export class DropsModule {}
