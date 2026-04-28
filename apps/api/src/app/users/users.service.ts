import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { FrequentCrewDto } from './dto/frequent-crew.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.usersRepository.findByFirebaseUid(firebaseUid);
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

  async syncFromFirebase(token: DecodedIdToken, dto: SyncUserDto = {}): Promise<User> {
    const [tokenFirst = '', ...rest] = (token.name ?? '').split(' ');
    const tokenLast = rest.join(' ');

    const user = await this.usersRepository.upsertByFirebaseUid(token.uid, {
      email: token.email ?? '',
      firstName: dto.firstName ?? tokenFirst,
      lastName: dto.lastName ?? tokenLast,
      avatar: token.picture,
      googleId: token.firebase.sign_in_provider === 'google.com' ? token.uid : undefined,
      isEmailVerified: token.email_verified ?? false,
    });

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
      WHERE c1."userId" = $1 AND c1.status = 'IN' AND c2.status = 'IN'
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
