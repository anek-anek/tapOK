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
import { User } from '../../users/entities/user.entity';
import { Drop } from './drop.entity';

@Entity('drop_sparks')
@Unique(['dropId', 'userId'])
export class DropSpark {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index('idx_drop_sparks_drop_id')
  @Column()
  dropId: string;

  @ApiProperty()
  @Index('idx_drop_sparks_user_id')
  @Column()
  userId: string;

  @ManyToOne(() => Drop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dropId' })
  drop: Drop;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
