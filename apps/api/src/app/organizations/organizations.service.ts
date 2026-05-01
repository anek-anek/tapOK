import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole } from '../../common';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationsRepository } from './organizations.repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly repo: OrganizationsRepository) {}

  findAllForCaller(userId: string, isPlatformAdmin: boolean): Promise<Organization[]> {
    if (isPlatformAdmin) return this.repo.findAll();
    return this.repo.findOrganizationsForUser(userId);
  }

  async findOne(id: string, requesterDbUserId: string, isPlatformAdmin: boolean): Promise<Organization> {
    const org = await this.repo.findById(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    if (!isPlatformAdmin) {
      const member = await this.repo.findMember(id, requesterDbUserId);
      if (!member) throw new NotFoundException(`Organization ${id} not found`);
    }
    return org;
  }

  async create(dto: CreateOrganizationDto, ownerUserId: string): Promise<Organization> {
    const org = await this.repo.create(dto);
    await this.repo.addMember(org.id, ownerUserId, OrgRole.OWNER);
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, requesterId: string): Promise<Organization> {
    await this.assertRole(id, requesterId, [OrgRole.OWNER, OrgRole.ADMIN]);
    const org = await this.repo.update(id, dto);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    return org;
  }

  async remove(id: string, requesterId: string): Promise<void> {
    await this.assertRole(id, requesterId, [OrgRole.OWNER]);
    await this.repo.remove(id);
  }

  async findMembers(
    orgId: string,
    requesterDbUserId: string,
    isPlatformAdmin: boolean,
  ): Promise<OrganizationMember[]> {
    const org = await this.repo.findById(orgId);
    if (!org) throw new NotFoundException(`Organization ${orgId} not found`);
    if (!isPlatformAdmin) {
      const member = await this.repo.findMember(orgId, requesterDbUserId);
      if (!member) throw new NotFoundException(`Organization ${orgId} not found`);
    }
    return this.repo.findMembersByOrg(orgId);
  }

  findOrgsForUser(userId: string): Promise<OrganizationMember[]> {
    return this.repo.findOrgsByUser(userId);
  }

  async addMember(orgId: string, dto: AddMemberDto, requesterId: string): Promise<OrganizationMember> {
    await this.assertRole(orgId, requesterId, [OrgRole.OWNER, OrgRole.ADMIN]);

    const existing = await this.repo.findMember(orgId, dto.userId);
    if (existing) throw new ConflictException('User is already a member of this organization');

    return this.repo.addMember(orgId, dto.userId, dto.role ?? OrgRole.MEMBER);
  }

  async updateMemberRole(orgId: string, userId: string, role: OrgRole, requesterId: string): Promise<void> {
    await this.assertRole(orgId, requesterId, [OrgRole.OWNER, OrgRole.ADMIN]);
    const member = await this.repo.findMember(orgId, userId);
    if (!member) throw new NotFoundException('Member not found');
    await this.repo.updateMemberRole(orgId, userId, role);
  }

  async removeMember(orgId: string, userId: string, requesterId: string): Promise<void> {
    // Members can remove themselves; owners/admins can remove others
    if (requesterId !== userId) {
      await this.assertRole(orgId, requesterId, [OrgRole.OWNER, OrgRole.ADMIN]);
    }
    const member = await this.repo.findMember(orgId, userId);
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove the owner from the organization');
    }
    await this.repo.removeMember(orgId, userId);
  }

  async assertRole(orgId: string, userId: string, roles: OrgRole[]): Promise<void> {
    const member = await this.repo.findMember(orgId, userId);
    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException('Insufficient organization permissions');
    }
  }

  async isMember(orgId: string, userId: string): Promise<boolean> {
    const member = await this.repo.findMember(orgId, userId);
    return !!member;
  }
}
