import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Feedback } from './feedback.entity';

@Entity('feedback_votes')
@Unique(['feedbackId', 'userId'])
export class FeedbackVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  feedbackId: string;

  @ManyToOne(() => Feedback, (feedback) => feedback.votes, { onDelete: 'CASCADE' })
  feedback: Feedback;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'int' })
  value: number; // 1 for BOOST, -1 for JAM

  @CreateDateColumn()
  createdAt: Date;
}
