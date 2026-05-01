import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '../../../common';
import { Organization } from './organization.entity';
import { User } from '../../users/entities/user.entity';

@Entity('organization_members')
@Unique(['organizationId', 'userId'])
export class OrganizationMember {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  organizationId: string;

  @ApiProperty()
  @Index('idx_organization_members_user_id')
  @Column()
  userId: string;

  @ApiProperty({ enum: OrgRole })
  @Column({ type: 'enum', enum: OrgRole, default: OrgRole.MEMBER })
  role: OrgRole;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;

  @ManyToOne(() => Organization, (org) => org.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
