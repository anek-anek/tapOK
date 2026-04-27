import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { DropsRepository } from './drops.repository';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';
import { DropCrewStatus, DropStatus } from '../../common';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';

@Injectable()
export class DropsService {
  constructor(
    private readonly dropsRepository: DropsRepository,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateDropDto, firebaseUid: string): Promise<Drop> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const joinCode = await this.generateUniqueJoinCode();
    const baseUrl = this.configService.get<string>('WEB_URL', 'http://localhost:4200');
    const shareUrl = `${baseUrl}/drops/join/${joinCode}`;

    const drop = await this.dropsRepository.create({
      name: dto.name,
      scheduledAt: new Date(dto.scheduledAt),
      location: dto.location,
      expectedHeadcount: dto.expectedHeadcount,
      status: DropStatus.ACTIVE,
      joinCode,
      shareUrl,
      organiserId: organiser.id,
    });

    await this.dropsRepository.writeLog({
      dropId: drop.id,
      userId: organiser.id,
      action: 'created',
    });

    return this.dropsRepository.findById(drop.id) as Promise<Drop>;
  }

  async findOne(id: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);
    return drop;
  }

  async findMyDrops(firebaseUid: string): Promise<Drop[]> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');
    return this.dropsRepository.findByOrganiserId(organiser.id);
  }

  async findByJoinCode(joinCode: string): Promise<Drop> {
    const drop = await this.dropsRepository.findByJoinCode(joinCode);
    if (!drop) throw new NotFoundException(`Drop with join code ${joinCode} not found`);
    return drop;
  }

  async update(id: string, dto: UpdateDropDto, firebaseUid: string): Promise<Drop> {
    const drop = await this.findOne(id);

    if (drop.status === DropStatus.COMPLETED) {
      throw new BadRequestException('Completed drops cannot be edited');
    }

    if (drop.organiser.firebaseUid !== firebaseUid) {
      throw new ForbiddenException('Only the organiser can edit this drop');
    }

    const changedFields: Record<string, unknown> = {};
    if (dto.name !== undefined) changedFields['name'] = dto.name;
    if (dto.scheduledAt !== undefined) changedFields['scheduledAt'] = dto.scheduledAt;
    if (dto.location !== undefined) changedFields['location'] = dto.location;
    if (dto.isLocked !== undefined) changedFields['isLocked'] = dto.isLocked;

    await this.dropsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
    });

    await this.dropsRepository.writeLog({
      dropId: id,
      userId: drop.organiserId,
      action: 'updated',
      changedFields,
    });

    return this.findOne(id);
  }

  async joinDrop(dropId: string, firebaseUid: string): Promise<DropCrew> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.status === DropStatus.COMPLETED) {
      throw new BadRequestException('Cannot join a completed drop');
    }

    if (drop.organiserId === user.id) {
      throw new ForbiddenException('Organiser cannot join their own drop');
    }

    const existing = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (existing) throw new ConflictException('You have already joined this drop');

    const memberStatus = drop.isLocked ? DropCrewStatus.PENDING : DropCrewStatus.IN;
    const crewMember = await this.dropsRepository.addCrewMember(dropId, user.id, memberStatus);

    await this.dropsRepository.writeLog({
      dropId,
      userId: user.id,
      action: drop.isLocked ? 'join_requested' : 'joined',
    });

    return crewMember;
  }

  async getMyCrewStatus(dropId: string, firebaseUid: string): Promise<DropCrew> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!crewMember) throw new NotFoundException('You are not a crew member of this drop');

    return crewMember;
  }

  async findMyActivityLogs(firebaseUid: string): Promise<DropActivityLog[]> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');
    return this.dropsRepository.findActivityFeedForUser(user.id);
  }

  private async generateUniqueJoinCode(): Promise<string> {
    let joinCode: string;
    let exists: boolean;
    do {
      joinCode = randomBytes(4).toString('hex').toUpperCase();
      exists = await this.dropsRepository.joinCodeExists(joinCode);
    } while (exists);
    return joinCode;
  }
}
