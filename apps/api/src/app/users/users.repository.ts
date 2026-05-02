import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findAll(page: number = 1, limit: number = 100): Promise<User[]> {
    return this.repo.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.repo.findOneBy({ firebaseUid });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  create(dto: CreateUserDto): Promise<User> {
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }

  async upsertByFirebaseUid(
    firebaseUid: string,
    data: Partial<User>,
  ): Promise<User> {
    let existing = await this.findByFirebaseUid(firebaseUid);

    if (!existing && data.email && data.isEmailVerified) {
      existing = await this.repo.findOneBy({ email: data.email });
    }

    if (existing) {
      await this.repo.update(existing.id, { ...data, firebaseUid });
      return this.findById(existing.id) as Promise<User>;
    }
    const user = this.repo.create({ ...data, firebaseUid });
    return this.repo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
