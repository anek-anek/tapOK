import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Drop } from './drop.entity';

export enum ExpenseLogStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('drop_expense_logs')
export class DropExpenseLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  dropId: string;

  @ManyToOne(() => Drop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dropId' })
  drop: Drop;

  @ApiProperty()
  @Column()
  submittedById: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User;

  @ApiProperty()
  @Column()
  description: string;

  @ApiProperty({ type: Number })
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ enum: ExpenseLogStatus })
  @Column({ type: 'enum', enum: ExpenseLogStatus, default: ExpenseLogStatus.PENDING })
  status: ExpenseLogStatus;

  @ApiPropertyOptional({ nullable: true })
  @Column({ nullable: true })
  reviewedById?: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy?: User | null;

  @ApiPropertyOptional({ nullable: true, description: 'ID of the DropItem created when this log was approved' })
  @Column({ nullable: true, type: 'uuid' })
  linkedItemId?: string | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
