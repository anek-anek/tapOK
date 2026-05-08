import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { DropsRepository } from './drops.repository';
import { DropsCronService } from './drops-cron.service';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropCrew } from './entities/drop-crew.entity';
import { DropPhoto } from './entities/drop-photo.entity';
import { DropItem } from './entities/drop-item.entity';
import {
  DropCategory,
  DropCrewMemberRole,
  DropCrewStatus,
  DropStatus,
  MediaAssetsService,
  UserRole,
} from '../../common';
import type { BetterAuthUser } from '../../common/better-auth/better-auth.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { ActivityLogsPageDto } from './dto/activity-logs-page.dto';
import { DiscoverDropsResponseDto } from './dto/discover-drops-response.dto';
import { DropActivityLogPublicDto } from './dto/drop-activity-log-public.dto';
import { DropDiscoverSummaryDto } from './dto/drop-discover-summary.dto';
import { DropPhotoPublicDto } from './dto/drop-photo-public.dto';
import { CreatePhotoUploadDto } from './dto/create-photo-upload.dto';
import { PhotoUploadSessionDto } from './dto/photo-upload-session.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { DROP_PHOTO_MAX_PER_USER, getDropPhotoMaxPerDrop } from './drop-photo.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common';

const PUBLIC_ACTIVITY_CHANGED_FIELDS = new Set([
  'name',
  'scheduledAt',
  'location',
  'expectedHeadcount',
  'isLocked',
  'isPublic',
  'status',
  'category',
  'minimumAge',
  'overview',
  'coverPhoto',
]);

@Injectable()
export class DropsService {
  private readonly logger = new Logger(DropsService.name);
  private readonly _createInFlight = new Set<string>();
  private readonly _featureInFlight = new Set<string>();

  constructor(
    private readonly dropsRepository: DropsRepository,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly dropsCronService: DropsCronService,
    private readonly mediaAssets: MediaAssetsService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(page: number = 1, limit: number = 100): Promise<Drop[]> {
    const drops = await this.dropsRepository.findAll(page, limit);
    return Promise.all(drops.map(async (drop) => {
      const withCover = await this.resolveDropCoverPhoto(drop);
      return this.resolveDropOrganiserAvatar(withCover);
    }));
  }

  private async mapRowToDiscoverSummary(
    row: Drop & { sparkCount?: number },
    viewerSparkedDropIds?: Set<string>,
    viewerCrew?: DropCrew | null,
  ): Promise<DropDiscoverSummaryDto> {
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
      minimumAge: row.minimumAge ?? null,
      isPublic: row.isPublic,
      isLocked: row.isLocked,
      organiserId: row.organiserId,
      organiser: {
        id: organiser.id,
        firstName: organiser.firstName,
        lastName: organiser.lastName,
        avatar: await this.resolveAvatarReference(organiser.avatar ?? null),
        userHandle: organiser.userHandle ?? null,
      },
      sparkCount: row.sparkCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    if (viewerSparkedDropIds !== undefined) {
      summary.sparkedByViewer = viewerSparkedDropIds.has(row.id);
    }
    if (viewerCrew) {
      summary.viewerCrew = {
        id: viewerCrew.id,
        dropId: viewerCrew.dropId,
        userId: viewerCrew.userId,
        memberRole: viewerCrew.memberRole,
        status: viewerCrew.status,
        isPresent: viewerCrew.isPresent,
        joinedAt: viewerCrew.joinedAt,
        user: {
          id: viewerCrew.user.id,
          firstName: viewerCrew.user.firstName,
          lastName: viewerCrew.user.lastName,
          avatar: (await this.resolveAvatarReference(viewerCrew.user.avatar)) ?? undefined,
        },
      };
    }
    return this.resolveCoverPhotoForSummary(summary);
  }

  private async resolveCoverPhotoForSummary(summary: DropDiscoverSummaryDto): Promise<DropDiscoverSummaryDto> {
    const cover = summary.coverPhoto;
    if (!cover || cover.startsWith('/')) return summary;
    const storagePath = this.mediaAssets.extractStoragePath(cover);
    if (!storagePath) return summary;
    const resolved = await this.mediaAssets.tryResolveReadUrl(storagePath);
    return { ...summary, coverPhoto: resolved ?? null };
  }

  private async resolveDropCoverPhoto(drop: Drop): Promise<Drop> {
    if (!drop.coverPhoto || drop.coverPhoto.startsWith('/')) return drop;
    const storagePath = this.mediaAssets.extractStoragePath(drop.coverPhoto);
    if (!storagePath) return drop;
    const resolved = await this.mediaAssets.tryResolveReadUrl(storagePath);
    return { ...drop, coverPhoto: resolved ?? null };
  }

  private async resolveAvatarReference(avatar?: string | null): Promise<string | null> {
    if (!avatar) return null;
    const storagePath = this.mediaAssets.extractStoragePath(avatar);
    if (!storagePath) return avatar;
    const resolved = await this.mediaAssets.tryResolveReadUrl(storagePath);
    return resolved ?? null;
  }

  private async resolveDropOrganiserAvatar(drop: Drop): Promise<Drop> {
    if (!drop.organiser) return drop;
    const resolvedAvatar = await this.resolveAvatarReference(drop.organiser.avatar ?? null);
    return {
      ...drop,
      organiser: {
        ...drop.organiser,
        avatar: resolvedAvatar ?? undefined,
      },
    };
  }

  private async resolveDropCrewAvatars(drop: Drop): Promise<Drop> {
    if (!drop.crew?.length) return drop;
    const resolvedCrew = await Promise.all(
      drop.crew.map(async (member) => {
        if (!member.user) return member;
        const resolvedAvatar = await this.resolveAvatarReference(member.user.avatar ?? null);
        return { ...member, user: { ...member.user, avatar: resolvedAvatar ?? undefined } };
      }),
    );
    return { ...drop, crew: resolvedCrew };
  }

  private async toPublicActivityLog(log: DropActivityLog): Promise<DropActivityLogPublicDto> {
    const safeChangedFields = this.toSafeChangedFields(log.changedFields);

    return {
      id: log.id,
      dropId: log.dropId,
      userId: log.userId,
      user: {
        id: log.user.id,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        avatar: (await this.resolveAvatarReference(log.user.avatar)) ?? undefined,
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

  private async assertCanViewDropActivity(dropId: string, userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId === user.id) return;

    const activeCrew = await this.dropsRepository.findActiveInCrewMember(dropId, user.id);
    if (!activeCrew) {
      throw new NotFoundException(`Drop ${dropId} not found or no access`);
    }
  }

  private async recordDropActivity(
    data: Partial<DropActivityLog>,
    auditExtra?: Record<string, unknown>,
  ): Promise<void> {
    await this.dropsRepository.writeLog(data);
    const meta: Record<string, unknown> = {
      dropId: data.dropId,
      userId: data.userId,
      action: data.action,
      ...auditExtra,
    };
    if (data.changedFields && typeof data.changedFields === 'object') {
      meta.changedFieldKeys = Object.keys(data.changedFields as object);
    }
    this.logger.log(`Drop activity: ${JSON.stringify(meta)}`);
  }

  private assertUserIsVerified(user: User, action: string) {
    if (!user.isEmailVerified) {
      throw new ForbiddenException({
        message: `Verification Required: Please verify your email to ${action}. You can resend the link from your Profile.`,
        code: 'EMAIL_NOT_VERIFIED',
      });
    }
  }

  private logDropAction(
    action: string,
    dropId: string,
    userId: string,
    extra?: Record<string, unknown>,
  ): void {
    this.logger.log(`Drop action: ${JSON.stringify({ action, dropId, userId, ...extra })}`);
  }

  async create(dto: CreateDropDto, userId: string): Promise<Drop> {
    const organiser = await this.usersService.findOne(userId);

    this.assertUserIsVerified(organiser, 'create a drop');

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

      const minimumAge =
        dto.category === DropCategory.PARTY && dto.minimumAge != null ? dto.minimumAge : null;

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
        minimumAge,
        joinCode,
        shareUrl,
        organiserId: organiser.id,
        idempotencyKey: dto.idempotencyKey,
      });

      if (dto.neededItems?.length) {
        for (const itemName of dto.neededItems) {
          await this.dropsRepository.addItem({
            dropId: drop.id,
            name: itemName,
          });
        }
      }

      await this.recordDropActivity({
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
          true,
          DropCrewMemberRole.CHIEF,
        );
      }

      if (dto.coverPhotoBase64?.trim()) {
        const { buffer, mimeType } = this.coverBufferFromDataUrl(dto.coverPhotoBase64);
        const coverPath = this.mediaAssets.buildDropCoverPath(drop.id, mimeType);
        await this.mediaAssets.uploadImage(coverPath, buffer, mimeType);
        await this.dropsRepository.update(drop.id, { coverPhoto: coverPath });
      } else {
        const defaultCover =
          dto.category === DropCategory.HANGOUT
            ? '/tapok-hangout.png'
            : dto.category === DropCategory.PARTY
              ? '/tapok-party.png'
              : null;
        if (defaultCover) {
          await this.dropsRepository.update(drop.id, { coverPhoto: defaultCover });
        }
      }

      const savedDrop = (await this.dropsRepository.findById(drop.id)) as Drop;
      return this.resolveDropCoverPhoto(savedDrop);
    } finally {
      this._createInFlight.delete(inFlightKey);
    }
  }

  async findOne(id: string, userId?: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (!drop.isPublic && userId) {
      if (drop.organiserId !== userId) {
        const activeCrew = await this.dropsRepository.findActiveInCrewMember(id, userId);
        if (!activeCrew) {
          throw new NotFoundException(`Drop ${id} not found`);
        }
      }
    } else if (!drop.isPublic && !userId) {
      throw new NotFoundException(`Drop ${id} not found`);
    }

    if (drop.organiser) {
      const [{ dropCount, crewReached }] = await this.dataSource.query<[{ dropCount: string, crewReached: string }]>(
        `
        SELECT 
          (SELECT COUNT(*) FROM drops WHERE "organiserId" = $1) as "dropCount",
          (SELECT COUNT(DISTINCT c."userId") 
           FROM drop_crew c 
           WHERE c."dropId" IN (SELECT id FROM drops WHERE "organiserId" = $1)
           AND c.status = 'in') as "crewReached"
        `,
        [drop.organiserId],
      );

      (drop.organiser as any).dropCount = parseInt(dropCount, 10);
      (drop.organiser as any).crewReached = parseInt(crewReached, 10);
    }

    const dropWithCover = await this.resolveDropCoverPhoto(drop);
    return this.resolveDropOrganiserAvatar(dropWithCover);
  }

  async findMyDrops(userId: string): Promise<Drop[]> {
    const user = await this.usersService.findOne(userId);

    const drops = await this.dropsRepository.findFeed(user.id);
    if (drops.length === 0) {
      return drops;
    }

    const sparkedIds = await this.dropsRepository.findDropIdsSparkedByUser(
      user.id,
      drops.map((d) => d.id),
    );
    const sparked = new Set(sparkedIds);

    for (const drop of drops) {
      drop.sparkedByViewer = sparked.has(drop.id);
    }

    return Promise.all(
      drops.map(async (drop) => {
        const withCover = await this.resolveDropCoverPhoto(drop);
        return this.resolveDropCrewAvatars(withCover);
      }),
    );
  }

  async findByJoinCode(joinCode: string, userId?: string): Promise<Drop> {
    const drop = await this.dropsRepository.findByJoinCode(joinCode);
    if (!drop) throw new NotFoundException(`Drop with join code ${joinCode} not found`);

    if (!drop.isPublic) {
      if (!userId) throw new NotFoundException(`Drop with join code ${joinCode} not found`);
      if (drop.organiserId !== userId) {
        const activeCrew = await this.dropsRepository.findActiveInCrewMember(drop.id, userId);
        if (!activeCrew) {
          throw new NotFoundException(`Drop with join code ${joinCode} not found`);
        }
      }
    }

    drop.crew = await this.dropsRepository.findActiveInCrewWithUsers(drop.id);
    return this.resolveDropCoverPhoto(drop);
  }

  async update(id: string, dto: UpdateDropDto, userId: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (drop.status === DropStatus.COMPLETED) {
      throw new BadRequestException('Completed drops cannot be edited');
    }

    if (drop.organiserId !== userId) {
      const requesterCrew = await this.dropsRepository.findCrewMember(id, userId);
      if (requesterCrew?.memberRole !== DropCrewMemberRole.CO_CHIEF) {
        throw new ForbiddenException('Only the organiser or co-chiefs can edit this drop');
      }
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

    const nextCategory = dto.category !== undefined ? dto.category : drop.category;
    let nextMinimumAge: number | null | undefined = undefined;
    if (dto.category !== undefined && dto.category !== DropCategory.PARTY) {
      nextMinimumAge = null;
    } else if (dto.minimumAge !== undefined && nextCategory === DropCategory.PARTY) {
      nextMinimumAge = dto.minimumAge;
    }
    if (nextMinimumAge !== undefined) {
      changedFields['minimumAge'] = nextMinimumAge;
    }

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
      ...(nextMinimumAge !== undefined && { minimumAge: nextMinimumAge }),
    });

    if (dto.neededItems !== undefined) {
      const currentItems = await this.dropsRepository.findItemsByDropId(id);
      const incomingItems = dto.neededItems;

      // Identify items to remove (those in DB but not in incoming list)
      const incomingIds = incomingItems
        .filter((item): item is { id: string; name: string } => typeof item !== 'string')
        .map((item) => item.id);
      
      const toRemove = currentItems.filter((item) => !incomingIds.includes(item.id));
      for (const item of toRemove) {
        await this.dropsRepository.deleteItem(item.id);
      }

      // Add new items (strings) and update existing names if needed
      for (const item of incomingItems) {
        if (typeof item === 'string') {
          await this.dropsRepository.addItem({
            dropId: id,
            name: item,
          });
        } else {
          const existing = currentItems.find((ci) => ci.id === item.id);
          if (existing && existing.name !== item.name) {
            await this.dropsRepository.updateItem(item.id, { name: item.name });
          }
        }
      }
    }
    
    const statusActionMap: Partial<Record<DropStatus, string>> = {
      [DropStatus.ONGOING]: 'marked_ongoing',
      [DropStatus.COMPLETED]: 'marked_completed',
    };
    const action = dto.status !== undefined ? (statusActionMap[dto.status] ?? 'updated') : 'updated';

    await this.recordDropActivity({
      dropId: id,
      userId: drop.organiserId,
      action,
      changedFields: action === 'updated' ? changedFields : undefined,
    });

    const scheduledAtChanged =
      dto.scheduledAt !== undefined &&
      new Date(dto.scheduledAt).getTime() !== drop.scheduledAt.getTime();
    const locationChanged = dto.location !== undefined && dto.location !== drop.location;

    if (scheduledAtChanged || locationChanged) {
      void this.sendDropEditedNotifications(id, drop.name, userId, scheduledAtChanged, locationChanged);
    }

    return this.dropsRepository.findById(id) as Promise<Drop>;
  }

  async delete(id: string, requester: BetterAuthUser): Promise<void> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if ((requester.role as string) !== UserRole.ADMIN && drop.organiserId !== requester.id) {
      throw new ForbiddenException('Only the organiser or an admin can delete this drop');
    }

    // Clean up cover photo if exists
    if (drop.coverPhoto) {
      try {
        await this.mediaAssets.deleteManyByPath([
          this.mediaAssets.buildDropCoverPath(id, 'image/jpeg'),
          this.mediaAssets.buildDropCoverPath(id, 'image/png'),
        ]);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to delete cover photo from storage during drop deletion (dropId=${id}): ${detail}`,
        );
      }
    }

    try {
      const photos = await this.dropsRepository.findPhotosByDropId(id);
      await this.mediaAssets.deleteManyByPath(
        photos
          .map((photo) => photo.storagePath)
          .filter((path): path is string => Boolean(path)),
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to delete drop photos from storage during drop deletion (dropId=${id}): ${detail}`);
    }

    await this.dropsRepository.delete(id);
    this.logDropAction('drop_deleted', id, drop.organiserId);
  }

  async inviteToDrop(dropId: string, userId: string, requesterId: string): Promise<void> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== requesterId) {
      const requesterCrew = await this.dropsRepository.findCrewMember(dropId, requesterId);
      if (requesterCrew?.memberRole !== DropCrewMemberRole.CO_CHIEF) {
        throw new ForbiddenException('Only the organiser or co-chiefs can invite people');
      }
    }

    const organiser = await this.usersService.findOne(requesterId);
    this.assertUserIsVerified(organiser, 'invite people to a drop');

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

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'invited_member',
      changedFields: { invitedUserId: userId },
    });

    this.sendInvitedNotification(drop, userId);
  }

  async joinDrop(dropId: string, userId: string): Promise<DropCrew> {
    const user = await this.usersService.findOne(userId);

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

      if (drop.isLocked) {
        this.assertUserIsVerified(user, 'join drops that require approval');
      }

      this.assertUserMeetsDropMinimumAge(user, drop);

      const memberStatus = drop.isLocked ? DropCrewStatus.PENDING : DropCrewStatus.IN;
      const isPresent = !drop.isLocked;

      let crewMember;
      if (existing) {
        await this.dropsRepository.updateCrewStatus(dropId, user.id, memberStatus, isPresent);
        crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
      } else {
        crewMember = await this.dropsRepository.addCrewMember(dropId, user.id, memberStatus, isPresent);
      }

      await this.recordDropActivity({
        dropId,
        userId: user.id,
        action: drop.isLocked ? 'join_requested' : 'joined',
      });

      if (drop.isLocked) {
        this.sendJoinRequestedNotifications(drop, user);
      } else {
        this.sendMemberJoinedNotifications(drop, user);
      }

      return crewMember;
    } finally {
      this._createInFlight.delete(joinKey);
    }
  }

  async leaveDrop(dropId: string, userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId === user.id) {
      throw new ForbiddenException('Organiser cannot leave their own drop');
    }

    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!crewMember) throw new NotFoundException('You are not a crew member of this drop');

    await this.dropsRepository.removeCrewMember(dropId, user.id);

    await this.recordDropActivity({
      dropId,
      userId: user.id,
      action: 'left',
    });

    this.sendMemberLeftNotifications(drop, user);
  }

  async getDropCrew(dropId: string, userId: string): Promise<DropCrew[]> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== user.id) {
      const activeCrew = await this.dropsRepository.findActiveInCrewMember(dropId, user.id);
      if (!activeCrew) {
        throw new ForbiddenException('Only the organiser or crew members can view the crew list');
      }
    }

    const members = await this.dropsRepository.findCrewMembers(dropId);
    return Promise.all(
      members.map(async (member) => ({
        ...member,
        user: {
          ...member.user,
          avatar: (await this.resolveAvatarReference(member.user.avatar)) ?? undefined,
        },
      })),
    );
  }

  async rejectPendingMember(dropId: string, targetUserId: string, userId: string): Promise<void> {
    const organiser = await this.usersService.findOne(userId);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== organiser.id) {
      const requesterCrew = await this.dropsRepository.findCrewMember(dropId, organiser.id);
      if (requesterCrew?.memberRole !== DropCrewMemberRole.CO_CHIEF) {
        throw new ForbiddenException('Only the organiser or co-chiefs can reject join requests');
      }
    }

    this.assertUserIsVerified(organiser, 'reject join requests');

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a crew member of this drop');

    if (member.status !== DropCrewStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    await this.dropsRepository.updateCrewStatus(dropId, targetUserId, DropCrewStatus.REJECTED);

    await this.recordDropActivity({
      dropId,
      userId: organiser.id,
      action: 'join_request_rejected',
      changedFields: { rejectedUserId: targetUserId },
    });

    const targetUser = await this.usersService.findOne(targetUserId).catch(() => null);
    if (targetUser) this.sendJoinRejectedNotification(drop, targetUser);
  }

  async approvePendingMember(dropId: string, targetUserId: string, userId: string): Promise<void> {
    const organiser = await this.usersService.findOne(userId);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== organiser.id) {
      const requesterCrew = await this.dropsRepository.findCrewMember(dropId, organiser.id);
      if (requesterCrew?.memberRole !== DropCrewMemberRole.CO_CHIEF) {
        throw new ForbiddenException('Only the organiser or co-chiefs can approve join requests');
      }
    }

    this.assertUserIsVerified(organiser, 'approve join requests');

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a crew member of this drop');

    if (member.status !== DropCrewStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    await this.dropsRepository.updateCrewStatus(dropId, targetUserId, DropCrewStatus.IN, true);

    await this.recordDropActivity({
      dropId,
      userId: organiser.id,
      action: 'join_request_approved',
      changedFields: { approvedUserId: targetUserId },
    });

    const targetUser = await this.usersService.findOne(targetUserId).catch(() => null);
    if (targetUser) this.sendJoinApprovedNotification(drop, targetUser);
  }

  async removeCrewMember(dropId: string, targetUserId: string, userId: string): Promise<void> {
    const organiser = await this.usersService.findOne(userId);
    if (!organiser) throw new NotFoundException('Authenticated user not found in database');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId !== organiser.id) {
      const requesterCrew = await this.dropsRepository.findCrewMember(dropId, organiser.id);
      if (requesterCrew?.memberRole !== DropCrewMemberRole.CO_CHIEF) {
        throw new ForbiddenException('Only the organiser or co-chiefs can remove crew members');
      }
    }

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a crew member of this drop');

    if (member.memberRole === DropCrewMemberRole.CHIEF) {
      throw new ForbiddenException('Cannot remove the organiser');
    }

    if (member.status !== DropCrewStatus.IN) {
      throw new BadRequestException('Only active crew members (status "in") can be removed');
    }

    await this.dropsRepository.updateCrewStatus(dropId, targetUserId, DropCrewStatus.REMOVED);

    await this.recordDropActivity({
      dropId,
      userId: organiser.id,
      action: 'member_removed',
      changedFields: { removedUserId: targetUserId },
    });

    const targetUser = await this.usersService.findOne(targetUserId).catch(() => null);
    if (targetUser) this.sendMemberRemovedNotification(drop, targetUser);
  }

  async updateCrewRole(
    dropId: string,
    targetUserId: string,
    requesterId: string,
    newRole: DropCrewMemberRole,
  ): Promise<void> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    // Only the original organiser can manage co-chief roles
    if (drop.organiserId !== requesterId) {
      throw new ForbiddenException('Only the organiser can change member roles');
    }

    const member = await this.dropsRepository.findCrewMember(dropId, targetUserId);
    if (!member) throw new NotFoundException('User is not a member of this drop');

    if (member.memberRole === DropCrewMemberRole.CHIEF) {
      throw new ForbiddenException('Cannot change the role of the organiser');
    }

    if (newRole === DropCrewMemberRole.CHIEF) {
      throw new BadRequestException('Cannot assign the Chief role');
    }

    await this.dropsRepository.updateCrewRole(dropId, targetUserId, newRole);

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'member_role_updated',
      changedFields: { targetUserId, newRole },
    });
  }

  async getMyCrewStatus(dropId: string, userId: string): Promise<DropCrew> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!crewMember) throw new NotFoundException('You are not a crew member of this drop');

    return crewMember;
  }

  async updatePresence(dropId: string, userId: string, isPresent: boolean): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('Authenticated user not found in database');

    const member = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!member) throw new NotFoundException('You are not a crew member of this drop');

    if (member.status !== DropCrewStatus.IN) {
      throw new BadRequestException('Only active crew members can update their presence');
    }

    await this.dropsRepository.updateCrewPresence(dropId, user.id, isPresent);

    await this.recordDropActivity({
      dropId,
      userId: user.id,
      action: isPresent ? 'marked_in' : 'marked_out',
    });
  }

  async findDropActivityLogs(
    dropId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<ActivityLogsPageDto> {
    await this.assertCanViewDropActivity(dropId, userId);
    const logsPage = await this.dropsRepository.findPaginatedActivityLogs(dropId, page, limit);

    return {
      ...logsPage,
      data: await Promise.all(logsPage.data.map((log) => this.toPublicActivityLog(log))),
    };
  }

  async findMyActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<DropActivityLog[]> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('Authenticated user not found in database');
    return this.dropsRepository.findActivityFeedForUser(user.id, page, limit);
  }

  async discover(
    userId?: string,
    page = 1,
    limit = 15,
    category?: DropCategory,
  ): Promise<DiscoverDropsResponseDto> {
    const user = userId ? await this.usersService.findOne(userId).catch(() => null) : null;
    const joinedIds = user ? await this.dropsRepository.findJoinedDropIds(user.id) : [];

    // 1. Parallel: featured, chiefIds, public stream
    const [featuredResult, chiefIds, allPublicPaginated] = await Promise.all([
      // Featured: Most recent public and upcoming NOT joined (ignores category)
      this.dropsRepository.findPublicDrops(1, 15, undefined, joinedIds),
      // Squad Recon Chiefs: frequently joined
      user ? this.dropsRepository.findRecentJoinedChiefIds(user.id, 4) : Promise.resolve([]),
      // Public Stream: Paginated with category
      this.dropsRepository.findPublicDrops(page, limit, category),
    ]);

    // Choose newest drop from the 15 pre-checked candidates
    const featuredRow = featuredResult.data[0] ?? null;

    // 2. Fetch Squad Recon: Top 4 from top 4 frequently joined chiefs NOT joined (ignores category)
    const recentChiefsRows = chiefIds.length > 0
      ? await this.dropsRepository.findUpcomingDropsByChiefs(chiefIds, undefined, joinedIds, 4)
      : [];

    // 3. Batch Spark & Crew Check - optimized performance for all visible drops
    let sparks: Set<string> | undefined;
    const userCrewMap = new Map<string, DropCrew>();

    if (user) {
      const allVisibleIds = new Set<string>();
      if (featuredRow) allVisibleIds.add(featuredRow.id);
      allPublicPaginated.data.forEach(d => allVisibleIds.add(d.id));
      recentChiefsRows.forEach(r => allVisibleIds.add(r.id));
      
      if (allVisibleIds.size > 0) {
        const dropIdList = [...allVisibleIds];
        const [sparked, crewStatuses] = await Promise.all([
          this.dropsRepository.findDropIdsSparkedByUser(user.id, dropIdList),
          this.dropsRepository.findCrewStatusForUser(dropIdList, user.id),
        ]);
        sparks = new Set(sparked);
        crewStatuses.forEach(c => userCrewMap.set(c.dropId, c));
      }
    }

    const map = (row: Drop & { sparkCount?: number }) => 
      this.mapRowToDiscoverSummary(row, sparks, userCrewMap.get(row.id));

    return {
      featured: featuredRow ? await map(featuredRow as Drop & { sparkCount?: number }) : null,
      recentChiefsDrops: await Promise.all(
        recentChiefsRows.map((r) => map(r as Drop & { sparkCount?: number })),
      ),
      allPublic: {
        data: await Promise.all(
          allPublicPaginated.data.map((r) => map(r as Drop & { sparkCount?: number })),
        ),
        total: allPublicPaginated.total,
        page: allPublicPaginated.page,
        totalPages: allPublicPaginated.totalPages,
      },
    };
  }

  async uploadCoverPhoto(id: string, userId: string, buffer: Buffer, mimeType: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (drop.organiserId !== userId) {
      throw new ForbiddenException('Only the organiser can update the cover photo');
    }

    const coverPath = this.mediaAssets.buildDropCoverPath(id, mimeType);
    await this.mediaAssets.uploadImage(coverPath, buffer, mimeType);

    await this.dropsRepository.update(id, { coverPhoto: coverPath });
    await this.recordDropActivity({
      dropId: id,
      userId: drop.organiserId,
      action: 'updated',
      changedFields: { coverPhoto: true },
    });

    const savedDrop = (await this.dropsRepository.findById(id)) as Drop;
    return this.resolveDropCoverPhoto(savedDrop);
  }

  async deleteCoverPhoto(id: string, userId: string): Promise<void> {
    const drop = await this.dropsRepository.findById(id);
    if (!drop) throw new NotFoundException(`Drop ${id} not found`);

    if (drop.organiserId !== userId) {
      throw new ForbiddenException('Only the organiser can delete the cover photo');
    }

    await this.mediaAssets.deleteManyByPath([
      this.mediaAssets.buildDropCoverPath(id, 'image/jpeg'),
      this.mediaAssets.buildDropCoverPath(id, 'image/png'),
    ]);
    await this.dropsRepository.update(id, { coverPhoto: null });
    await this.recordDropActivity({ dropId: id, userId: drop.organiserId, action: 'updated', changedFields: { coverPhoto: null } });
  }

  private async deleteNonFeaturedPhotosForDrops(dropIds: string[]): Promise<void> {
    const nonFeaturedPhotos = await this.dropsRepository.findNonFeaturedPhotosForDrops(dropIds);
    await this.mediaAssets.deleteManyByPath(
      nonFeaturedPhotos
        .map((photo) => photo.storagePath)
        .filter((path): path is string => Boolean(path)),
    );
    await this.dropsRepository.deleteNonFeaturedPhotosForDrops(dropIds);
  }

  private async assertCanUploadPhoto(dropId: string, userId: string): Promise<{ user: User }> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    this.assertUserIsVerified(user, 'upload photos');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException('Drop not found');

    const isOrganiser = drop.organiserId === user.id;
    const crewMember = await this.dropsRepository.findCrewMember(dropId, user.id);
    if (!isOrganiser && (!crewMember || crewMember.status !== DropCrewStatus.IN)) {
      throw new ForbiddenException('Only active crew members can upload photos');
    }

    const userPhotoCount = await this.dropsRepository.countPhotosByUser(dropId, user.id);
    if (userPhotoCount >= DROP_PHOTO_MAX_PER_USER) {
      throw new BadRequestException(
        `You can only upload up to ${DROP_PHOTO_MAX_PER_USER} photos per drop`,
      );
    }

    const [totalPhotoCount, activeCrewCount] = await Promise.all([
      this.dropsRepository.countTotalPhotos(dropId),
      this.dropsRepository.countActiveCrewMembers(dropId),
    ]);
    const maxPhotosForDrop = getDropPhotoMaxPerDrop(activeCrewCount);
    if (totalPhotoCount >= maxPhotosForDrop) {
      throw new BadRequestException(
        `This drop has reached its photo limit (${maxPhotosForDrop})`,
      );
    }

    return { user };
  }

  async createPhotoUploadSession(
    dropId: string,
    userId: string,
    dto: CreatePhotoUploadDto,
  ): Promise<PhotoUploadSessionDto> {
    const { user } = await this.assertCanUploadPhoto(dropId, userId);

    const mimeType = dto.mimeType === 'image/jpg' ? 'image/jpeg' : dto.mimeType;
    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      throw new BadRequestException('Invalid image format: Only JPG and PNG are allowed');
    }

    const seed = await this.dropsRepository.addPhoto({
      dropId,
      userId: user.id,
      base64: null,
      url: null,
      isFeatured: false,
    });
    const storagePath = this.mediaAssets.buildDropPhotoPath(dropId, seed.id, mimeType);
    await this.dropsRepository.updatePhoto(seed.id, {
      storagePath,
      mimeType,
      sizeBytes: dto.sizeBytes,
      width: dto.width ?? null,
      height: dto.height ?? null,
    });

    const { token } = await this.mediaAssets.createSignedUpload(storagePath);
    return { photoId: seed.id, storagePath, uploadToken: token };
  }

  async completePhotoUpload(
    dropId: string,
    photoId: string,
    userId: string,
  ): Promise<DropPhotoPublicDto> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const photo = await this.dropsRepository.findPhotoById(photoId);
    if (!photo || photo.dropId !== dropId) throw new NotFoundException('Photo not found');
    if (photo.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to complete this upload');
    }
    if (!photo.storagePath) {
      throw new BadRequestException('Photo upload session is missing storage metadata');
    }
    const objectExists = await this.mediaAssets.storageObjectExists(photo.storagePath);
    if (!objectExists) {
      throw new BadRequestException('Uploaded file not found in storage. Please retry the upload.');
    }

    return this.toPhotoPublicDto(await this.ensurePhotoHasStorageUrl(photo));
  }

  async uploadPhoto(dropId: string, userId: string, base64: string): Promise<DropPhoto> {
    const { user } = await this.assertCanUploadPhoto(dropId, userId);

    const { buffer, mimeType } = this.coverBufferFromDataUrl(base64);
    const photo = await this.dropsRepository.addPhoto({
      dropId,
      userId: user.id,
      base64: null,
      mimeType,
      sizeBytes: buffer.length,
      isFeatured: false,
    });

    const storagePath = this.mediaAssets.buildDropPhotoPath(dropId, photo.id, mimeType);
    await this.mediaAssets.uploadImage(storagePath, buffer, mimeType);
    await this.dropsRepository.updatePhoto(photo.id, {
      storagePath,
      base64: null,
      url: null,
    });

    await this.recordDropActivity(
      {
        dropId,
        userId: user.id,
        action: 'photo_added',
      },
      { photoId: photo.id },
    );

    return (await this.dropsRepository.findPhotoById(photo.id)) as DropPhoto;
  }

  async getPhotos(
    dropId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: DropPhotoPublicDto[]; total: number; page: number; totalPages: number }> {
    await this.findOne(dropId, userId);
    const result = await this.dropsRepository.findPhotos(dropId, page, limit);
    const hydrated = await Promise.all(result.data.map((photo) => this.ensurePhotoHasStorageUrl(photo)));
    return {
      ...result,
      data: await Promise.all(hydrated.map((p) => this.toPhotoPublicDto(p))),
    };
  }

  async getPhotoDetail(dropId: string, photoId: string, userId: string): Promise<DropPhotoPublicDto> {
    await this.findOne(dropId, userId);
    const photo = await this.dropsRepository.findPhotoById(photoId);
    if (!photo || photo.dropId !== dropId) {
      throw new NotFoundException('Photo not found');
    }
    return this.toPhotoPublicDto(await this.ensurePhotoHasStorageUrl(photo));
  }

  private async ensurePhotoHasStorageUrl(photo: DropPhoto): Promise<DropPhoto> {
    if (photo.storagePath) {
      const resolvedUrl = await this.mediaAssets.tryResolveReadUrl(photo.storagePath);
      return { ...photo, url: resolvedUrl ?? undefined };
    }

    if (photo.url && !photo.base64) {
      const inferredPath = this.mediaAssets.extractStoragePath(photo.url);
      if (inferredPath) {
        await this.dropsRepository.updatePhoto(photo.id, { storagePath: inferredPath, url: null });
        const resolvedUrl = await this.mediaAssets.tryResolveReadUrl(inferredPath);
        return { ...photo, storagePath: inferredPath, url: resolvedUrl ?? undefined };
      }
      return photo;
    }

    if (!photo.base64) {
      return photo;
    }

    const { buffer, mimeType } = this.coverBufferFromDataUrl(photo.base64);
    const storagePath = this.mediaAssets.buildDropPhotoPath(photo.dropId, photo.id, mimeType);
    await this.mediaAssets.uploadImage(storagePath, buffer, mimeType);
    await this.dropsRepository.updatePhoto(photo.id, {
      storagePath,
      mimeType,
      sizeBytes: buffer.length,
      base64: null,
      url: null,
    });
    const saved = (await this.dropsRepository.findPhotoById(photo.id)) as DropPhoto;
    const resolvedUrl = await this.mediaAssets.tryResolveReadUrl(storagePath);
    return { ...saved, url: resolvedUrl ?? undefined };
  }

  private async toPhotoPublicDto(photo: DropPhoto): Promise<DropPhotoPublicDto> {
    const user = photo.user;
    return {
      id: photo.id,
      dropId: photo.dropId,
      userId: photo.userId,
      url: photo.url ?? undefined,
      base64: undefined,
      isFeatured: photo.isFeatured,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: (await this.resolveAvatarReference(user.avatar)) ?? undefined,
      },
    };
  }

  async featurePhoto(dropId: string, photoId: string, userId: string): Promise<DropPhoto> {
    const featureKey = `${dropId}:${photoId}`;
    if (this._featureInFlight.has(featureKey)) {
      // Just return the current state of the photo if already processing
      return this.dropsRepository.findPhotoById(photoId) as Promise<DropPhoto>;
    }
    this._featureInFlight.add(featureKey);

    try {
      const user = await this.usersService.findOne(userId);
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
      
      await this.recordDropActivity(
        {
          dropId,
          userId: user.id,
          action: 'photo_unfeatured',
        },
        { photoId },
      );

      return this.dropsRepository.findPhotoById(photoId) as Promise<DropPhoto>;
    }

    await this.ensurePhotoHasStorageUrl(photo);
    await this.dropsRepository.updatePhoto(photoId, { isFeatured: true });

    await this.recordDropActivity(
      {
        dropId,
        userId: user.id,
        action: 'photo_featured',
      },
      { photoId },
    );

    return this.dropsRepository.findPhotoById(photoId) as Promise<DropPhoto>;
    } finally {
      this._featureInFlight.delete(featureKey);
    }
  }

  async deletePhoto(dropId: string, photoId: string, userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException('Drop not found');

    const photo = await this.dropsRepository.findPhotoById(photoId);
    if (!photo || photo.dropId !== dropId) throw new NotFoundException('Photo not found');

    // Only the owner of the photo or the Chief can delete it
    if (photo.userId !== user.id && drop.organiserId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this photo');
    }

    if (photo.storagePath || photo.url) {
      try {
        const storagePath =
          photo.storagePath ??
          this.mediaAssets.buildDropPhotoPath(dropId, photo.id, photo.mimeType ?? 'image/jpeg');
        await this.mediaAssets.deleteByPath(storagePath);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to delete roll photo from storage (dropId=${dropId}, photoId=${photo.id}): ${detail}`,
        );
      }
    }

    await this.dropsRepository.deletePhoto(photoId);

    await this.recordDropActivity(
      {
        dropId,
        userId: user.id,
        action: 'photo_removed',
      },
      { photoId },
    );
  }

  async sparkDrop(dropId: string, userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.findOne(dropId, userId);

    const existing = await this.dropsRepository.findSpark(dropId, user.id);
    if (existing) return;

    await this.dropsRepository.addSpark(dropId, user.id);
    this.logDropAction('spark', dropId, user.id);
  }

  async unsparkDrop(dropId: string, userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.findOne(dropId, userId);
    await this.dropsRepository.removeSpark(dropId, user.id);
    this.logDropAction('unspark', dropId, user.id);
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

  private getCalendarAge(birthDate: Date, ref: Date): number {
    let age = ref.getFullYear() - birthDate.getFullYear();
    const monthDiff = ref.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private assertUserMeetsDropMinimumAge(user: User, drop: Drop): void {
    const min = drop.minimumAge;
    if (min == null || min < 1) return;

    if (!user.birthday) {
      throw new ForbiddenException(
        'Add your birthday in your profile to join this drop.',
      );
    }

    const birth = user.birthday instanceof Date ? user.birthday : new Date(user.birthday);
    if (Number.isNaN(birth.getTime())) {
      throw new ForbiddenException(
        'Add your birthday in your profile to join this drop.',
      );
    }

    const age = this.getCalendarAge(birth, new Date());
    if (age < min) {
      throw new ForbiddenException(
        `You must be at least ${min} years old to join this drop.`,
      );
    }
  }

  private buildDropUrl(dropId: string): string {
    const webUrlEnv = this.configService.get<string>('WEB_URL', 'http://localhost:4200');
    const baseUrl = webUrlEnv.split(',')[0]?.trim() || 'http://localhost:4200';
    return `${baseUrl}/drops/${dropId}`;
  }

  private sendJoinRequestedNotifications(drop: Drop, actor: User): void {
    void (async () => {
      try {
        const dropUrl = this.buildDropUrl(drop.id);
        const actorName = `${actor.firstName} ${actor.lastName}`;
        const managerIds = await this.dropsRepository.findManagerUserIds(drop.id);
        for (const id of managerIds.filter((mid) => mid !== actor.id)) {
          const manager = await this.usersService.findOne(id).catch(() => null);
          if (!manager) continue;
          void this.notificationsService.create(
            id,
            NotificationType.JOIN_REQUESTED,
            `Someone wants to join ${drop.name}`,
            `${actorName} wants to join "${drop.name}".`,
            { dropId: drop.id, actorId: actor.id, actorName, dropName: drop.name },
            { email: manager.email, dropUrl },
          );
        }
      } catch { /* non-fatal */ }
    })();
  }

  private sendMemberJoinedNotifications(drop: Drop, actor: User): void {
    void (async () => {
      try {
        const actorName = `${actor.firstName} ${actor.lastName}`;
        const managerIds = await this.dropsRepository.findManagerUserIds(drop.id);
        for (const id of managerIds.filter((mid) => mid !== actor.id)) {
          void this.notificationsService.create(
            id,
            NotificationType.MEMBER_JOINED,
            `${actor.firstName} joined ${drop.name}`,
            `${actorName} has joined "${drop.name}".`,
            { dropId: drop.id, actorId: actor.id, actorName, dropName: drop.name },
          );
        }
      } catch { /* non-fatal */ }
    })();
  }

  private sendMemberLeftNotifications(drop: Drop, actor: User): void {
    void (async () => {
      try {
        const actorName = `${actor.firstName} ${actor.lastName}`;
        const managerIds = await this.dropsRepository.findManagerUserIds(drop.id);
        for (const id of managerIds.filter((mid) => mid !== actor.id)) {
          void this.notificationsService.create(
            id,
            NotificationType.MEMBER_LEFT,
            `${actor.firstName} left ${drop.name}`,
            `${actorName} has left "${drop.name}".`,
            { dropId: drop.id, actorId: actor.id, actorName, dropName: drop.name },
          );
        }
      } catch { /* non-fatal */ }
    })();
  }

  private sendJoinApprovedNotification(drop: Drop, targetUser: User): void {
    void this.notificationsService.create(
      targetUser.id,
      NotificationType.JOIN_APPROVED,
      `You're in! Join request approved`,
      `Your request to join "${drop.name}" has been approved.`,
      { dropId: drop.id, dropName: drop.name },
      { email: targetUser.email, dropUrl: this.buildDropUrl(drop.id) },
    ).catch(() => undefined);
  }

  private sendJoinRejectedNotification(drop: Drop, targetUser: User): void {
    void this.notificationsService.create(
      targetUser.id,
      NotificationType.JOIN_REJECTED,
      `Join request not approved`,
      `Your request to join "${drop.name}" was not approved.`,
      { dropId: drop.id, dropName: drop.name },
      { email: targetUser.email },
    ).catch(() => undefined);
  }

  private sendMemberRemovedNotification(drop: Drop, targetUser: User): void {
    void this.notificationsService.create(
      targetUser.id,
      NotificationType.MEMBER_REMOVED,
      `Removed from ${drop.name}`,
      `You have been removed from "${drop.name}".`,
      { dropId: drop.id, dropName: drop.name },
    ).catch(() => undefined);
  }

  private sendInvitedNotification(drop: Drop, targetUserId: string): void {
    void (async () => {
      try {
        const targetUser = await this.usersService.findOne(targetUserId).catch(() => null);
        if (!targetUser) return;
        void this.notificationsService.create(
          targetUserId,
          NotificationType.INVITED_TO_DROP,
          `You're invited to ${drop.name}`,
          `You've been invited to join "${drop.name}".`,
          { dropId: drop.id, dropName: drop.name },
        );
      } catch { /* non-fatal */ }
    })();
  }

  private sendDropEditedNotifications(
    dropId: string,
    dropName: string,
    actorId: string,
    scheduledAtChanged: boolean,
    locationChanged: boolean,
  ): void {
    void (async () => {
      try {
        const changed: string[] = [];
        if (scheduledAtChanged) changed.push('date & time');
        if (locationChanged) changed.push('location');
        const changeList = changed.join(' and ');

        const dropUrl = this.buildDropUrl(dropId);
        const userIds = await this.dropsRepository.findInCrewUserIds(dropId);
        for (const userId of userIds.filter((uid) => uid !== actorId)) {
          try {
            const user = await this.usersService.findOne(userId).catch(() => null);
            if (!user) continue;
            void this.notificationsService.create(
              userId,
              NotificationType.DROP_EDITED,
              `${dropName} has been updated`,
              `The ${changeList} for "${dropName}" has been updated. Check the drop for details.`,
              { dropId, dropName },
              { email: user.email, dropUrl },
            );
          } catch { /* non-fatal per-user */ }
        }
      } catch (err) {
        this.logger.warn(`Failed to send drop edited notifications for drop ${dropId}: ${err}`);
      }
    })();
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

  private async assertCanManageDrop(dropId: string, userId: string, message: string): Promise<Drop> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    if (drop.organiserId === userId) return drop;

    const crew = await this.dropsRepository.findCrewMember(dropId, userId);
    if (crew?.memberRole === DropCrewMemberRole.CO_CHIEF) return drop;

    throw new ForbiddenException(message);
  }

  async addItem(dropId: string, name: string, requesterId: string): Promise<DropItem> {
    await this.assertCanManageDrop(dropId, requesterId, 'Only the organiser or co-chiefs can add items');

    const item = await this.dropsRepository.addItem({ dropId, name });

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'item_added',
      changedFields: { itemName: name },
    });

    return item;
  }

  async renameItem(dropId: string, itemId: string, name: string, requesterId: string): Promise<void> {
    await this.assertCanManageDrop(dropId, requesterId, 'Only the organiser or co-chiefs can rename items');

    const item = await this.dropsRepository.findItemById(itemId);
    if (!item || item.dropId !== dropId) {
      throw new NotFoundException(`Item ${itemId} not found in this drop`);
    }

    await this.dropsRepository.updateItem(itemId, { name });

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'item_renamed',
      changedFields: { itemId, itemName: name, previousName: item.name },
    });
  }

  async removeItem(dropId: string, itemId: string, requesterId: string): Promise<void> {
    await this.assertCanManageDrop(dropId, requesterId, 'Only the organiser or co-chiefs can remove items');

    const item = await this.dropsRepository.findItemById(itemId);
    if (!item || item.dropId !== dropId) {
      throw new NotFoundException(`Item ${itemId} not found in this drop`);
    }

    await this.dropsRepository.deleteItem(itemId);

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'item_removed',
      changedFields: { itemName: item.name },
    });
  }

  async assignItem(dropId: string, itemId: string, assignedUserId: string, requesterId: string): Promise<void> {
    await this.assertCanManageDrop(dropId, requesterId, 'Only the organiser or co-chiefs can assign items');

    const item = await this.dropsRepository.findItemById(itemId);
    if (!item || item.dropId !== dropId) {
      throw new NotFoundException(`Item ${itemId} not found in this drop`);
    }

    const crewMember = await this.dropsRepository.findActiveInCrewMember(dropId, assignedUserId);
    if (!crewMember) {
      throw new BadRequestException('Assigned user must be an active crew member');
    }

    await this.dropsRepository.updateItem(itemId, { assignedUserId });

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'item_assigned',
      changedFields: { itemId, itemName: item.name, assignedUserId },
    });
  }

  async unassignItem(dropId: string, itemId: string, requesterId: string): Promise<void> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    const item = await this.dropsRepository.findItemById(itemId);
    if (!item || item.dropId !== dropId) {
      throw new NotFoundException(`Item ${itemId} not found in this drop`);
    }

    const requesterCrew = await this.dropsRepository.findCrewMember(dropId, requesterId);
    const isOrganiser = drop.organiserId === requesterId;
    const isCoChief = requesterCrew?.memberRole === DropCrewMemberRole.CO_CHIEF;
    const isSelfUnassign = item.assignedUserId === requesterId;

    if (!isOrganiser && !isCoChief && !isSelfUnassign) {
      throw new ForbiddenException('Only the organiser, co-chiefs or the assigned crew member can unassign this item');
    }

    if (item.isConfirmed && !isOrganiser && !isCoChief) {
      throw new BadRequestException('Confirmed gear cannot be unassigned by crew. Ask the Chief to release it.');
    }

    await this.dropsRepository.updateItem(itemId, { assignedUserId: null as any });

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: isSelfUnassign && !isOrganiser && !isCoChief ? 'item_unpicked' : 'item_assigned',
      changedFields: { itemId, itemName: item.name, assignedUserId: null },
    });
  }

  async randomAssignItems(dropId: string, requesterId: string): Promise<void> {
    await this.assertCanManageDrop(dropId, requesterId, 'Only the organiser or co-chiefs can trigger random assignment');

    const unassignedItems = await this.dropsRepository.findUnassignedItems(dropId);
    if (!unassignedItems.length) return;

    const activeCrew = await this.dropsRepository.findActiveInCrewWithUsers(dropId);
    if (!activeCrew.length) throw new BadRequestException('No active crew members to assign items to');

    // Filter out crew who already have an item assigned, then shuffle
    const allItems = await this.dropsRepository.findItemsByDropId(dropId);
    const assignedUserIds = new Set(allItems.map(i => i.assignedUserId).filter(Boolean));
    const eligibleCrew = activeCrew.filter(m => !assignedUserIds.has(m.userId));

    if (!eligibleCrew.length) throw new BadRequestException('All crew members already have an item assigned');

    // Shuffle eligible crew and pair one item per member
    const shuffled = [...eligibleCrew].sort(() => Math.random() - 0.5);
    const pairs = unassignedItems.slice(0, shuffled.length);

    for (let i = 0; i < pairs.length; i++) {
      await this.dropsRepository.updateItem(pairs[i]!.id, { assignedUserId: shuffled[i]!.userId });
    }

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'items_randomly_assigned',
    });
  }

  async pickItem(dropId: string, itemId: string, userId: string): Promise<void> {
    const drop = await this.dropsRepository.findById(dropId);
    if (!drop) throw new NotFoundException(`Drop ${dropId} not found`);

    const crewMember = await this.dropsRepository.findActiveInCrewMember(dropId, userId);
    if (!crewMember) {
      throw new ForbiddenException('Only active crew members can pick items');
    }

    const item = await this.dropsRepository.findItemById(itemId);
    if (!item || item.dropId !== dropId) {
      throw new NotFoundException(`Item ${itemId} not found in this drop`);
    }

    if (item.assignedUserId) {
      throw new ConflictException('Item is already assigned');
    }

    await this.dropsRepository.updateItem(itemId, { assignedUserId: userId });

    await this.recordDropActivity({
      dropId,
      userId,
      action: 'item_picked',
      changedFields: { itemId, itemName: item.name },
    });
  }

  async confirmItem(dropId: string, itemId: string, requesterId: string): Promise<void> {
    await this.assertCanManageDrop(dropId, requesterId, 'Only the organiser or co-chiefs can confirm gear arrival');

    const item = await this.dropsRepository.findItemById(itemId);
    if (!item || item.dropId !== dropId) {
      throw new NotFoundException(`Item ${itemId} not found in this drop`);
    }

    if (!item.assignedUserId) {
      throw new BadRequestException('Cannot confirm unassigned gear');
    }

    await this.dropsRepository.confirmItem(itemId, true);

    await this.recordDropActivity({
      dropId,
      userId: requesterId,
      action: 'item_confirmed',
      changedFields: { itemId, itemName: item.name, assignedUserId: item.assignedUserId },
    });
  }
}
