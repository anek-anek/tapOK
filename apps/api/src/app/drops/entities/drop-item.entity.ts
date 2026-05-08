import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Drop } from './drop.entity';

@Entity('drop_items')
export class DropItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  dropId: string;

  @ApiProperty({ type: () => Drop })
  @ManyToOne(() => Drop, (drop) => drop.neededItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dropId' })
  drop: Drop;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  assignedUserId?: string | null;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser?: User | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isConfirmed: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
