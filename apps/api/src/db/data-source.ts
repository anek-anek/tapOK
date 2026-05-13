import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve, join } from 'path';
import { Drop } from '../app/drops/entities/drop.entity';
import { DropActivityLog } from '../app/drops/entities/drop-activity-log.entity';
import { DropCrew } from '../app/drops/entities/drop-crew.entity';
import { DropPhoto } from '../app/drops/entities/drop-photo.entity';
import { DropSpark } from '../app/drops/entities/drop-spark.entity';
import { DropItem } from '../app/drops/entities/drop-item.entity';
import { DropItemAmot } from '../app/drops/entities/drop-item-amot.entity';
import { DropExpenseLog } from '../app/drops/entities/drop-expense-log.entity';
import { User } from '../app/users/entities/user.entity';
import { Notification } from '../app/notifications/entities/notification.entity';

dotenv.config({ path: resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'tapok',
  ssl: (process.env.DB_HOST ?? 'localhost') !== 'localhost' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [
    User,
    Drop,
    DropActivityLog,
    DropCrew,
    DropPhoto,
    DropSpark,
    DropItem,
    DropItemAmot,
    DropExpenseLog,
    Notification,
  ],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
});
