import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncAuthMode, SyncUserDto } from './dto/sync-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { FrequentCrewDto } from './dto/frequent-crew.dto';
import { AuthProvider, UserRole } from '../../common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}

  findAll(page: number = 1, limit: number = 100): Promise<User[]> {
    return this.usersRepository.findAll(page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.usersRepository.findByFirebaseUid(firebaseUid);
  }

  async findExistingAuthProviderByEmail(email: string): Promise<AuthProvider | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    // 1. Check our database first
    const user = await this.usersRepository.findByEmail(normalizedEmail);
    if (user) return user.authProvider;

    // 2. Fallback: Check Firebase Auth directly (for accounts not yet synced to DB)
    try {
      const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      const firstProvider = userRecord.providerData?.[0];
      
      if (firstProvider) {
        const providerId = firstProvider.providerId;
        if (providerId === 'google.com') return AuthProvider.GOOGLE;
        if (providerId === 'password') return AuthProvider.PASSWORD;
      }
    } catch (err) {
      // User not found in Firebase or other error
      this.logger.debug(`Firebase lookup failed for ${normalizedEmail}: ${err}`);
    }

    return null;
  }

  async findMe(firebaseUid: string): Promise<UserProfileDto> {
    const user = await this.usersRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('No account found for this user.');

    const [{ count }] = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) AS count FROM drops WHERE "organiserId" = $1`,
      [user.id],
    );

    return { ...user, dropCount: parseInt(count, 10) };
  }

  create(dto: CreateUserDto): Promise<User> {
    return this.usersRepository.create(dto);
  }

  async assertOwnership(id: string, firebaseUid: string): Promise<User> {
    const user = await this.findOne(id);
    if (user.firebaseUid !== firebaseUid) throw new ForbiddenException('Access denied');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, firebaseUid: string): Promise<User> {
    await this.assertOwnership(id, firebaseUid);
    const user = await this.usersRepository.update(id, dto);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async remove(id: string, firebaseUid: string): Promise<void> {
    await this.assertOwnership(id, firebaseUid);
    await this.usersRepository.remove(id);
  }

  private getAuthProviderFromToken(token: DecodedIdToken): AuthProvider {
    const signInProvider = token.firebase.sign_in_provider;

    if (signInProvider === 'google.com') return AuthProvider.GOOGLE;
    if (signInProvider === 'password') return AuthProvider.PASSWORD;

    throw new BadRequestException({
      message: 'This sign-in method is not supported on TapOK.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  private getProviderMismatchMessage(existingProvider: AuthProvider): string {
    if (existingProvider === AuthProvider.GOOGLE) {
      return 'This email is registered with Google. Continue with Google sign-in instead.';
    }

    return 'This email is registered with email and password. Sign in with your password instead.';
  }

  private buildSyncedProfile(
    token: DecodedIdToken,
    dto: SyncUserDto,
    existingUser: User | null,
    authProvider: AuthProvider,
  ): Partial<User> {
    const [tokenFirst = '', ...rest] = (token.name ?? '').split(' ');
    const tokenLast = rest.join(' ');

    const isEmailVerified = token.email_verified ?? existingUser?.isEmailVerified ?? false;
    
    // Logic to set emailVerifiedAt if it wasn't set before and user is now verified
    let emailVerifiedAt = existingUser?.emailVerifiedAt;
    if (isEmailVerified && !existingUser?.isEmailVerified) {
      const sentAt = existingUser?.emailVerificationSentAt;
      const EXPIRY_MS = 10 * 60 * 1000;
      
      if (sentAt && (new Date().getTime() - new Date(sentAt).getTime() > EXPIRY_MS)) {
        return {
          ...existingUser,
          isEmailVerified: false,
        } as any;
      }
      
      emailVerifiedAt = new Date();
    }

    return {
      email: token.email ?? existingUser?.email ?? '',
      authProvider,
      firstName: dto.firstName?.trim() || existingUser?.firstName || tokenFirst,
      lastName: dto.lastName?.trim() || existingUser?.lastName || tokenLast,
      avatar: token.picture || existingUser?.avatar,
      googleId: authProvider === AuthProvider.GOOGLE ? token.uid : existingUser?.googleId,
      isEmailVerified,
      emailVerifiedAt,
      gender: dto.gender ?? existingUser?.gender,
      birthday: dto.birthday ? new Date(dto.birthday) : existingUser?.birthday,
      userHandle: dto.userHandle?.trim() || existingUser?.userHandle,
    };
  }

  async isLinkExpired(email: string, type: 'reset' | 'verify'): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return true;

    const sentAt = type === 'reset' ? user.passwordResetSentAt : user.emailVerificationSentAt;
    if (!sentAt) return true;

    const EXPIRY_MS = 10 * 60 * 1000;
    return (new Date().getTime() - new Date(sentAt).getTime()) > EXPIRY_MS;
  }

  async syncFromFirebase(token: DecodedIdToken, dto: SyncUserDto = {}): Promise<User> {
    const firebaseUid = token.uid;
    let tokenEmail = (
      token.email ||
      token.firebase?.identities?.['email']?.[0] ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!tokenEmail) {
      try {
        const userRecord = await admin.auth().getUser(firebaseUid);
        tokenEmail = (userRecord.email ?? '').trim().toLowerCase();

        // If primary email is missing, check provider-specific data
        if (!tokenEmail && userRecord.providerData) {
          const providerEmail = userRecord.providerData.find((p) => p.email)?.email;
          if (providerEmail) tokenEmail = providerEmail.trim().toLowerCase();
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch user record for ${firebaseUid}: ${err}`);
      }
    }

    const email = tokenEmail || (dto.email ?? '').trim().toLowerCase();
    const isEmailVerified = token.email_verified ?? false;
    const authMode = dto.authMode ?? SyncAuthMode.LOGIN;
    const tokenAuthProvider = this.getAuthProviderFromToken(token);
    const requestedAuthProvider = dto.authProvider ?? tokenAuthProvider;

    if (requestedAuthProvider !== tokenAuthProvider) {
      throw new BadRequestException({
        message: 'This sign-in attempt could not be verified. Please try again.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const existingByUid = await this.usersRepository.findByFirebaseUid(firebaseUid);
    const existingByEmail = !existingByUid && email
      ? await this.usersRepository.findByEmail(email)
      : null;

    if (existingByUid) {
      if (existingByUid.authProvider !== requestedAuthProvider) {
        throw new ForbiddenException({
          message: this.getProviderMismatchMessage(existingByUid.authProvider),
          code: 'AUTH_PROVIDER_MISMATCH',
        });
      }

      const syncedUser = Object.assign(
        existingByUid,
        this.buildSyncedProfile(token, dto, existingByUid, requestedAuthProvider),
      );
      const user = await this.usersRepository.save(syncedUser);

      try {
        await admin.auth().setCustomUserClaims(token.uid, { role: user.role });
      } catch (err) {
        this.logger.warn(`Failed to set custom claims for ${token.uid}: ${err}`);
      }

      return user;
    }

    if (existingByEmail && existingByEmail.authProvider !== requestedAuthProvider) {
      throw new ForbiddenException({
        message: this.getProviderMismatchMessage(existingByEmail.authProvider),
        code: 'AUTH_PROVIDER_MISMATCH',
      });
    }

    if (!email) {
      throw new BadRequestException({
        message: 'Google did not share your email address. Please enter your email in the field to continue.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (!existingByEmail) {
      if (authMode === SyncAuthMode.LOGIN) {
        throw new NotFoundException({
          message: 'No TapOK account found. Please sign up first.',
          code: 'NO_ACCOUNT',
        });
      }

      const user = await this.usersRepository.create({
        ...this.buildSyncedProfile(token, dto, null, requestedAuthProvider),
        email,
        firebaseUid,
      });

      try {
        await admin.auth().setCustomUserClaims(token.uid, { role: user.role });
      } catch (err) {
        this.logger.warn(`Failed to set custom claims for ${token.uid}: ${err}`);
      }

      return user;
    }

    if (existingByEmail.firebaseUid && existingByEmail.firebaseUid !== firebaseUid) {
      throw new ForbiddenException({
        message: 'This email is already connected to a different TapOK account.',
        code: 'AUTH_PROVIDER_MISMATCH',
      });
    }

    if (!isEmailVerified) {
      throw new ForbiddenException({
        message: 'Verification Required: Please verify your email before continuing. You can resend the link from your Profile.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (existingByEmail.role === UserRole.ADMIN && !existingByEmail.firebaseUid) {
      throw new ForbiddenException({
        message: 'This account must be linked by a platform administrator.',
        code: 'AUTH_PROVIDER_MISMATCH',
      });
    }

    const syncedUser = Object.assign(
      existingByEmail,
      this.buildSyncedProfile(token, dto, existingByEmail, requestedAuthProvider),
      { firebaseUid },
    );
    const user = await this.usersRepository.save(syncedUser);

    try {
      await admin.auth().setCustomUserClaims(token.uid, { role: user.role });
    } catch (err) {
      this.logger.warn(`Failed to set custom claims for ${token.uid}: ${err}`);
    }

    return user;
  }

  async getFrequentCrew(firebaseUid: string): Promise<FrequentCrewDto[]> {
    const user = await this.usersRepository.findByFirebaseUid(firebaseUid);
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

    return results.map((r: any) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      avatar: r.avatar,
      userHandle: r.userHandle,
      createdAt: r.createdAt,
      frequencyCount: parseInt(r.frequencyCount, 10),
    }));
  }
}
