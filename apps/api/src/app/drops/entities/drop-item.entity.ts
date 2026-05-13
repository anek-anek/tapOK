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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Drop } from './drop.entity';
import { DropItemAmot } from './drop-item-amot.entity';

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
  @ManyToOne(() => User, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser?: User | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isConfirmed: boolean;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isAssignable: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  amotCost?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ nullable: true })
  amotDeclaredById?: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'amotDeclaredById' })
  amotDeclaredBy?: User | null;

  @OneToMany(() => DropItemAmot, (a) => a.item)
  amotEntries?: DropItemAmot[];

  @ApiPropertyOptional({ nullable: true, description: 'ID of the expense log that was promoted into this item' })
  @Column({ nullable: true, type: 'uuid' })
  sourceExpenseLogId?: string | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
