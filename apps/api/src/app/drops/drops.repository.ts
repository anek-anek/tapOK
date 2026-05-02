import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DropCategory, DropCrewMemberRole, DropCrewStatus, DropStatus } from '../../common';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';

import { DropPhoto } from './entities/drop-photo.entity';
import { DropSpark } from './entities/drop-spark.entity';

const PUBLIC_DISCOVER_DROP_SELECT: (keyof Drop)[] = [
  'id',
  'name',
  'scheduledAt',
  'location',
  'expectedHeadcount',
  'overview',
  'coverPhoto',
  'status',
  'category',
  'minimumAge',
  'isPublic',
  'isLocked',
  'organiserId',
  'createdAt',
  'updatedAt',
];

const PUBLIC_DISCOVER_ORGANISER_PREFIX = 'organiser';

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
      relations: { organiser: true, sparks: true },
    });
  }

  findByIdempotencyKey(key: string): Promise<Drop | null> {
    return this.dropRepo.findOne({
      where: { idempotencyKey: key },
      relations: { organiser: true, sparks: true },
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
      .addSelect(['crew_me.id', 'crew_me.status', 'crew_me.isPresent'])
      .loadRelationCountAndMap('drop.crewCount', 'drop.crew', 'crew', qb =>
        qb.where('crew.status = :s', { s: DropCrewStatus.IN }))
      .loadRelationCountAndMap('drop.sparkCount', 'drop.sparks')
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
      relations: { organiser: true },
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
    data: Partial<Pick<Drop, 'name' | 'scheduledAt' | 'location' | 'status' | 'isLocked' | 'isPublic' | 'category' | 'overview' | 'coverPhoto' | 'minimumAge'>> & {
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

  /** Active ("in") crew with user profiles — for invite / social-proof surfaces. */
  findActiveInCrewWithUsers(dropId: string): Promise<DropCrew[]> {
    return this.crewRepo.find({
      where: { dropId, status: DropCrewStatus.IN },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async addCrewMember(
    dropId: string,
    userId: string,
    status: DropCrewStatus,
    isPresent: boolean = false,
    memberRole: DropCrewMemberRole = DropCrewMemberRole.CREW,
  ): Promise<DropCrew> {
    const record = this.crewRepo.create({ dropId, userId, status, isPresent, memberRole });
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

  async findActivityFeedForUser(
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<DropActivityLog[]> {
    const skip = (page - 1) * limit;

    // Split OR clause into two target queries to leverage indexes
    const [myLogs, organiserLogs] = await Promise.all([
      this.logRepo.find({
        where: { userId },
        relations: { drop: true, user: true },
        order: { createdAt: 'DESC' },
        take: limit + skip, // Fetch enough to cover the page after merging
      }),
      this.logRepo.find({
        where: { drop: { organiserId: userId } },
        relations: { drop: true, user: true },
        order: { createdAt: 'DESC' },
        take: limit + skip,
      }),
    ]);

    // Merge, deduplicate by ID, sort, and slice
    const combined = [...myLogs, ...organiserLogs];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return unique.slice(skip, skip + limit);
  }

  async findPaginatedActivityLogs(
    dropId: string,
    page: number,
    limit: number,
  ): Promise<{ data: DropActivityLog[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.logRepo.findAndCount({
      where: { dropId },
      relations: { user: true },
      select: {
        id: true,
        dropId: true,
        userId: true,
        action: true,
        changedFields: true,
        createdAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  private buildPublicDiscoverQueryBuilder() {
    const qb = this.dropRepo
      .createQueryBuilder('drop')
      .select(PUBLIC_DISCOVER_DROP_SELECT.map((col) => `drop.${String(col)}`))
      .leftJoin('drop.organiser', PUBLIC_DISCOVER_ORGANISER_PREFIX)
      .addSelect([
        `${PUBLIC_DISCOVER_ORGANISER_PREFIX}.id`,
        `${PUBLIC_DISCOVER_ORGANISER_PREFIX}.firstName`,
        `${PUBLIC_DISCOVER_ORGANISER_PREFIX}.lastName`,
        `${PUBLIC_DISCOVER_ORGANISER_PREFIX}.avatar`,
        `${PUBLIC_DISCOVER_ORGANISER_PREFIX}.userHandle`,
      ])
      .loadRelationCountAndMap('drop.sparkCount', 'drop.sparks');
    return qb;
  }

  async findDropIdsSparkedByUser(userId: string, dropIds: string[]): Promise<string[]> {
    if (dropIds.length === 0) return [];
    const rows = await this.sparkRepo.find({
      where: { userId, dropId: In(dropIds) },
      select: { dropId: true },
    });
    return [...new Set(rows.map((r) => r.dropId))];
  }

  async findUpcomingDropsByChiefs(chiefIds: string[], category?: DropCategory): Promise<Drop[]> {
    if (chiefIds.length === 0) return [];
    const qb = this.buildPublicDiscoverQueryBuilder()
      .where('drop.organiserId IN (:...chiefIds)', { chiefIds })
      .andWhere('drop.isPublic = :isPublic', { isPublic: true })
      .andWhere('drop.status IN (:...statuses)', {
        statuses: [DropStatus.ACTIVE, DropStatus.ONGOING],
      });
    if (category) {
      qb.andWhere('drop.category = :category', { category });
    }
    qb.orderBy('drop.scheduledAt', 'ASC');
    return qb.getMany();
  }

  async findRecentJoinedChiefIds(userId: string, limit: number = 3): Promise<string[]> {
    const rows = await this.crewRepo.createQueryBuilder('crew')
      .select('drop.organiserId', 'organiserId')
      .innerJoin('crew.drop', 'drop')
      .where('crew.userId = :userId', { userId })
      .andWhere('crew.status = :status', { status: DropCrewStatus.IN })
      .andWhere('drop.organiserId != :userId', { userId })
      .orderBy('crew.joinedAt', 'DESC')
      .limit(20)
      .getRawMany<{ organiserId: string }>();

    return Array.from(new Set(rows.map((r) => r.organiserId))).slice(0, limit);
  }

  async findPublicDrops(
    page: number = 1,
    limit: number = 6,
    category?: DropCategory,
    excludeIds: string[] = []
  ): Promise<{ data: Drop[]; total: number; page: number; totalPages: number }> {
    const countQb = this.dropRepo
      .createQueryBuilder('drop')
      .where('drop.isPublic = :isPublic', { isPublic: true })
      .andWhere('drop.status IN (:...statuses)', {
        statuses: [DropStatus.ACTIVE, DropStatus.ONGOING],
      });
    if (category) {
      countQb.andWhere('drop.category = :category', { category });
    }
    if (excludeIds.length > 0) {
      countQb.andWhere('drop.id NOT IN (:...excludeIds)', { excludeIds });
    }
    const total = await countQb.getCount();

    const qb = this.buildPublicDiscoverQueryBuilder()
      .where('drop.isPublic = :isPublic', { isPublic: true })
      .andWhere('drop.status IN (:...statuses)', {
        statuses: [DropStatus.ACTIVE, DropStatus.ONGOING],
      });
    if (category) {
      qb.andWhere('drop.category = :category', { category });
    }
    if (excludeIds.length > 0) {
      qb.andWhere('drop.id NOT IN (:...excludeIds)', { excludeIds });
    }
    qb.orderBy('drop.scheduledAt', 'ASC').skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();

    return { data, total, page, totalPages: Math.ceil(total / limit) || 0 };
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

  async deleteNonFeaturedPhotosForDrops(dropIds: string[]): Promise<void> {
    if (dropIds.length === 0) return;
    await this.photoRepo.delete({ dropId: In(dropIds), isFeatured: false });
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

  async delete(id: string): Promise<void> {
    await this.dropRepo.delete(id);
  }
}
