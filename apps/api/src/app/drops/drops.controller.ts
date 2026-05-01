import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CronGuard, DropCategory, FirebaseAuthGuard, Public } from '../../common';
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
import { DropPhoto } from './entities/drop-photo.entity';

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

  @Get('discover')
  @Public()
  @ApiOperation({ summary: 'Get drops for the discover page' })
  @ApiResponse({ status: 200, description: 'Discovery data' })
  discover(
    @Req() request: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: DropCategory,
  ): Promise<any> {
    return this.dropsService.discover(
      request.user?.uid,
      page ? Number(page) : 1,
      limit ? Number(limit) : 6,
      category,
    );
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

  @Post(':id/cover-photo')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload or replace the drop cover photo (organiser only, max 5 MB, JPG/PNG)' })
  @ApiResponse({ status: 201, type: Drop })
  @ApiResponse({ status: 400, description: 'No file provided or unsupported format.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can update the cover photo.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  async uploadCoverPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    if (!file) throw new BadRequestException('No file provided');
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPG and PNG files are supported');
    }
    return this.dropsService.uploadCoverPhoto(id, request.user.uid, file.buffer, file.mimetype);
  }

  @Delete(':id/cover-photo')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the drop cover photo (organiser only)' })
  @ApiResponse({ status: 204, description: 'Cover photo deleted.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can delete the cover photo.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  deleteCoverPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.deleteCoverPhoto(id, request.user.uid);
  }

  @Post(':id/photos')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Upload a photo to the drop roll (crew members only)' })
  @ApiResponse({ status: 201, type: DropPhoto })
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('base64') base64: string,
    @Req() request: RequestWithUser,
  ): Promise<DropPhoto> {
    if (!base64) throw new BadRequestException('Base64 content is required');
    return this.dropsService.uploadPhoto(id, request.user.uid, base64);
  }

  @Get(':id/photos')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get all photos for a drop' })
  @ApiResponse({ status: 200, type: [DropPhoto] })
  getPhotos(@Param('id', ParseUUIDPipe) id: string): Promise<DropPhoto[]> {
    return this.dropsService.getPhotos(id);
  }

  @Patch(':id/photos/:photoId/feature')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Feature a photo from the roll (organiser only)' })
  @ApiResponse({ status: 200, type: DropPhoto })
  featurePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: RequestWithUser,
  ): Promise<DropPhoto> {
    return this.dropsService.featurePhoto(id, photoId, request.user.uid);
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a photo from the roll (owner or organiser only)' })
  @ApiResponse({ status: 204, description: 'Photo deleted.' })
  deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.deletePhoto(id, photoId, request.user.uid);
  }

  @Post(':id/spark')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Spark a drop (hype)' })
  @ApiResponse({ status: 204, description: 'Dropped sparked.' })
  sparkDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.sparkDrop(id, request.user.uid);
  }

  @Delete(':id/spark')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unspark a drop' })
  @ApiResponse({ status: 204, description: 'Dropped unsparked.' })
  unsparkDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.unsparkDrop(id, request.user.uid);
  }
}
