import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FeedbackVote } from './feedback-vote.entity';

export enum FeedbackType {
  BUG = 'bug',
  FEATURE = 'feature',
}

export enum FeedbackStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
    default: FeedbackType.FEATURE,
  })
  type: FeedbackType;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
  })
  status: FeedbackStatus;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator: User;

  @OneToMany(() => FeedbackVote, (vote) => vote.feedback)
  votes: FeedbackVote[];

  @Column({ default: 0 })
  score: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
