import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DropCrewStatus } from '../../common';
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

  async update(id: string, data: Partial<Pick<Drop, 'name' | 'scheduledAt' | 'location' | 'status' | 'isLocked'>>): Promise<void> {
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

  async addCrewMember(dropId: string, userId: string, status: DropCrewStatus): Promise<DropCrew> {
    const record = this.crewRepo.create({ dropId, userId, status });
    return this.crewRepo.save(record);
  }

  async removeCrewMember(dropId: string, userId: string): Promise<void> {
    await this.crewRepo.delete({ dropId, userId });
  }

  async updateCrewStatus(dropId: string, userId: string, status: DropCrewStatus): Promise<void> {
    await this.crewRepo.update({ dropId, userId }, { status });
  }

  async updateCrewPresence(dropId: string, userId: string, isPresent: boolean): Promise<void> {
    await this.crewRepo.update({ dropId, userId }, { isPresent });
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
}
