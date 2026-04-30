import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Drop } from './drop.entity';
import { User } from '../../users/entities/user.entity';

@Entity('drop_activity_logs')
export class DropActivityLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  dropId: string;

  @ManyToOne(() => Drop, (drop) => drop.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dropId' })
  drop: Drop;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty()
  @Column()
  action: string;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  changedFields?: Record<string, unknown>;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

}
