import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from './entities/user.entity';
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
    return this.repo.findOne({
      where: { email: ILike(email.trim()) },
    });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    if (Object.keys(dto).length === 0) {
      return this.findById(id);
    }
    const user = await this.findById(id);
    if (!user) return null;
    
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .addSelect('user.emailVerificationTokenExpiresAt')
      .where('user.emailVerificationToken = :token', { token })
      .getOne();
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
