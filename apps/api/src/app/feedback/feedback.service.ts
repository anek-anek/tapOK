import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Feedback, FeedbackType, FeedbackStatus } from './entities/feedback.entity';
import { FeedbackVote } from './entities/feedback-vote.entity';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly feedbackRepository: Repository<Feedback>;
  private readonly voteRepository: Repository<FeedbackVote>;

  constructor(private readonly dataSource: DataSource) {
    this.feedbackRepository = this.dataSource.getRepository(Feedback);
    this.voteRepository = this.dataSource.getRepository(FeedbackVote);
  }

  async findAll(type?: FeedbackType, userId?: string, sortBy: 'createdAt' | 'score' = 'createdAt') {
    const query = this.feedbackRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.creator', 'creator');

    if (sortBy === 'score') {
      query.orderBy('f.score', 'DESC').addOrderBy('f.createdAt', 'DESC');
    } else {
      query.orderBy('f.createdAt', 'DESC');
    }

    if (type) {
      query.andWhere('f.type = :type', { type });
    }

    const feedbacks = await query.getMany();

    if (userId) {
      const userVotes = await this.voteRepository.find({
        where: { userId },
      });
      const voteMap = new Map(userVotes.map((v) => [v.feedbackId, v.value]));
      
      return feedbacks.map((f) => ({
        ...f,
        viewerVote: voteMap.get(f.id) || 0,
      }));
    }

    return feedbacks.map(f => ({
        ...f,
        viewerVote: 0
    }));
  }

  async create(dto: CreateFeedbackDto, creatorId: string) {
    const feedback = this.feedbackRepository.create({
      ...dto,
      creatorId,
      status: FeedbackStatus.PENDING,
      score: 0,
    });
    return this.feedbackRepository.save(feedback);
  }

  async vote(feedbackId: string, userId: string, value: number) {
    const feedback = await this.feedbackRepository.findOne({ where: { id: feedbackId } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    const existingVote = await this.voteRepository.findOne({
      where: { feedbackId, userId },
    });

    await this.dataSource.transaction(async (manager) => {
      const feedbackRepo = manager.getRepository(Feedback);
      const voteRepo = manager.getRepository(FeedbackVote);

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote if clicking the same button
          await voteRepo.remove(existingVote);
          await feedbackRepo.decrement({ id: feedbackId }, 'score', value);
        } else {
          // Change vote
          const diff = value - existingVote.value; // e.g. 1 - (-1) = 2
          existingVote.value = value;
          await voteRepo.save(existingVote);
          await feedbackRepo.increment({ id: feedbackId }, 'score', diff);
        }
      } else {
        // New vote
        const newVote = voteRepo.create({ feedbackId, userId, value });
        await voteRepo.save(newVote);
        await feedbackRepo.increment({ id: feedbackId }, 'score', value);
      }
    });

    return this.feedbackRepository.findOne({ where: { id: feedbackId } });
  }

  async updateStatus(id: string, status: FeedbackStatus) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    feedback.status = status;
    return this.feedbackRepository.save(feedback);
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    if (feedback.creatorId !== userId && !isAdmin) {
      throw new BadRequestException('Not authorized');
    }

    return this.feedbackRepository.remove(feedback);
  }
}
