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
import { DropCategory, DropStatus } from '../../../common';
import { User } from '../../users/entities/user.entity';
import { DropActivityLog } from './drop-activity-log.entity';
import { DropCrew } from './drop-crew.entity';
import { DropSpark } from './drop-spark.entity';
import { DropItem } from './drop-item.entity';

@Entity('drops')
export class Drop {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @ApiProperty()
  @Column()
  location: string;

  @ApiProperty({ required: false, nullable: true, type: Number })
  @Column({ type: 'integer', nullable: true })
  expectedHeadcount?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  overview?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  coverPhoto?: string | null;

  @ApiProperty({ enum: DropStatus })
  @Column({ type: 'enum', enum: DropStatus, default: DropStatus.ACTIVE })
  status: DropStatus;

  @ApiProperty({ enum: DropCategory, required: false })
  @Column({ type: 'enum', enum: DropCategory, nullable: true })
  category?: DropCategory;

  @ApiProperty({ required: false, nullable: true, type: Number })
  @Column({ type: 'integer', nullable: true })
  minimumAge?: number | null;

  @ApiProperty()
  @Column({ unique: true })
  joinCode: string;

  @ApiProperty()
  @Column()
  shareUrl: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isPublic: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isLocked: boolean;
  
  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true, unique: true })
  idempotencyKey?: string | null;
  
  @ApiProperty()
  @Column()
  organiserId: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organiserId' })
  organiser: User;

  @OneToMany(() => DropActivityLog, (log) => log.drop)
  activityLogs: DropActivityLog[];

  @OneToMany(() => DropCrew, (crew) => crew.drop)
  crew: DropCrew[];

  @ApiProperty({ type: () => [DropSpark] })
  @OneToMany(() => DropSpark, (spark) => spark.drop)
  sparks: DropSpark[];

  @ApiProperty({ type: () => [DropItem] })
  @OneToMany(() => DropItem, (item) => item.drop)
  neededItems: DropItem[];

  @ApiProperty({ required: false })
  sparkCount?: number;

  @ApiProperty({ required: false })
  sparkedByViewer?: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
