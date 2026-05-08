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
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthUser, CronGuard, DropCategory, DropCrewMemberRole, Public, Roles, RolesGuard, UserRole } from '../../common';
import type { BetterAuthUser } from '../../common/better-auth/better-auth.service';
import { DropsService } from './drops.service';
import { DropsCronService } from './drops-cron.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { JoinDropResponseDto } from './dto/join-drop-response.dto';
import { CrewMemberDto } from './dto/crew-member.dto';
import { DropPhotoPublicDto } from './dto/drop-photo-public.dto';
import { CreatePhotoUploadDto } from './dto/create-photo-upload.dto';
import { PhotoUploadSessionDto } from './dto/photo-upload-session.dto';
import { DiscoverDropsResponseDto } from './dto/discover-drops-response.dto';
import { ActivityLogsPageDto } from './dto/activity-logs-page.dto';
import { ExistingNeededItemDto } from './dto/needed-item.dto';
import { Drop } from './entities/drop.entity';
import { DropActivityLog } from './entities/drop-activity-log.entity';
import { DropPhoto } from './entities/drop-photo.entity';
import { DropItem } from './entities/drop-item.entity';
import { BetterAuthGuard } from 'src/common/guards/better-auth.guard';

interface RequestWithUser extends Request {
  user: BetterAuthUser;
}

@ApiTags('drops')
@ApiBearerAuth()
@ApiExtraModels(ExistingNeededItemDto)
@Controller('drops')
export class DropsController {
  constructor(
    private readonly dropsService: DropsService,
    private readonly dropsCronService: DropsCronService,
  ) {}

  @Get()
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all drops (admin only)' })
  @ApiResponse({ status: 200, type: [Drop] })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 100,
  ): Promise<Drop[]> {
    return this.dropsService.findAll(page, limit);
  }

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
  @ApiOperation({ summary: 'Get drops for the discover page (public-safe fields only)' })
  @ApiResponse({ status: 200, description: 'Discovery data', type: DiscoverDropsResponseDto })
  discover(
    @Req() request: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: DropCategory,
  ): Promise<DiscoverDropsResponseDto> {
    return this.dropsService.discover(
      request.user?.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 6,
      category,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new drop' })
  @ApiResponse({ status: 201, type: Drop })
  create(
    @Body() dto: CreateDropDto,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    return this.dropsService.create(dto, request.user.id);
  }

  @Get('mine')
  @ApiOperation({ summary: "Get the authenticated user's drops" })
  @ApiResponse({ status: 200, type: [Drop] })
  getMyDrops(@Req() request: RequestWithUser): Promise<Drop[]> {
    return this.dropsService.findMyDrops(request.user.id);
  }

  @Get('activity/mine')
  @ApiOperation({ summary: "Get the authenticated user's activity logs across all drops" })
  @ApiResponse({ status: 200, type: [DropActivityLog] })
  getMyActivity(
    @Req() request: RequestWithUser,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ): Promise<DropActivityLog[]> {
    return this.dropsService.findMyActivityLogs(request.user.id, page, limit);
  }

  @Get('join/:joinCode')
  @ApiOperation({ summary: 'Look up a drop by join code' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  findByJoinCode(
    @Param('joinCode') joinCode: string,
    @Req() request: RequestWithUser,
  ): Promise<Drop> {
    return this.dropsService.findByJoinCode(joinCode, request.user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a drop by id (public access for public drops)' })
  @ApiResponse({ status: 200, type: Drop })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: any,
  ): Promise<Drop> {
    return this.dropsService.findOne(id, request.user?.id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get paginated activity logs for a drop' })
  @ApiResponse({ status: 200, type: ActivityLogsPageDto })
  @ApiResponse({ status: 404, description: 'Drop not found or no access.' })
  getActivityLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
    @Req() request: RequestWithUser,
  ): Promise<ActivityLogsPageDto> {
    return this.dropsService.findDropActivityLogs(id, request.user.id, page, limit);
  }

  @Get(':id/crew/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the current user's crew status for a drop" })
  @ApiResponse({ status: 200, type: JoinDropResponseDto })
  @ApiResponse({ status: 404, description: 'Not a crew member.' })
  getMyCrewStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<JoinDropResponseDto> {
    return this.dropsService.getMyCrewStatus(id, request.user.id);
  }

  @Patch(':id/crew/me/presence')
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
    return this.dropsService.updatePresence(id, request.user.id, dto.isPresent);
  }

  @Patch(':id')
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
    return this.dropsService.update(id, dto, request.user.id);
  }

  @Delete(':id')
  @UseGuards(BetterAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a drop (organiser or admin only)' })
  @ApiResponse({ status: 204, description: 'Drop deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Only the organiser or an admin can delete this drop.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() requester: BetterAuthUser,
  ): Promise<void> {
    return this.dropsService.delete(id, requester);
  }

  @Post(':id/invite/:userId')
  @ApiOperation({ summary: 'Invite a user to a drop (organiser only)' })
  @ApiResponse({ status: 201, description: 'User invited successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  inviteToDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.inviteToDrop(id, userId, request.user.id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join a drop' })
  @ApiResponse({ status: 201, type: JoinDropResponseDto })
  @ApiResponse({ status: 400, description: 'Drop is completed.' })
  @ApiResponse({
    status: 403,
    description: 'Organiser cannot join their own drop, age requirement not met, or birthday missing for an age-restricted drop.',
  })
  @ApiResponse({ status: 404, description: 'Drop or user not found.' })
  @ApiResponse({ status: 409, description: 'Already joined this drop.' })
  joinDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<JoinDropResponseDto> {
    return this.dropsService.joinDrop(id, request.user.id);
  }

  @Delete(':id/crew/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a drop' })
  @ApiResponse({ status: 204, description: 'Successfully left the drop.' })
  @ApiResponse({ status: 403, description: 'Organiser cannot leave their own drop.' })
  @ApiResponse({ status: 404, description: 'Drop or crew membership not found.' })
  leaveDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.leaveDrop(id, request.user.id);
  }

  @Get(':id/crew')
  @ApiOperation({ summary: 'Get all crew members for a drop (organiser only)' })
  @ApiResponse({ status: 200, type: [CrewMemberDto] })
  @ApiResponse({ status: 403, description: 'Only the organiser can view the crew list.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  getDropCrew(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<CrewMemberDto[]> {
    return this.dropsService.getDropCrew(id, request.user.id) as Promise<CrewMemberDto[]>;
  }

  @Patch(':id/crew/:userId/approve')
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
    return this.dropsService.approvePendingMember(id, userId, request.user.id);
  }

  @Patch(':id/crew/:userId/reject')
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
    return this.dropsService.rejectPendingMember(id, userId, request.user.id);
  }

  @Patch(':id/crew/:userId/remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an active crew member (organiser or co-chief only)' })
  @ApiResponse({ status: 204, description: 'Crew member removed.' })
  @ApiResponse({ status: 400, description: 'User is not an active crew member.' })
  @ApiResponse({ status: 403, description: 'Only the organiser or co-chiefs can remove crew members.' })
  @ApiResponse({ status: 404, description: 'Drop or crew member not found.' })
  removeCrewMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.removeCrewMember(id, userId, request.user.id);
  }

  @Patch(':id/crew/:userId/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a crew member role (organiser only)' })
  @ApiResponse({ status: 204, description: 'Role updated successfully.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can change member roles.' })
  @ApiResponse({ status: 404, description: 'Drop or crew member not found.' })
  updateCrewRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('role') role: DropCrewMemberRole,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    if (!role) throw new BadRequestException('Role is required');
    return this.dropsService.updateCrewRole(id, userId, request.user.id, role);
  }

  @Post(':id/cover-photo')
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
    return this.dropsService.uploadCoverPhoto(id, request.user.id, file.buffer, file.mimetype);
  }

  @Delete(':id/cover-photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the drop cover photo (organiser only)' })
  @ApiResponse({ status: 204, description: 'Cover photo deleted.' })
  @ApiResponse({ status: 403, description: 'Only the organiser can delete the cover photo.' })
  @ApiResponse({ status: 404, description: 'Drop not found.' })
  deleteCoverPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.deleteCoverPhoto(id, request.user.id);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Upload a photo to the drop roll (crew members only)' })
  @ApiResponse({ status: 201, type: DropPhoto })
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('base64') base64: string,
    @Req() request: RequestWithUser,
  ): Promise<DropPhoto> {
    if (!base64) throw new BadRequestException('Base64 content is required');
    return this.dropsService.uploadPhoto(id, request.user.id, base64);
  }

  @Post(':id/photos/upload-url')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a signed upload session for a drop roll photo' })
  @ApiResponse({ status: 201, type: PhotoUploadSessionDto })
  createPhotoUploadSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePhotoUploadDto,
    @Req() request: RequestWithUser,
  ): Promise<PhotoUploadSessionDto> {
    return this.dropsService.createPhotoUploadSession(id, request.user.id, dto);
  }

  @Post(':id/photos/:photoId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize a signed upload and return the photo payload' })
  @ApiResponse({ status: 200, type: DropPhotoPublicDto })
  completePhotoUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: RequestWithUser,
  ): Promise<DropPhotoPublicDto> {
    return this.dropsService.completePhotoUpload(id, photoId, request.user.id);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'Get all photos for a drop (paginated)' })
  @ApiResponse({ status: 200, type: [DropPhotoPublicDto] })
  async getPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.dropsService.getPhotos(id, request.user.id, page, limit);
  }

  @Get(':id/photos/:photoId')
  @ApiOperation({ summary: 'Get a single photo detail (includes base64 if available)' })
  @ApiResponse({ status: 200, type: DropPhotoPublicDto })
  async getPhotoDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: RequestWithUser,
  ) {
    return this.dropsService.getPhotoDetail(id, photoId, request.user.id);
  }

  @Patch(':id/photos/:photoId/feature')
  @ApiOperation({ summary: 'Feature a photo from the roll (organiser only)' })
  @ApiResponse({ status: 200, type: DropPhoto })
  featurePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: RequestWithUser,
  ): Promise<DropPhoto> {
    return this.dropsService.featurePhoto(id, photoId, request.user.id);
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a photo from the roll (owner or organiser only)' })
  @ApiResponse({ status: 204, description: 'Photo deleted.' })
  deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.deletePhoto(id, photoId, request.user.id);
  }

  @Post(':id/spark')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Spark a drop (hype)' })
  @ApiResponse({ status: 204, description: 'Dropped sparked.' })
  sparkDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.sparkDrop(id, request.user.id);
  }

  @Delete(':id/spark')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unspark a drop' })
  @ApiResponse({ status: 204, description: 'Dropped unsparked.' })
  unsparkDrop(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.unsparkDrop(id, request.user.id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a needed item to the drop (chief only)' })
  @ApiResponse({ status: 201, type: DropItem })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string,
    @Req() request: RequestWithUser,
  ): Promise<DropItem> {
    if (!name) throw new BadRequestException('Item name is required');
    return this.dropsService.addItem(id, name, request.user.id);
  }

  @Patch(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename a needed item (chief only)' })
  @ApiResponse({ status: 200, description: 'Item renamed successfully.' })
  renameItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('name') name: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    if (!name) throw new BadRequestException('Item name is required');
    return this.dropsService.renameItem(id, itemId, name, request.user.id);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a needed item from the drop (chief only)' })
  @ApiResponse({ status: 204, description: 'Item removed successfully.' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.removeItem(id, itemId, request.user.id);
  }

  @Post(':id/items/:itemId/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a needed item to a crew member (organiser only)' })
  @ApiResponse({ status: 200, description: 'Item assigned successfully.' })
  assignItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('assignedUserId', ParseUUIDPipe) assignedUserId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.assignItem(id, itemId, assignedUserId, request.user.id);
  }

  @Post(':id/items/:itemId/unassign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign a needed item (organiser or assigned crew member)' })
  @ApiResponse({ status: 200, description: 'Item unassigned successfully.' })
  unassignItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.unassignItem(id, itemId, request.user.id);
  }

  @Post(':id/items/random-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Randomly assign unassigned items to active crew members (organiser only)' })
  @ApiResponse({ status: 200, description: 'Items assigned randomly.' })
  randomAssignItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.randomAssignItems(id, request.user.id);
  }

  @Post(':id/items/:itemId/pick')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Self-pick a needed item (active crew members only)' })
  @ApiResponse({ status: 200, description: 'Item picked successfully.' })
  pickItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.pickItem(id, itemId, request.user.id);
  }

  @Patch(':id/items/:itemId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm gear arrival (chief only)' })
  @ApiResponse({ status: 200, description: 'Gear confirmed successfully.' })
  confirmItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.dropsService.confirmItem(id, itemId, request.user.id);
  }
}
