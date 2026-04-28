import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DropCrewStatus } from '../../../common';
import { User } from '../../users/entities/user.entity';
import { Drop } from './drop.entity';

@Entity('drop_crew')
@Unique(['dropId', 'userId'])
export class DropCrew {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  dropId: string;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty({ enum: DropCrewStatus })
  @Column({ type: 'enum', enum: DropCrewStatus, default: DropCrewStatus.IN })
  status: DropCrewStatus;

  @ApiProperty({ default: false })
  @Column({ type: 'boolean', default: false })
  isPresent: boolean;

  @ApiProperty()
  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Drop, (drop) => drop.crew, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dropId' })
  drop: Drop;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
