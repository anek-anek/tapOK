import {
  Body,
  Controller,
  Delete,
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
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CronGuard, FirebaseAuthGuard, Public } from '../../common';
import { DropsService } from './drops.service';
import { DropsCronService } from './drops-cron.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { JoinDropResponseDto } from './dto/join-drop-response.dto';
import { CrewMemberDto } from './dto/crew-member.dto';
import { ActivityLogsPageDto } from './dto/activity-logs-page.dto';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';

interface RequestWithUser extends Request {
  user: DecodedIdToken;
}

@ApiTags('drops')
@ApiBearerAuth()
@Controller('drops')
export class DropsController {
  constructor(
    private readonly dropsService: DropsService,
    private readonly dropsCronService: DropsCronService,
  ) {}

  @Post('cron/transition')
  @Public()
  @UseGuards(CronGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vercel Cron: transition drop statuses (requires CRON_SECRET)' })
  @ApiResponse({ status: 200, description: 'Transitions applied.' })
  runCronTransition(): Promise<{ toOngoing: number; toCompleted: number }> {
    return this.dropsCronService.transitionDropStatuses();
  }

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
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Look up a drop by join code' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  findByJoinCode(
    @Param('joinCode') joinCode: string,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    return this.dropsService.findByJoinCode(joinCode, request.user.uid);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get a drop by id' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    return this.dropsService.findOne(id, request.user.uid);
  }

  @Get(':id/activity')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get paginated activity logs for a drop' })
  @ApiResponse({ status: 200, type: ActivityLogsPageDto })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  getActivityLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 6,
  ): Promise<ActivityLogsPageDto> {
    return this.dropsService.findDropActivityLogs(id, page, limit);
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

  @Patch(':id/crew/me/presence')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark yourself in or out for a drop (active crew members only)' })
  @ApiResponse({ status: 204, description: 'Presence updated.' })
  @ApiResponse({ status: 400, description: 'Not an active crew member.' })
  @ApiResponse({ status: 404, description: 'Not a crew member of this drop.' })
  updatePresence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePresenceDto,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.updatePresence(id, request.user.uid, dto.isPresent);
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

  @Post(':id/invite/:userId')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Invite a user to a drop (organiser only)' })
  @ApiResponse({ status: 201, description: 'User invited successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  inviteToDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.inviteToDrop(id, userId, request.user.uid);
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

  @Get(':id/crew')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get all crew members for a drop (organiser only)' })
  @ApiResponse({ status: 200, type: [CrewMemberDto] })
  @ApiResponse({ status: 403, description: 'Only the organiser can view the crew list.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  getDropCrew(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<CrewMemberDto[]> {
    return this.dropsService.getDropCrew(id, request.user.uid) as Promise<CrewMemberDto[]>;
  }

  @Patch(':id/crew/:userId/approve')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Approve a pending join request (organiser only)' })
  @ApiResponse({ status: 204, description: 'Join request approved.' })
  @ApiResponse({ status: 400, description: 'User is not pending approval.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can approve join requests.' })
  @ApiResponse({ status: 404, description: 'Drop or crew member not found.' })
  approvePendingMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.approvePendingMember(id, userId, request.user.uid);
  }

  @Patch(':id/crew/:userId/reject')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject a pending join request (organiser only)' })
  @ApiResponse({ status: 204, description: 'Join request rejected.' })
  @ApiResponse({ status: 400, description: 'User is not pending approval.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can reject join requests.' })
  @ApiResponse({ status: 404, description: 'Drop or crew member not found.' })
  rejectPendingMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.rejectPendingMember(id, userId, request.user.uid);
  }

  @Patch(':id/crew/:userId/remove')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an active crew member (organiser only)' })
  @ApiResponse({ status: 204, description: 'Crew member removed.' })
  @ApiResponse({ status: 400, description: 'User is not an active crew member.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can remove crew members.' })
  @ApiResponse({ status: 404, description: 'Drop or crew member not found.' })
  removeCrewMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.removeCrewMember(id, userId, request.user.uid);
  }
}
