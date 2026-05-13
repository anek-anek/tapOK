import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { DropItem } from './drop-item.entity';

@Entity('drop_item_amots')
@Unique(['itemId', 'userId'])
export class DropItemAmot {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  itemId: string;

  @ManyToOne(() => DropItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: DropItem;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isOptedOut: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isPaid: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
