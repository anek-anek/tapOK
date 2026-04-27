import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard, Public } from '../../common';
import { DropsService } from './drops.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { JoinDropResponseDto } from './dto/join-drop-response.dto';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';

interface RequestWithUser extends Request {
  user: DecodedIdToken;
}

@ApiTags('drops')
@ApiBearerAuth()
@Controller('drops')
export class DropsController {
  constructor(private readonly dropsService: DropsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new drop' })
  @ApiResponse({ status: 201, type: Drop })
  create(
    @Body() dto: CreateDropDto,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    return this.dropsService.create(dto, request.user.uid);
  }

  @Get('mine')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: "Get the authenticated user's drops" })
  @ApiResponse({ status: 200, type: [Drop] })
  getMyDrops(@Req() request: RequestWithUser): Promise<Drop[]> {
    return this.dropsService.findMyDrops(request.user.uid);
  }

  @Get('activity/mine')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: "Get the authenticated user's activity logs across all drops" })
  @ApiResponse({ status: 200, type: [DropActivityLog] })
  getMyActivity(@Req() request: RequestWithUser): Promise<DropActivityLog[]> {
    return this.dropsService.findMyActivityLogs(request.user.uid);
  }

  @Get('join/:joinCode')
  @Public()
  @ApiOperation({ summary: 'Look up a drop by join code (public)' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  findByJoinCode(@Param('joinCode') joinCode: string): Promise<Drop> {
    return this.dropsService.findByJoinCode(joinCode);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get a drop by id' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Drop> {
    return this.dropsService.findOne(id);
  }

  @Get(':id/crew/me')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the current user's crew status for a drop" })
  @ApiResponse({ status: 200, type: JoinDropResponseDto })
  @ApiResponse({ status: 404, description: 'Not a crew member.' })
  getMyCrewStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<JoinDropResponseDto> {
    return this.dropsService.getMyCrewStatus(id, request.user.uid);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Edit a drop (organiser only, active/ongoing status)' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 400, description: 'Drop is completed and cannot be edited.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can edit this drop.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDropDto,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    return this.dropsService.update(id, dto, request.user.uid);
  }

  @Post(':id/join')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join a drop' })
  @ApiResponse({ status: 201, type: JoinDropResponseDto })
  @ApiResponse({ status: 400, description: 'Drop is completed.' })
  @ApiResponse({ status: 403, description: 'Organiser cannot join their own drop.' })
  @ApiResponse({ status: 404, description: 'Drop or user not found.' })
  @ApiResponse({ status: 409, description: 'Already joined this drop.' })
  joinDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<JoinDropResponseDto> {
    return this.dropsService.joinDrop(id, request.user.uid);
  }

  @Delete(':id/crew/me')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a drop' })
  @ApiResponse({ status: 204, description: 'Successfully left the drop.' })
  @ApiResponse({ status: 403, description: 'Organiser cannot leave their own drop.' })
  @ApiResponse({ status: 404, description: 'Drop or crew membership not found.' })
  leaveDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.leaveDrop(id, request.user.uid);
  }
}
