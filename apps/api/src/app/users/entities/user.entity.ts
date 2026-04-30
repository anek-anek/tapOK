import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GenderEnum, UserRole } from '../../../common';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationMember } from '../../organizations/entities/organization-member.entity';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  firstName: string;

  @ApiProperty()
  @Column()
  lastName: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  avatar?: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARTICIPANT })
  role: UserRole;

  @ApiProperty()
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationSentAt?: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  googleId?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true, unique: true })
  firebaseUid?: string;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ApiProperty({ enum: GenderEnum, description: 'Gender of the user', required: false })
  @Column({ type: 'enum', enum: GenderEnum, nullable: true })
  gender?: GenderEnum;

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  birthday?: Date;

  @OneToMany(() => OrganizationMember, (member) => member.user)
  memberships: OrganizationMember[];

  @ApiProperty({ required: false })
  @Column({ nullable: true, unique: true })
  userHandle?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Whether the user has accepted the Terms & Conditions' })
  @Column({ default: false })
  termsAccepted: boolean;

  @ApiProperty({ required: false, description: 'Timestamp when Terms & Conditions were accepted' })
  @Column({ type: 'timestamptz', nullable: true })
  termsAcceptedAt?: Date;

  @ApiProperty({ description: 'Whether the user has accepted the Privacy Policy' })
  @Column({ default: false })
  privacyPolicyAccepted: boolean;

  @ApiProperty({ required: false, description: 'Timestamp when Privacy Policy was accepted' })
  @Column({ type: 'timestamptz', nullable: true })
  privacyPolicyAcceptedAt?: Date;
}
