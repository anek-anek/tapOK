import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { FrequentCrewDto } from './dto/frequent-crew.dto';
import { AuthProvider, MediaAssetsService } from '../../common';
import type { BetterAuthUser } from '../../common/better-auth/better-auth.service';
import { CreateAvatarUploadDto } from './dto/create-avatar-upload.dto';
import { AvatarUploadSessionDto } from './dto/avatar-upload-session.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
    private readonly mediaAssets: MediaAssetsService,
  ) {}

  private async resolveAvatarReference(avatar?: string | null): Promise<string | undefined> {
    if (!avatar) return undefined;
    const storagePath = this.mediaAssets.extractStoragePath(avatar);
    if (!storagePath) return avatar;
    return (await this.mediaAssets.tryResolveReadUrl(storagePath)) ?? undefined;
  }

  async findAll(page: number = 1, limit: number = 100): Promise<User[]> {
    const users = await this.usersRepository.findAll(page, limit);
    return Promise.all(
      users.map(async (user) => ({
        ...user,
        avatar: await this.resolveAvatarReference(user.avatar),
      })),
    );
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return { ...user, avatar: await this.resolveAvatarReference(user.avatar) };
  }

  async findExistingAuthProviderByEmail(email: string): Promise<AuthProvider | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;
    const user = await this.usersRepository.findByEmail(normalizedEmail);
    return user?.authProvider ?? null;
  }

  async findMe(betterAuthUser: BetterAuthUser): Promise<UserProfileDto> {
    const user = await this.usersRepository.findById(betterAuthUser.id);
    if (!user) throw new NotFoundException('No account found for this user.');

    const [{ dropCount, crewReached }] = await this.dataSource.query<
      [{ dropCount: string; crewReached: string }]
    >(
      `
      SELECT
        (SELECT COUNT(*) FROM drops WHERE "organiserId" = $1) as "dropCount",
        (SELECT COUNT(DISTINCT c."userId")
         FROM drop_crew c
         WHERE c."dropId" IN (SELECT id FROM drops WHERE "organiserId" = $1)
         AND c.status = 'in') as "crewReached"
      `,
      [user.id],
    );

    return {
      ...user,
      avatar: await this.resolveAvatarReference(user.avatar),
      dropCount: parseInt(dropCount, 10),
      crewReached: parseInt(crewReached, 10),
    };
  }

  create(dto: CreateUserDto): Promise<User> {
    return this.usersRepository.create(dto);
  }

  async syncUser(betterAuthUser: BetterAuthUser, dto: SyncUserDto = {}): Promise<User> {
    const email = betterAuthUser.email.trim().toLowerCase();
    const authProvider = betterAuthUser.email
      ? (betterAuthUser as any).accounts?.[0]?.providerId === 'google'
        ? AuthProvider.GOOGLE
        : AuthProvider.PASSWORD
      : AuthProvider.PASSWORD;

    const existing = await this.usersRepository.findByEmail(email);

    if (existing) {
      const updated = Object.assign(existing, {
        firstName: dto.firstName?.trim() || existing.firstName,
        lastName: dto.lastName?.trim() || existing.lastName,
        avatar: betterAuthUser.image || existing.avatar,
        isEmailVerified: betterAuthUser.emailVerified ?? existing.isEmailVerified,
        emailVerifiedAt:
          betterAuthUser.emailVerified && !existing.emailVerifiedAt
            ? new Date()
            : existing.emailVerifiedAt,
        gender: dto.gender ?? existing.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : existing.birthday,
        userHandle: dto.userHandle?.trim() || existing.userHandle,
        termsAccepted: dto.termsAccepted ?? existing.termsAccepted ?? false,
        termsAcceptedAt: dto.termsAcceptedAt
          ? new Date(dto.termsAcceptedAt)
          : existing.termsAcceptedAt,
        privacyPolicyAccepted:
          dto.privacyPolicyAccepted ?? existing.privacyPolicyAccepted ?? false,
        privacyPolicyAcceptedAt: dto.privacyPolicyAcceptedAt
          ? new Date(dto.privacyPolicyAcceptedAt)
          : existing.privacyPolicyAcceptedAt,
      });
      const user = await this.usersRepository.save(updated);
      return { ...user, avatar: await this.resolveAvatarReference(user.avatar) };
    }

    // First sync after signup — create the profile row
    const [tokenFirst = '', ...rest] = (betterAuthUser.name ?? '').split(' ');
    const tokenLast = rest.join(' ');

    const user = await this.usersRepository.create({
      id: betterAuthUser.id,
      email,
      authProvider,
      firstName: dto.firstName?.trim() || tokenFirst,
      lastName: dto.lastName?.trim() || tokenLast,
      avatar: betterAuthUser.image ?? undefined,
      isEmailVerified: betterAuthUser.emailVerified ?? false,
      emailVerifiedAt: betterAuthUser.emailVerified ? new Date() : undefined,
      gender: dto.gender,
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      userHandle: dto.userHandle?.trim(),
      termsAccepted: dto.termsAccepted ?? false,
      termsAcceptedAt: dto.termsAcceptedAt ? new Date(dto.termsAcceptedAt) : undefined,
      privacyPolicyAccepted: dto.privacyPolicyAccepted ?? false,
      privacyPolicyAcceptedAt: dto.privacyPolicyAcceptedAt
        ? new Date(dto.privacyPolicyAcceptedAt)
        : undefined,
    });
    return { ...user, avatar: await this.resolveAvatarReference(user.avatar) };
  }

  async assertOwnership(id: string, requesterId: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (user.id !== requesterId) throw new ForbiddenException('Access denied');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string): Promise<User> {
    await this.assertOwnership(id, requesterId);
    try {
      const user = await this.usersRepository.update(id, dto);
      if (!user) throw new NotFoundException(`User ${id} not found`);
      return { ...user, avatar: await this.resolveAvatarReference(user.avatar) };
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.detail?.includes('userHandle')) {
          throw new ConflictException('THIS USER HANDLE IS ALREADY TAKEN');
        }
        if (err.detail?.includes('email')) {
          throw new ConflictException('THIS EMAIL IS ALREADY REGISTERED');
        }
      }
      throw err;
    }
  }

  async createAvatarUploadSession(
    id: string,
    requesterId: string,
    dto: CreateAvatarUploadDto,
  ): Promise<AvatarUploadSessionDto> {
    const user = await this.assertOwnership(id, requesterId);
    const mimeType = dto.mimeType === 'image/jpg' ? 'image/jpeg' : dto.mimeType;
    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      throw new BadRequestException('Invalid image format: Only JPG and PNG are allowed');
    }
    const storagePath = this.mediaAssets.buildUserAvatarPath(user.id, mimeType);
    const { token } = await this.mediaAssets.createSignedUpload(storagePath);
    await this.usersRepository.save({ ...user, avatarStoragePath: storagePath });
    return { userId: user.id, storagePath, uploadToken: token };
  }

  async completeAvatarUpload(id: string, requesterId: string): Promise<User> {
    const user = await this.assertOwnership(id, requesterId);
    const storagePath =
      user.avatarStoragePath ?? this.mediaAssets.extractStoragePath(user.avatar ?? '');
    if (!storagePath) {
      throw new BadRequestException('Avatar upload session not found');
    }
    const exists = await this.mediaAssets.storageObjectExists(storagePath);
    if (!exists) {
      throw new BadRequestException('Uploaded avatar file not found in storage');
    }

    const previousPath = this.mediaAssets.extractStoragePath(user.avatar ?? '');
    const saved = await this.usersRepository.save({
      ...user,
      avatarStoragePath: storagePath,
      avatar: storagePath,
    });

    if (previousPath && previousPath !== storagePath) {
      try {
        await this.mediaAssets.deleteByPath(previousPath);
      } catch (err) {
        this.logger.warn(`Failed to delete old avatar for user ${user.id}: ${String(err)}`);
      }
    }

    return { ...saved, avatar: await this.resolveAvatarReference(saved.avatar) };
  }

  async remove(id: string, requesterId: string): Promise<void> {
    await this.assertOwnership(id, requesterId);
    await this.usersRepository.remove(id);
  }

  async getFrequentCrew(userId: string): Promise<FrequentCrewDto[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('No account found for this user.');

    const results = await this.dataSource.query(
      `
      SELECT u.id, u."firstName", u."lastName", u.avatar, u."userHandle", u."createdAt", COUNT(c2."dropId") AS "frequencyCount"
      FROM drop_crew c1
      JOIN drop_crew c2 ON c1."dropId" = c2."dropId" AND c1."userId" != c2."userId"
      JOIN users u ON u.id = c2."userId"
      WHERE c1."userId" = $1 AND c1.status = 'in' AND c2.status = 'in'
      GROUP BY u.id, u."firstName", u."lastName", u.avatar, u."userHandle", u."createdAt"
      ORDER BY "frequencyCount" DESC
      LIMIT 5
      `,
      [user.id],
    );

    const mapped = results.map((r: any) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      avatar: r.avatar,
      userHandle: r.userHandle,
      createdAt: r.createdAt,
      frequencyCount: parseInt(r.frequencyCount, 10),
    }));
    return Promise.all(
      mapped.map(async (member: FrequentCrewDto) => ({
        ...member,
        avatar: await this.resolveAvatarReference(member.avatar),
      })),
    );
  }

  async isLinkExpired(email: string, type: 'reset' | 'verify'): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return true;

    const sentAt = type === 'reset' ? user.passwordResetSentAt : user.emailVerificationSentAt;
    if (!sentAt) return true;

    const EXPIRY_MS = 10 * 60 * 1000;
    return new Date().getTime() - new Date(sentAt).getTime() > EXPIRY_MS;
  }
}
