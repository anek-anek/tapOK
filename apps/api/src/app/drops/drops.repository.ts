import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { DropCrewStatus, DropStatus } from '../../common';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';

@Injectable()
export class DropsRepository {
  constructor(
    @InjectRepository(Drop)
    private readonly dropRepo: Repository<Drop>,
    @InjectRepository(DropActivityLog)
    private readonly logRepo: Repository<DropActivityLog>,
    @InjectRepository(DropCrew)
    private readonly crewRepo: Repository<DropCrew>,
  ) {}

  findById(id: string): Promise<Drop | null> {
    return this.dropRepo.findOne({
      where: { id },
      relations: { organiser: true, activityLogs: { user: true } },
      order: { activityLogs: { createdAt: 'DESC' } },
    });
  }

  findByOrganiserId(organiserId: string): Promise<Drop[]> {
    return this.dropRepo.find({
      where: { organiserId },
      relations: { organiser: true },
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

  async findFeed(userId: string): Promise<Drop[]> {
    // Find all user IDs the user has partied with (past crews)
    // 1. Organisers of drops the user has joined
    // 2. People who joined drops the user has organised
    // 3. People who were in the same crew as the user
    const partiedWithSubquery = this.crewRepo.createQueryBuilder('crew')
      .select('DISTINCT other_crew.userId', 'userId')
      .innerJoin('drop_crew', 'other_crew', 'crew.dropId = other_crew.dropId')
      .where('crew.userId = :userId', { userId });

    const organisedWithSubquery = this.dropRepo.createQueryBuilder('drop')
      .select('DISTINCT crew.userId', 'userId')
      .innerJoin('drop_crew', 'crew', 'drop.id = crew.dropId')
      .where('drop.organiserId = :userId', { userId });

    const organiserOfDropsJoinedSubquery = this.dropRepo.createQueryBuilder('drop')
      .select('DISTINCT drop.organiserId', 'userId')
      .innerJoin('drop_crew', 'crew', 'drop.id = crew.dropId')
      .where('crew.userId = :userId', { userId });

    // Combine these into one set of IDs
    // Actually, it's easier to use a single complex query for the feed
    
    return this.dropRepo.createQueryBuilder('drop')
      .leftJoinAndSelect('drop.organiser', 'organiser')
      .leftJoin('drop.crew', 'crew', 'drop.id = crew.dropId AND crew.userId = :userId', { userId })
      .where('drop.organiserId = :userId', { userId }) // Organiser
      .orWhere('crew.userId = :userId AND crew.status IN (:...statuses)', { // Joined/Pending
        userId,
        statuses: [DropCrewStatus.IN, DropCrewStatus.PENDING]
      })
      .orWhere(qb => {
        const subQuery = qb.subQuery()
          .select('DISTINCT d.organiserId')
          .from(Drop, 'd')
          .innerJoin('drop_crew', 'c', 'd.id = c.dropId')
          .where('c.userId = :userId')
          .getQuery();
        return 'drop.isPublic = true AND drop.organiserId IN ' + subQuery;
      })
      .orWhere(qb => {
        const subQuery = qb.subQuery()
          .select('DISTINCT c2.userId')
          .from('drop_crew', 'c1')
          .innerJoin('drop_crew', 'c2', 'c1.dropId = c2.dropId')
          .where('c1.userId = :userId')
          .getQuery();
        return 'drop.isPublic = true AND drop.organiserId IN ' + subQuery;
      })
      .orderBy('drop.scheduledAt', 'ASC')
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
    data: Partial<Pick<Drop, 'name' | 'scheduledAt' | 'location' | 'status' | 'isLocked' | 'isPublic'>> & {
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
}
