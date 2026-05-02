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
import { DropsCronService } from './drops-cron.service';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';
import { DropPhoto } from './entities/drop-photo.entity';
import {
  DropCategory,
  DropCrewMemberRole,
  DropCrewStatus,
  DropStatus,
  SupabaseStorageService,
} from '../../common';
import { CreateDropDto } from './dto/create-drop.dto';
import { ActivityLogsPageDto } from './dto/activity-logs-page.dto';
import { DiscoverDropsResponseDto } from './dto/discover-drops-response.dto';
import { DropActivityLogPublicDto } from './dto/drop-activity-log-public.dto';
import { DropDiscoverSummaryDto } from './dto/drop-discover-summary.dto';
import { DropPhotoPublicDto } from './dto/drop-photo-public.dto';
import { UpdateDropDto } from './dto/update-drop.dto';

const PUBLIC_ACTIVITY_CHANGED_FIELDS = new Set([
  'name',
  'scheduledAt',
  'location',
  'expectedHeadcount',
  'isLocked',
  'isPublic',
  'status',
  'category',
  'overview',
  'coverPhoto',
]);

@Injectable()
export class DropsService {
  private readonly _createInFlight = new Set<string>();
  private readonly _featureInFlight = new Set<string>();

  constructor(
    private readonly dropsRepository: DropsRepository,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly dropsCronService: DropsCronService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  private mapRowToDiscoverSummary(
    row: Drop & { sparkCount?: number },
    viewerSparkedDropIds?: Set<string>,
  ): DropDiscoverSummaryDto {
    const organiser = row.organiser;
    const summary: DropDiscoverSummaryDto = {
      id: row.id,
      name: row.name,
      scheduledAt: row.scheduledAt,
      location: row.location,
      expectedHeadcount: row.expectedHeadcount ?? null,
      overview: row.overview ?? null,
      coverPhoto: row.coverPhoto ?? null,
      status: row.status,
      category: row.category ?? null,
      isPublic: row.isPublic,
      isLocked: row.isLocked,
      organiserId: row.organiserId,
      organiser: {
        id: organiser.id,
        firstName: organiser.firstName,
        lastName: organiser.lastName,
        avatar: organiser.avatar ?? null,
        userHandle: organiser.userHandle ?? null,
      },
      sparkCount: row.sparkCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    if (viewerSparkedDropIds !== undefined) {
      summary.sparkedByViewer = viewerSparkedDropIds.has(row.id);
    }
    return summary;
  }

  private toPublicActivityLog(log: DropActivityLog): DropActivityLogPublicDto {
    const safeChangedFields = this.toSafeChangedFields(log.changedFields);

    return {
      id: log.id,
      dropId: log.dropId,
      userId: log.userId,
      user: {
        id: log.user.id,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        avatar: log.user.avatar,
      },
      action: log.action,
      ...(safeChangedFields && { changedFields: safeChangedFields }),
      createdAt: log.createdAt,
    };
  }

  private toSafeChangedFields(
    changedFields?: Record<string, unknown>,
  ): Record<string, true> | undefined {
    if (!changedFields) return undefined;

    const safeKeys = Object.keys(changedFields).filter((key) =>
      PUBLIC_ACTIVITY_CHANGED_FIELDS.has(key),
    );

    if (safeKeys.length === 0) return undefined;

    return Object.fromEntries(safeKeys.map((key) => [key, true])) as Record<string, true>;
  }

  private async assertCanViewDropActivity(dropId: string, firebaseUid: string): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId === user.id) return;

    const activeCrew = await this.dropsRepository.findActiveInCrewMember(dropId, user.id);
    if (!activeCrew) {
      throw new NotFoundException(`Drop ${dropId} not found or no access`);
    }
  }

  async create(dto: CreateDropDto, firebaseUid: string): Promise<Drop> {
    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    // 1. If idempotencyKey is provided, check if we've already created this drop
    if (dto.idempotencyKey) {
      const existing = await this.dropsRepository.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        // Return the existing drop to fulfill the idempotency contract
        return existing;
      }
    }

    // 2. Prevent duplicate submissions racing in the same process window (short-term guard)
    const inFlightKey = dto.idempotencyKey || `${organiser.id}:${dto.name}:${dto.scheduledAt}`;
    if (this._createInFlight.has(inFlightKey)) {
      throw new ConflictException('This drop is already being created');
    }
    this._createInFlight.add(inFlightKey);

    try {
      const joinCode = await this.generateUniqueJoinCode();
      const webUrlEnv = this.configService.get<string>('WEB_URL', 'http://localhost:4200');
      const baseUrl = webUrlEnv.split(',')[0]?.trim() || 'http://localhost:4200';
      const shareUrl = `${baseUrl}/drops/join/${joinCode}`;

      const drop = await this.dropsRepository.create({
        name: dto.name,
        scheduledAt: new Date(dto.scheduledAt),
        location: dto.location,
        expectedHeadcount: dto.expectedHeadcount,
        overview: dto.overview,
        isLocked: dto.isLocked ?? false,
        isPublic: dto.isPublic ?? true,
        status: DropStatus.ACTIVE,
        category: dto.category,
        joinCode,
        shareUrl,
        organiserId: organiser.id,
        idempotencyKey: dto.idempotencyKey,
      });

      await this.dropsRepository.writeLog({
        dropId: drop.id,
        userId: organiser.id,
        action: 'created',
      });

      const existingChiefRow = await this.dropsRepository.findCrewMember(drop.id, organiser.id);
      if (!existingChiefRow) {
        await this.dropsRepository.addCrewMember(
          drop.id,
          organiser.id,
          DropCrewStatus.IN,
          !(drop.isLocked ?? false),
          DropCrewMemberRole.CHIEF,
        );
      }

      if (dto.coverPhotoBase64?.trim()) {
        const { buffer, mimeType } = this.coverBufferFromDataUrl(dto.coverPhotoBase64);
        const publicUrl = await this.storageService.uploadDropCover(drop.id, buffer, mimeType);
        await this.dropsRepository.update(drop.id, { coverPhoto: publicUrl });
      }

      return this.dropsRepository.findById(drop.id) as Promise<Drop>;
    } finally {
      this._createInFlight.delete(inFlightKey);
    }
  }

  async findOne(id: string, firebaseUid?: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (!drop.isPublic && firebaseUid) {
      const user = await this.usersService.findByFirebaseUid(firebaseUid);
      if (user && drop.organiserId !== user.id) {
        const activeCrew = await this.dropsRepository.findActiveInCrewMember(id, user.id);
        if (!activeCrew) {
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
        const activeCrew = await this.dropsRepository.findActiveInCrewMember(drop.id, user.id);
        if (!activeCrew) {
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
    if (dto.category !== undefined) changedFields['category'] = dto.category;
    if (dto.overview !== undefined) changedFields['overview'] = dto.overview;

    await this.dropsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.expectedHeadcount !== undefined && { expectedHeadcount: dto.expectedHeadcount }),
      ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.overview !== undefined && { overview: dto.overview }),
    });
    
    // If the drop is manually marked as completed, clean up non-featured photos
    if (dto.status === DropStatus.COMPLETED) {
      await this.dropsRepository.deleteNonFeaturedPhotosForDrops([id]);
    }

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

  async delete(id: string, firebaseUid: string): Promise<void> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (drop.organiser.firebaseUid !== firebaseUid) {
      throw new ForbiddenException('Only the organiser can delete this drop');
    }

    // Clean up cover photo if exists
    if (drop.coverPhoto) {
      try {
        await this.storageService.deleteDropCover(id);
      } catch (err) {
        console.error('Failed to delete cover photo from storage during drop deletion', err);
      }
    }

    await this.dropsRepository.delete(id);
  }

  async inviteToDrop(dropId: string, userId: string, firebaseUid: string): Promise<void> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    const organiser = await this.usersService.findByFirebaseUid(firebaseUid);
    const organiserId = organiser?.id;
    if (drop.organiserId !== organiserId) {
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
      userId: organiserId!,
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
      if (
        existing &&
        existing.status !== DropCrewStatus.INVITED &&
        existing.status !== DropCrewStatus.REJECTED &&
        existing.status !== DropCrewStatus.REMOVED
      ) {
        throw new ConflictException('You have already joined this drop');
      }

      if (!drop.isPublic && (!existing || existing.status !== DropCrewStatus.INVITED)) {
        throw new ForbiddenException('This drop is private and you have not been invited');
      }

      const memberStatus = drop.isLocked ? DropCrewStatus.PENDING : DropCrewStatus.IN;
      const isPresent = !drop.isLocked;

      let crewMember;
      if (existing) {
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
      const activeCrew = await this.dropsRepository.findActiveInCrewMember(dropId, user.id);
      if (!activeCrew) {
        throw new ForbiddenException('Only the organiser or crew members can view the crew list');
      }
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
    firebaseUid: string,
    page: number,
    limit: number,
  ): Promise<ActivityLogsPageDto> {
    await this.assertCanViewDropActivity(dropId, firebaseUid);
    const logsPage = await this.dropsRepository.findPaginatedActivityLogs(dropId, page, limit);

    return {
      ...logsPage,
      data: logsPage.data.map((log) => this.toPublicActivityLog(log)),
    };
  }

  async findMyActivityLogs(
    firebaseUid: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<DropActivityLog[]> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Authenticated user not found in database');
    return this.dropsRepository.findActivityFeedForUser(user.id, page, limit);
  }

  async discover(
    firebaseUid?: string,
    page = 1,
    limit = 6,
    category?: DropCategory,
  ): Promise<DiscoverDropsResponseDto> {
    // 1. Parallel: featured drop + user lookup + public list + chief IDs
    // We fetch the public list without exclusion to allow parallelization, then filter in memory
    const [featuredResult, user, allPublicPaginated, chiefIds] = await Promise.all([
      this.dropsRepository.findPublicDrops(1, 1),
      firebaseUid ? this.usersService.findByFirebaseUid(firebaseUid) : Promise.resolve(null),
      this.dropsRepository.findPublicDrops(page, limit, category),
      firebaseUid ? (async () => {
        const u = await this.usersService.findByFirebaseUid(firebaseUid);
        return u ? this.dropsRepository.findRecentJoinedChiefIds(u.id) : [];
      })() : Promise.resolve([]),
    ]);

    const featuredRow = featuredResult.data[0] ?? null;
    
    // Filter out the featured drop from the public list if it exists there
    if (featuredRow) {
      allPublicPaginated.data = allPublicPaginated.data.filter(d => d.id !== featuredRow.id);
      // If we filtered one out, we might have limit-1 items. For UX this is usually fine, 
      // or we could have fetched limit+1 to be safe.
    }

    // 2. Fetch upcoming drops by chiefs
    const recentChiefsRows = chiefIds.length > 0 
      ? await this.dropsRepository.findUpcomingDropsByChiefs(chiefIds, category)
      : [];

    // 3. Fetch spark state for all visible drops in one go
    let sparks: Set<string> | undefined;
    if (user) {
      const dropIdList = new Set<string>();
      if (featuredRow) dropIdList.add(featuredRow.id);
      allPublicPaginated.data.forEach(r => dropIdList.add(r.id));
      recentChiefsRows.forEach(r => dropIdList.add(r.id));

      if (dropIdList.size > 0) {
        const sparked = await this.dropsRepository.findDropIdsSparkedByUser(user.id, [...dropIdList]);
        sparks = new Set(sparked);
      }
    }

    const map = (row: Drop & { sparkCount?: number }) =>
      this.mapRowToDiscoverSummary(row, sparks);

    return {
      featured: featuredRow ? map(featuredRow as Drop & { sparkCount?: number }) : null,
      recentChiefsDrops: recentChiefsRows.map((r) => map(r as Drop & { sparkCount?: number })),
      allPublic: {
        data: allPublicPaginated.data.map((r) => map(r as Drop & { sparkCount?: number })),
        total: allPublicPaginated.total,
        page: allPublicPaginated.page,
        totalPages: allPublicPaginated.totalPages,
      },
    };
  }

  async uploadCoverPhoto(id: string, firebaseUid: string, buffer: Buffer, mimeType: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (drop.organiser.firebaseUid !== firebaseUid) {
      throw new ForbiddenException('Only the organiser can update the cover photo');
    }

    const publicUrl = await this.storageService.uploadDropCover(id, buffer, mimeType);

    await this.dropsRepository.update(id, { coverPhoto: publicUrl });
    await this.dropsRepository.writeLog({ dropId: id, userId: drop.organiserId, action: 'updated', changedFields: { coverPhoto: publicUrl } });

    return this.dropsRepository.findById(id) as Promise<Drop>;
  }

  async deleteCoverPhoto(id: string, firebaseUid: string): Promise<void> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (drop.organiser.firebaseUid !== firebaseUid) {
      throw new ForbiddenException('Only the organiser can delete the cover photo');
    }

    await this.storageService.deleteDropCover(id);
    await this.dropsRepository.update(id, { coverPhoto: null });
    await this.dropsRepository.writeLog({ dropId: id, userId: drop.organiserId, action: 'updated', changedFields: { coverPhoto: null } });
  }

  async uploadPhoto(dropId: string, firebaseUid: string, base64: string): Promise<DropPhoto> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('User not found');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException('Drop not found');

    // Check if user is part of the crew or the organiser
    const isOrganiser = drop.organiserId === user.id;
    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!isOrganiser && (!crewMember || crewMember.status !== DropCrewStatus.IN)) {
      throw new ForbiddenException('Only active crew members can upload photos');
    }

    // Check limits
    const userPhotoCount = await this.dropsRepository.countPhotosByUser(dropId, user.id);
    if (userPhotoCount >= 3) {
      throw new BadRequestException('You can only upload up to 3 photos per drop');
    }

    const totalPhotoCount = await this.dropsRepository.countTotalPhotos(dropId);
    if (totalPhotoCount >= 10) {
      throw new BadRequestException('This drop has reached its photo limit');
    }

    // Validate image format and size
    this.validateImageBase64(base64);

    const photo = await this.dropsRepository.addPhoto({
      dropId,
      userId: user.id,
      base64,
      isFeatured: false,
    });

    await this.dropsRepository.writeLog({
      dropId,
      userId: user.id,
      action: 'photo_added',
    });

    return photo;
  }

  async getPhotos(dropId: string, firebaseUid: string): Promise<DropPhotoPublicDto[]> {
    await this.findOne(dropId, firebaseUid);
    const photos = await this.dropsRepository.findPhotos(dropId);
    return photos.map((p) => this.toPhotoPublicDto(p));
  }

  private toPhotoPublicDto(photo: DropPhoto): DropPhotoPublicDto {
    const user = photo.user;
    const hasUrl = photo.url !== null && photo.url !== undefined && photo.url !== '';
    return {
      id: photo.id,
      dropId: photo.dropId,
      userId: photo.userId,
      url: photo.url ?? undefined,
      base64: hasUrl ? undefined : (photo.base64 ?? undefined),
      isFeatured: photo.isFeatured,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  async featurePhoto(dropId: string, photoId: string, firebaseUid: string): Promise<DropPhoto> {
    const featureKey = `${dropId}:${photoId}`;
    if (this._featureInFlight.has(featureKey)) {
      // Just return the current state of the photo if already processing
      return this.dropsRepository.findPhotoById(photoId) as Promise<DropPhoto>;
    }
    this._featureInFlight.add(featureKey);

    try {
      const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('User not found');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException('Drop not found');

    if (drop.organiserId !== user.id) {
      throw new ForbiddenException('Only the chief can feature photos');
    }

    const photo = await this.dropsRepository.findPhotoById(photoId);
    if (!photo || photo.dropId !== dropId) throw new NotFoundException('Photo not found');

    if (photo.isFeatured) {
      // Unfeature
      await this.dropsRepository.updatePhoto(photoId, { isFeatured: false });
      
      await this.dropsRepository.writeLog({
        dropId,
        userId: user.id,
        action: 'photo_unfeatured',
      });

      return this.dropsRepository.findPhotoById(photoId) as Promise<DropPhoto>;
    }

    // To save storage as requested, we only upload to Supabase when featured
    if (photo.base64) {
      // Convert base64 to buffer
      const base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const mimeType = photo.base64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      
      // Upload to storage
      const ext = mimeType === 'image/png' ? 'png' : 'jpg';
      const path = `drops/${dropId}/photos/${photoId}.${ext}`;
      const bucket = this.storageService.storage.from('drops');

      const { error } = await bucket.upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

      if (error) throw new BadRequestException(`Storage upload failed: ${error.message}`);

      const { data } = bucket.getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      await this.dropsRepository.updatePhoto(photoId, {
        url: publicUrl,
        base64: null,
        isFeatured: true,
      });
    } else {
      // Already has a URL but was unfeatured, just re-feature it
      await this.dropsRepository.updatePhoto(photoId, { isFeatured: true });
    }

    await this.dropsRepository.writeLog({
      dropId,
      userId: user.id,
      action: 'photo_featured',
    });

    return this.dropsRepository.findPhotoById(photoId) as Promise<DropPhoto>;
    } finally {
      this._featureInFlight.delete(featureKey);
    }
  }

  async deletePhoto(dropId: string, photoId: string, firebaseUid: string): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('User not found');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException('Drop not found');

    const photo = await this.dropsRepository.findPhotoById(photoId);
    if (!photo || photo.dropId !== dropId) throw new NotFoundException('Photo not found');

    // Only the owner of the photo or the Chief can delete it
    if (photo.userId !== user.id && drop.organiserId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this photo');
    }

    if (photo.url) {
      // If it was in storage, we should probably delete it from there too
      // But for now let's just delete the record.
    }

    await this.dropsRepository.deletePhoto(photoId);

    await this.dropsRepository.writeLog({
      dropId,
      userId: user.id,
      action: 'photo_removed',
    });
  }

  async sparkDrop(dropId: string, firebaseUid: string): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('User not found');

    await this.findOne(dropId, firebaseUid);

    const existing = await this.dropsRepository.findSpark(dropId, user.id);
    if (existing) return;

    await this.dropsRepository.addSpark(dropId, user.id);
  }

  async unsparkDrop(dropId: string, firebaseUid: string): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('User not found');

    await this.findOne(dropId, firebaseUid);
    await this.dropsRepository.removeSpark(dropId, user.id);
  }

  private validateImageBase64(base64: string): void {
    const mimeMatch = base64.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) {
      throw new BadRequestException('Invalid image format: Missing data URI prefix');
    }

    const mimeType = mimeMatch[1];
    if (!mimeType || !['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)) {
      throw new BadRequestException('Invalid image format: Only JPG and PNG are allowed');
    }

    const base64Data = base64.split(',')[1];
    if (!base64Data) {
      throw new BadRequestException('Invalid image data');
    }

    const sizeBytes = Buffer.from(base64Data, 'base64').length;
    if (sizeBytes > 5 * 1024 * 1024) {
      throw new BadRequestException('Image size exceeds 5MB limit');
    }
  }

  /** Parses a validated data-URL image for storage upload (same rules as photo roll base64). */
  private coverBufferFromDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
    this.validateImageBase64(dataUrl);
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    if (!mimeMatch?.[1]) {
      throw new BadRequestException('Invalid image format: Missing data URI prefix');
    }
    let mimeType = mimeMatch[1];
    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new BadRequestException('Invalid image data');
    }
    return { buffer: Buffer.from(base64Data, 'base64'), mimeType };
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
