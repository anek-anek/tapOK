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
  private readonly _createInFlight = new Set<string>();

  constructor(
    private readonly dropsRepository: DropsRepository,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateDropDto, firebaseUid: string): Promise<Drop> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    // Prevent duplicate submissions racing in the same process window
    const idempotencyKey = `${organiser.id}:${dto.name}:${dto.scheduledAt}`;
    if (this._createInFlight.has(idempotencyKey)) {
      throw new ConflictException('A drop with the same name and time is already being created');
    }
    this._createInFlight.add(idempotencyKey);

    try {
      const joinCode = await this.generateUniqueJoinCode();
      const baseUrl = this.configService.get<string>('WEB_URL', 'http://localhost:4200');
      const shareUrl = `${baseUrl}/drops/join/${joinCode}`;

      const drop = await this.dropsRepository.create({
        name: dto.name,
        scheduledAt: new Date(dto.scheduledAt),
        location: dto.location,
        expectedHeadcount: dto.expectedHeadcount,
        isLocked: dto.isLocked ?? false,
        isPublic: dto.isPublic ?? true,
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
    } finally {
      this._createInFlight.delete(idempotencyKey);
    }
  }

  async findOne(id: string, firebaseUid?: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (!drop.isPublic && firebaseUid) {
      const user = await this.usersService.findByFirebaseUid(firebaseUid);
      if (user && drop.organiserId !== user.id) {
        const crewMember = await this.dropsRepository.findCrewMember(id, user.id);
        if (!crewMember) {
          throw new NotFoundException(`Drop ${id} not found`);
        }
      }
    } else if (!drop.isPublic && !firebaseUid) {
      throw new NotFoundException(`Drop ${id} not found`);
    }

    return drop;
  }

  async findMyDrops(firebaseUid: string): Promise<Drop[]> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');
    return this.dropsRepository.findFeed(user.id);
  }

  async findByJoinCode(joinCode: string, firebaseUid?: string): Promise<Drop> {
    const drop = await this.dropsRepository.findByJoinCode(joinCode);
    if (!drop) throw new NotFoundException(`Drop with join code ${joinCode} not found`);

    if (!drop.isPublic) {
      if (!firebaseUid) throw new NotFoundException(`Drop with join code ${joinCode} not found`);
      const user = await this.usersService.findByFirebaseUid(firebaseUid);
      if (user && drop.organiserId !== user.id) {
        const crewMember = await this.dropsRepository.findCrewMember(drop.id, user.id);
        if (!crewMember) {
          throw new NotFoundException(`Drop with join code ${joinCode} not found`);
        }
      }
    }

    return drop;
  }

  async update(id: string, dto: UpdateDropDto, firebaseUid: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

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
    if (dto.expectedHeadcount !== undefined) changedFields['expectedHeadcount'] = dto.expectedHeadcount;
    if (dto.isLocked !== undefined) changedFields['isLocked'] = dto.isLocked;
    if (dto.isPublic !== undefined) changedFields['isPublic'] = dto.isPublic;
    if (dto.status !== undefined) changedFields['status'] = dto.status;

    await this.dropsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.expectedHeadcount !== undefined && { expectedHeadcount: dto.expectedHeadcount }),
      ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    const statusActionMap: Partial<Record<DropStatus, string>> = {
      [DropStatus.ONGOING]: 'marked_ongoing',
      [DropStatus.COMPLETED]: 'marked_completed',
    };
    const action = dto.status !== undefined ? (statusActionMap[dto.status] ?? 'updated') : 'updated';

    await this.dropsRepository.writeLog({
      dropId: id,
      userId: drop.organiserId,
      action,
      changedFields: action === 'updated' ? changedFields : undefined,
    });

    return this.dropsRepository.findById(id) as Promise<Drop>;
  }

  async inviteToDrop(dropId: string, userId: string, firebaseUid: string): Promise<void> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== (await this.usersService.findByFirebaseUid(firebaseUid))?.id) {
      throw new ForbiddenException('Only the organiser can invite people');
    }

    const existing = await this.dropsRepository.findCrewMember(dropId, userId);
    if (existing) {
      if (existing.status === DropCrewStatus.REMOVED || existing.status === DropCrewStatus.REJECTED) {
        await this.dropsRepository.updateCrewStatus(dropId, userId, DropCrewStatus.INVITED, false);
      } else {
        // Already in or pending or invited
        return;
      }
    } else {
      await this.dropsRepository.addCrewMember(dropId, userId, DropCrewStatus.INVITED, false);
    }

    await this.dropsRepository.writeLog({
      dropId,
      userId: (await this.usersService.findByFirebaseUid(firebaseUid))!.id,
      action: 'invited_member',
      changedFields: { invitedUserId: userId },
    });
  }

  async joinDrop(dropId: string, firebaseUid: string): Promise<DropCrew> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const joinKey = `join:${dropId}:${user.id}`;
    if (this._createInFlight.has(joinKey)) {
      throw new ConflictException('You have already joined this drop');
    }
    this._createInFlight.add(joinKey);

    try {
      const drop = await this.dropsRepository.findById(dropId);
      if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

      if (drop.status === DropStatus.COMPLETED) {
        throw new BadRequestException('Cannot join a completed drop');
      }

      if (drop.organiserId === user.id) {
        throw new ForbiddenException('Organiser cannot join their own drop');
      }

      const existing = await this.dropsRepository.findCrewMember(dropId, user.id);
      if (existing && existing.status !== DropCrewStatus.INVITED) {
        throw new ConflictException('You have already joined this drop');
      }

      if (!drop.isPublic && (!existing || existing.status !== DropCrewStatus.INVITED)) {
        throw new ForbiddenException('This drop is private and you have not been invited');
      }

      const memberStatus = drop.isLocked ? DropCrewStatus.PENDING : DropCrewStatus.IN;
      const isPresent = !drop.isLocked;

      let crewMember;
      if (existing && existing.status === DropCrewStatus.INVITED) {
        await this.dropsRepository.updateCrewStatus(dropId, user.id, memberStatus, isPresent);
        crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
      } else {
        crewMember = await this.dropsRepository.addCrewMember(dropId, user.id, memberStatus, isPresent);
      }

      await this.dropsRepository.writeLog({
        dropId,
        userId: user.id,
        action: drop.isLocked ? 'join_requested' : 'joined',
      });

      return crewMember;
    } finally {
      this._createInFlight.delete(joinKey);
    }
  }

  async leaveDrop(dropId: string, firebaseUid: string): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId === user.id) {
      throw new ForbiddenException('Organiser cannot leave their own drop');
    }

    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!crewMember) throw new NotFoundException('You are not a crew member of this drop');

    await this.dropsRepository.removeCrewMember(dropId, user.id);

    await this.dropsRepository.writeLog({
      dropId,
      userId: user.id,
      action: 'left',
    });
  }

  async getDropCrew(dropId: string, firebaseUid: string): Promise<DropCrew[]> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== user.id) {
      throw new ForbiddenException('Only the organiser can view the crew list');
    }

    return this.dropsRepository.findCrewMembers(dropId);
  }

  async rejectPendingMember(dropId: string, targetUserId: string, firebaseUid: string): Promise<void> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== organiser.id) {
      throw new ForbiddenException('Only the organiser can reject join requests');
    }

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a crew member of this drop');

    if (member.status !== DropCrewStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    await this.dropsRepository.updateCrewStatus(dropId, targetUserId, DropCrewStatus.REJECTED);

    await this.dropsRepository.writeLog({
      dropId,
      userId: organiser.id,
      action: 'join_request_rejected',
      changedFields: { rejectedUserId: targetUserId },
    });
  }

  async approvePendingMember(dropId: string, targetUserId: string, firebaseUid: string): Promise<void> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== organiser.id) {
      throw new ForbiddenException('Only the organiser can approve join requests');
    }

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a crew member of this drop');

    if (member.status !== DropCrewStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    await this.dropsRepository.updateCrewStatus(dropId, targetUserId, DropCrewStatus.IN, true);

    await this.dropsRepository.writeLog({
      dropId,
      userId: organiser.id,
      action: 'join_request_approved',
      changedFields: { approvedUserId: targetUserId },
    });
  }

  async removeCrewMember(dropId: string, targetUserId: string, firebaseUid: string): Promise<void> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== organiser.id) {
      throw new ForbiddenException('Only the organiser can remove crew members');
    }

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a crew member of this drop');

    if (member.status !== DropCrewStatus.IN) {
      throw new BadRequestException('Only active crew members (status "in") can be removed');
    }

    await this.dropsRepository.updateCrewStatus(dropId, targetUserId, DropCrewStatus.REMOVED);

    await this.dropsRepository.writeLog({
      dropId,
      userId: organiser.id,
      action: 'member_removed',
      changedFields: { removedUserId: targetUserId },
    });
  }

  async getMyCrewStatus(dropId: string, firebaseUid: string): Promise<DropCrew> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!crewMember) throw new NotFoundException('You are not a crew member of this drop');

    return crewMember;
  }

  async updatePresence(dropId: string, firebaseUid: string, isPresent: boolean): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const member = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!member) throw new NotFoundException('You are not a crew member of this drop');

    if (member.status !== DropCrewStatus.IN) {
      throw new BadRequestException('Only active crew members can update their presence');
    }

    await this.dropsRepository.updateCrewPresence(dropId, user.id, isPresent);

    await this.dropsRepository.writeLog({
      dropId,
      userId: user.id,
      action: isPresent ? 'marked_in' : 'marked_out',
    });
  }

  async findDropActivityLogs(
    dropId: string,
    page: number,
    limit: number,
  ): Promise<{ data: DropActivityLog[]; total: number; page: number; totalPages: number }> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);
    return this.dropsRepository.findPaginatedActivityLogs(dropId, page, limit);
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
