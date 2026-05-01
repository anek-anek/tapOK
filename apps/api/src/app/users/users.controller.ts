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
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard, RolesGuard, Roles, UserRole, AuthUser, THROTTLE_STRICT } from '../../common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserProfileDto } from './dto/user-profile.dto';
import { FrequentCrewDto } from './dto/frequent-crew.dto';

interface RequestWithUser extends Request {
  user: DecodedIdToken;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
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
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user — 404 if not in DB' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  me(@Req() request: RequestWithUser): Promise<UserProfileDto> {
    return this.usersService.findMe(request.user.uid);
  }

  @Get('me/frequent-crew')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get the frequently seen crew for the authenticated user' })
  @ApiResponse({ status: 200, type: [FrequentCrewDto] })
  getFrequentCrew(@Req() request: RequestWithUser): Promise<FrequentCrewDto[]> {
    return this.usersService.getFrequentCrew(request.user.uid);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: DecodedIdToken,
  ): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (authUser.role !== UserRole.ADMIN && user.firebaseUid !== authUser.uid) {
      throw new ForbiddenException('Access denied');
    }
    return user;
  }

  @Post('sync')
  @Throttle({ strict: THROTTLE_STRICT })
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Upsert the authenticated Firebase user into the DB' })
  @ApiResponse({ status: 201, type: User })
  sync(@Req() request: RequestWithUser, @Body() dto: SyncUserDto): Promise<User> {
    return this.usersService.syncFromFirebase(request.user, dto);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: User })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: RequestWithUser,
  ): Promise<User> {
    return this.usersService.update(id, dto, request.user.uid);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.usersService.remove(id, request.user.uid);
  }
}
