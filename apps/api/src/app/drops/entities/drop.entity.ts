import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DropStatus } from '../../../common';
import { User } from '../../users/entities/user.entity';
import { DropActivityLog } from './drop-activity-log.entity';
import { DropCrew } from './drop-crew.entity';

@Entity('drops')
export class Drop {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @ApiProperty()
  @Column()
  location: string;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  expectedHeadcount?: number;

  @ApiProperty({ enum: DropStatus })
  @Column({ type: 'enum', enum: DropStatus, default: DropStatus.ACTIVE })
  status: DropStatus;

  @ApiProperty()
  @Column({ unique: true })
  joinCode: string;

  @ApiProperty()
  @Column()
  shareUrl: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isLocked: boolean;

  @ApiProperty()
  @Column()
  organiserId: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'organiserId' })
  organiser: User;

  @OneToMany(() => DropActivityLog, (log) => log.drop)
  activityLogs: DropActivityLog[];

  @OneToMany(() => DropCrew, (crew) => crew.drop)
  crew: DropCrew[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
