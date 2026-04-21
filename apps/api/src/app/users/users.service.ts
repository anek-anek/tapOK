import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

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

  async syncFromFirebase(token: DecodedIdToken): Promise<User> {
    const [firstName = '', ...rest] = (token.name ?? '').split(' ');
    const lastName = rest.join(' ');

    const user = await this.usersRepository.upsertByFirebaseUid(token.uid, {
      email: token.email ?? '',
      firstName,
      lastName,
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
}
