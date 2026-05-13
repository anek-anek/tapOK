import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DropCrewMemberRole, DropCrewStatus } from '../../../common';
import { User } from '../../users/entities/user.entity';
import { Drop } from './drop.entity';

@Entity('drop_crew')
@Unique(['dropId', 'userId'])
@Index('idx_drop_crew_user_status', ['userId', 'status'])
@Index('idx_drop_crew_drop_status', ['dropId', 'status'])
export class DropCrew {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index('idx_drop_crew_drop_id')
  @Column()
  dropId: string;

  @ApiProperty()
  @Index('idx_drop_crew_user_id')
  @Column()
  userId: string;

  @ApiProperty({ enum: DropCrewMemberRole, default: DropCrewMemberRole.CREW })
  @Column({ type: 'enum', enum: DropCrewMemberRole, default: DropCrewMemberRole.CREW })
  memberRole: DropCrewMemberRole;

  @ApiProperty({ enum: DropCrewStatus })
  @Column({ type: 'enum', enum: DropCrewStatus, default: DropCrewStatus.IN })
  status: DropCrewStatus;

  @ApiProperty({ default: false })
  @Column({ type: 'boolean', default: false })
  isPresent: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  amotPaidAt?: Date | null;

  @ApiProperty({ default: 0 })
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amotPaidAmount: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  amotProofPath?: string | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;

  @ManyToOne(() => Drop, (drop) => drop.crew, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dropId' })
  drop: Drop;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
