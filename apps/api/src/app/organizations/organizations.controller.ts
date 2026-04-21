import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { FirebaseAuthGuard, OrgRole } from '../../common';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';

interface RequestWithUser extends Request {
  user: any;
}

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly orgsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveDbUserId(firebaseUid: string): Promise<string> {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('User record not found — call POST /users/sync first');
    return user.id;
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  @ApiResponse({ status: 200, type: [Organization] })
  findAll(): Promise<Organization[]> {
    return this.orgsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'List organizations the current user belongs to' })
  @ApiResponse({ status: 200, type: [OrganizationMember] })
  async findMyOrgs(@Req() req: RequestWithUser): Promise<OrganizationMember[]> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.findOrgsForUser(dbUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by id' })
  @ApiResponse({ status: 200, type: Organization })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Organization> {
    return this.orgsService.findOne(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of an organization' })
  @ApiResponse({ status: 200, type: [OrganizationMember] })
  findMembers(@Param('id', ParseUUIDPipe) id: string): Promise<OrganizationMember[]> {
    return this.orgsService.findMembers(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an organization (caller becomes owner)' })
  @ApiResponse({ status: 201, type: Organization })
  async create(
    @Body() dto: CreateOrganizationDto,
    @Req() req: RequestWithUser,
  ): Promise<Organization> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.create(dto, dbUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization (owner/admin only)' })
  @ApiResponse({ status: 200, type: Organization })
  @ApiResponse({ status: 403, description: 'Insufficient organization permissions.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: RequestWithUser,
  ): Promise<Organization> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.update(id, dto, dbUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an organization (owner only)' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'Insufficient organization permissions.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.remove(id, dbUserId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to an organization (owner/admin only)' })
  @ApiResponse({ status: 201, type: OrganizationMember })
  @ApiResponse({ status: 409, description: 'User is already a member.' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @Req() req: RequestWithUser,
  ): Promise<OrganizationMember> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.addMember(id, dto, dbUserId);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update a member role (owner/admin only)' })
  @ApiResponse({ status: 200 })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('role') role: OrgRole,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.updateMemberRole(id, userId, role, dbUserId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiResponse({ status: 204 })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const dbUserId = await this.resolveDbUserId(req.user.uid);
    return this.orgsService.removeMember(id, userId, dbUserId);
  }
}
