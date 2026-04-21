import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrgRole } from '../../common';

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  findAll(): Promise<Organization[]> {
    return this.orgRepo.find();
  }

  findById(id: string): Promise<Organization | null> {
    return this.orgRepo.findOneBy({ id });
  }

  findByIdWithMembers(id: string): Promise<Organization | null> {
    return this.orgRepo.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
  }

  create(dto: CreateOrganizationDto): Promise<Organization> {
    const org = this.orgRepo.create(dto);
    return this.orgRepo.save(org);
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization | null> {
    await this.orgRepo.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.orgRepo.delete(id);
  }

  findMember(organizationId: string, userId: string): Promise<OrganizationMember | null> {
    return this.memberRepo.findOneBy({ organizationId, userId });
  }

  findMembersByOrg(organizationId: string): Promise<OrganizationMember[]> {
    return this.memberRepo.find({
      where: { organizationId },
      relations: ['user'],
    });
  }

  findOrgsByUser(userId: string): Promise<OrganizationMember[]> {
    return this.memberRepo.find({
      where: { userId },
      relations: ['organization'],
    });
  }

  addMember(organizationId: string, userId: string, role: OrgRole): Promise<OrganizationMember> {
    const member = this.memberRepo.create({ organizationId, userId, role });
    return this.memberRepo.save(member);
  }

  async updateMemberRole(organizationId: string, userId: string, role: OrgRole): Promise<void> {
    await this.memberRepo.update({ organizationId, userId }, { role });
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await this.memberRepo.delete({ organizationId, userId });
  }
}
