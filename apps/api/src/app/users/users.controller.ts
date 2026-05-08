import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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

import { Throttle } from '@nestjs/throttler';
import {
  RolesGuard,
  Roles,
  UserRole,
  AuthUser,
  Public,
  THROTTLE_STRICT,
} from '../../common';
import { BetterAuthGuard } from '../../common/guards/better-auth.guard';
import type { BetterAuthUser } from '../../common/better-auth/better-auth.service';
import { CheckAuthProviderDto } from './dto/check-auth-provider.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserProfileDto } from './dto/user-profile.dto';
import { FrequentCrewDto } from './dto/frequent-crew.dto';
import { CreateAvatarUploadDto } from './dto/create-avatar-upload.dto';
import { AvatarUploadSessionDto } from './dto/avatar-upload-session.dto';

interface RequestWithUser extends Request {
  user: BetterAuthUser;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private parseIncludeParam(include?: string): Set<string> {
    if (!include) return new Set();
    return new Set(
      include
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  @Get()
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [User] })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 100,
  ): Promise<User[]> {
    return this.usersService.findAll(page, limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user — 404 if not in DB' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  me(
    @Req() request: RequestWithUser,
    @Query('include') include?: string,
  ): Promise<UserProfileDto> {
    const includes = this.parseIncludeParam(include);
    return this.usersService.findMe(request.user, {
      includeStats: includes.has('stats'),
      includeAvatar: includes.has('avatar'),
    });
  }

  @Get('me/frequent-crew')
  @ApiOperation({ summary: 'Get the frequently seen crew for the authenticated user' })
  @ApiResponse({ status: 200, type: [FrequentCrewDto] })
  getFrequentCrew(
    @Req() request: RequestWithUser,
    @Query('include') include?: string,
  ): Promise<FrequentCrewDto[]> {
    const includes = this.parseIncludeParam(include);
    return this.usersService.getFrequentCrew(request.user.id, {
      includeAvatar: includes.has('avatar'),
    });
  }

  @Post('auth-provider-check')
  @Public()
  @Throttle({ strict: THROTTLE_STRICT })
  @ApiOperation({ summary: 'Check whether an email already belongs to an existing auth provider' })
  @ApiResponse({
    status: 201,
    schema: { example: { exists: true, authProvider: 'password' } },
  })
  async checkAuthProvider(@Body() dto: CheckAuthProviderDto): Promise<{
    exists: boolean;
    authProvider: 'password' | 'google' | null;
  }> {
    const authProvider = await this.usersService.findExistingAuthProviderByEmail(dto.email);
    return { exists: authProvider !== null, authProvider };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: BetterAuthUser,
  ): Promise<User> {
    const user = await this.usersService.findOne(id);
    if ((authUser.role as string) !== UserRole.ADMIN && user.id !== authUser.id) {
      throw new ForbiddenException('Access denied');
    }
    return user;
  }

  @Post('sync')
  @Throttle({ strict: THROTTLE_STRICT })
  @ApiOperation({ summary: 'Upsert the authenticated user profile into the DB' })
  @ApiResponse({ status: 201, type: User })
  sync(@Req() request: RequestWithUser, @Body() dto: SyncUserDto): Promise<User> {
    return this.usersService.syncUser(request.user, dto);
  }

  @Post()
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: User })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: RequestWithUser,
  ): Promise<User> {
    return this.usersService.update(id, dto, request.user.id);
  }

  @Post(':id/avatar/upload-url')
  @ApiOperation({ summary: 'Create signed upload session for profile avatar' })
  @ApiResponse({ status: 201, type: AvatarUploadSessionDto })
  createAvatarUploadSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAvatarUploadDto,
    @Req() request: RequestWithUser,
  ): Promise<AvatarUploadSessionDto> {
    return this.usersService.createAvatarUploadSession(id, request.user.id, dto);
  }

  @Post(':id/avatar/complete')
  @ApiOperation({ summary: 'Finalize signed avatar upload and replace previous avatar' })
  @ApiResponse({ status: 200, type: User })
  completeAvatarUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<User> {
    return this.usersService.completeAvatarUpload(id, request.user.id);
  }

  @Delete(':id')
  @UseGuards(BetterAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() requester: BetterAuthUser,
  ): Promise<void> {
    return this.usersService.remove(id, requester);
  }
}
