import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Not, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DropCategory, DropCrewStatus, DropStatus } from '../../common';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';

import { DropPhoto } from './entities/drop-photo.entity';
import { DropSpark } from './entities/drop-spark.entity';

@Injectable()
export class DropsRepository {
  constructor(
    @InjectRepository(Drop)
    private readonly dropRepo: Repository<Drop>,
    @InjectRepository(DropActivityLog)
    private readonly logRepo: Repository<DropActivityLog>,
    @InjectRepository(DropCrew)
    private readonly crewRepo: Repository<DropCrew>,
    @InjectRepository(DropPhoto)
    private readonly photoRepo: Repository<DropPhoto>,
    @InjectRepository(DropSpark)
    private readonly sparkRepo: Repository<DropSpark>,
  ) {}

  findById(id: string): Promise<Drop | null> {
    return this.dropRepo.findOne({
      where: { id },
      relations: { organiser: true, activityLogs: { user: true }, sparks: true },
      order: { activityLogs: { createdAt: 'DESC' } },
    });
  }

  findByOrganiserId(organiserId: string): Promise<Drop[]> {
    return this.dropRepo.find({
      where: { organiserId },
      relations: { organiser: true, sparks: true },
      order: { scheduledAt: 'ASC' },
    });
  }

  findInvolvedDrops(userId: string): Promise<Drop[]> {
    return this.dropRepo.createQueryBuilder('drop')
      .leftJoinAndSelect('drop.organiser', 'organiser')
      .leftJoin('drop.crew', 'crew')
      .where('drop.organiserId = :userId', { userId })
      .orWhere('crew.userId = :userId AND crew.status IN (:...statuses)', {
        userId,
        statuses: [DropCrewStatus.IN, DropCrewStatus.PENDING]
      })
      .orderBy('drop.scheduledAt', 'ASC')
      .getMany();
  }

  findFeed(userId: string): Promise<Drop[]> {
    return this.dropRepo.createQueryBuilder('drop')
      .leftJoinAndSelect('drop.organiser', 'organiser')
      .leftJoin('drop.crew', 'crew_me', 'crew_me.userId = :userId', { userId })
      .leftJoinAndSelect('drop.crew', 'crew')
      .leftJoinAndSelect('crew.user', 'user')
      .leftJoinAndSelect('drop.sparks', 'sparks')
      .where('drop.organiserId = :userId', { userId })
      .orWhere('crew_me.userId = :userId AND crew_me.status = :accepted', {
        userId,
        accepted: DropCrewStatus.IN,
      })
      .orderBy('drop.scheduledAt', 'DESC')
      .getMany();
  }

  findByJoinCode(joinCode: string): Promise<Drop | null> {
    return this.dropRepo.findOne({
      where: { joinCode },
      relations: { organiser: true, sparks: true },
    });
  }

  joinCodeExists(joinCode: string): Promise<boolean> {
    return this.dropRepo.existsBy({ joinCode });
  }

  async create(data: Partial<Drop>): Promise<Drop> {
    const drop = this.dropRepo.create(data);
    return this.dropRepo.save(drop);
  }

  async update(
    id: string,
    data: Partial<Pick<Drop, 'name' | 'scheduledAt' | 'location' | 'status' | 'isLocked' | 'isPublic' | 'category' | 'overview' | 'coverPhoto'>> & {
      expectedHeadcount?: number | null;
    },
  ): Promise<void> {
    await this.dropRepo.update(id, data);
  }

  async writeLog(data: Partial<DropActivityLog>): Promise<DropActivityLog> {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }

  findCrewMember(dropId: string, userId: string): Promise<DropCrew | null> {
    return this.crewRepo.findOneBy({ dropId, userId });
  }

  /** Crew admitted to participate (visibility for private drops, etc.). */
  findActiveInCrewMember(dropId: string, userId: string): Promise<DropCrew | null> {
    return this.crewRepo.findOneBy({ dropId, userId, status: DropCrewStatus.IN });
  }

  findCrewMembers(dropId: string): Promise<DropCrew[]> {
    return this.crewRepo.find({
      where: { dropId },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async addCrewMember(dropId: string, userId: string, status: DropCrewStatus, isPresent: boolean = false): Promise<DropCrew> {
    const record = this.crewRepo.create({ dropId, userId, status, isPresent });
    return this.crewRepo.save(record);
  }

  async removeCrewMember(dropId: string, userId: string): Promise<void> {
    await this.crewRepo.delete({ dropId, userId });
  }

  async updateCrewStatus(dropId: string, userId: string, status: DropCrewStatus, isPresent?: boolean): Promise<void> {
    const updateData: any = { status };
    if (isPresent !== undefined) {
      updateData.isPresent = isPresent;
    }
    await this.crewRepo.update({ dropId, userId }, updateData);
  }

  async updateCrewPresence(dropId: string, userId: string, isPresent: boolean): Promise<void> {
    await this.crewRepo.update({ dropId, userId }, { isPresent });
  }

  findActiveDueForOngoing(now: Date): Promise<Drop[]> {
    return this.dropRepo.find({
      where: { status: DropStatus.ACTIVE, scheduledAt: LessThanOrEqual(now) },
      select: ['id', 'organiserId'],
    });
  }

  findOngoingDueForCompletion(cutoff: Date): Promise<Drop[]> {
    return this.dropRepo.find({
      where: { status: DropStatus.ONGOING, scheduledAt: LessThanOrEqual(cutoff) },
      select: ['id', 'organiserId'],
    });
  }

  async bulkTransitionStatus(ids: string[], status: DropStatus): Promise<void> {
    if (ids.length === 0) return;
    await this.dropRepo
      .createQueryBuilder()
      .update(Drop)
      .set({ status })
      .whereInIds(ids)
      .execute();
  }

  async bulkWriteLogs(entries: Partial<DropActivityLog>[]): Promise<void> {
    if (entries.length === 0) return;
    const logs = this.logRepo.create(entries);
    await this.logRepo.save(logs);
  }

  findActivityFeedForUser(userId: string): Promise<DropActivityLog[]> {
    return this.logRepo
      .createQueryBuilder('log')
      .innerJoinAndSelect('log.drop', 'drop')
      .innerJoinAndSelect('log.user', 'user')
      .where('log.userId = :userId', { userId })
      .orWhere('drop.organiserId = :userId', { userId })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
  }

  async findPaginatedActivityLogs(
    dropId: string,
    page: number,
    limit: number,
  ): Promise<{ data: DropActivityLog[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.logRepo.findAndCount({
      where: { dropId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findUpcomingDropsByChiefs(chiefIds: string[], category?: DropCategory): Promise<Drop[]> {
    if (chiefIds.length === 0) return [];
    const where: any = {
      organiserId: In(chiefIds),
      status: In([DropStatus.ACTIVE, DropStatus.ONGOING]),
      isPublic: true,
    };
    if (category) {
      where.category = category;
    }
    return this.dropRepo.find({
      where,
      relations: { organiser: true, sparks: true },
      order: { scheduledAt: 'ASC' },
    });
  }

  async findRecentJoinedChiefIds(userId: string, limit: number = 3): Promise<string[]> {
    const joined = await this.crewRepo.createQueryBuilder('crew')
      .innerJoinAndSelect('crew.drop', 'drop')
      .where('crew.userId = :userId', { userId })
      .andWhere('crew.status = :status', { status: DropCrewStatus.IN })
      .andWhere('drop.organiserId != :userId', { userId })
      .orderBy('crew.joinedAt', 'DESC')
      .limit(20)
      .getMany();

    return Array.from(new Set(joined.map((c) => c.drop.organiserId))).slice(0, limit);
  }

  async findPublicDrops(
    page: number = 1,
    limit: number = 6,
    category?: DropCategory,
    excludeIds: string[] = []
  ): Promise<{ data: Drop[]; total: number; page: number; totalPages: number }> {
    const where: any = {
      isPublic: true,
      status: In([DropStatus.ACTIVE, DropStatus.ONGOING]),
    };

    if (category) {
      where.category = category;
    }

    if (excludeIds.length > 0) {
      where.id = Not(In(excludeIds));
    }

    const [data, total] = await this.dropRepo.findAndCount({
      where,
      relations: { organiser: true, sparks: true },
      order: { scheduledAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  findPhotos(dropId: string): Promise<DropPhoto[]> {
    return this.photoRepo.find({
      where: { dropId },
      order: { createdAt: 'DESC' },
      relations: { user: true },
      select: {
        id: true,
        dropId: true,
        userId: true,
        url: true,
        base64: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    });
  }

  findPhotoById(id: string): Promise<DropPhoto | null> {
    return this.photoRepo.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  countPhotosByUser(dropId: string, userId: string): Promise<number> {
    return this.photoRepo.countBy({ dropId, userId });
  }

  countTotalPhotos(dropId: string): Promise<number> {
    return this.photoRepo.countBy({ dropId });
  }

  async addPhoto(data: Partial<DropPhoto>): Promise<DropPhoto> {
    const photo = this.photoRepo.create(data);
    return this.photoRepo.save(photo);
  }

  async updatePhoto(id: string, data: QueryDeepPartialEntity<DropPhoto>): Promise<void> {
    await this.photoRepo.update(id, data);
  }

  async deletePhoto(id: string): Promise<void> {
    await this.photoRepo.delete(id);
  }
  
  async addSpark(dropId: string, userId: string): Promise<DropSpark> {
    const spark = this.sparkRepo.create({ dropId, userId });
    return this.sparkRepo.save(spark);
  }

  async removeSpark(dropId: string, userId: string): Promise<void> {
    await this.sparkRepo.delete({ dropId, userId });
  }

  async findSpark(dropId: string, userId: string): Promise<DropSpark | null> {
    return this.sparkRepo.findOneBy({ dropId, userId });
  }

  async countSparks(dropId: string): Promise<number> {
    return this.sparkRepo.countBy({ dropId });
  }
}
