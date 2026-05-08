import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, VoteFeedbackDto } from './dto/feedback.dto';
import { BetterAuthGuard } from 'src/common/guards/better-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { FeedbackType, FeedbackStatus } from './entities/feedback.entity';
import { BetterAuthUser } from 'src/common/better-auth/better-auth.service';
import { Public } from 'src/common/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: BetterAuthUser;
}

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all feedback' })
  findAll(
    @Req() request: RequestWithUser,
    @Query('type') type?: FeedbackType,
    @Query('sortBy') sortBy?: 'createdAt' | 'score',
  ) {
    return this.feedbackService.findAll(type, request.user?.id, sortBy);
  }

  @Post()
  @UseGuards(BetterAuthGuard)
  @ApiOperation({ summary: 'Submit new feedback' })
  create(@Body() dto: CreateFeedbackDto, @Req() request: RequestWithUser) {
    return this.feedbackService.create(dto, request.user.id);
  }

  @Post(':id/vote')
  @UseGuards(BetterAuthGuard)
  @ApiOperation({ summary: 'Vote on feedback (BOOST/JAM)' })
  vote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoteFeedbackDto,
    @Req() request: RequestWithUser,
  ) {
    return this.feedbackService.vote(id, request.user.id, dto.value);
  }

  @Patch(':id/status')
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update feedback status (Admin only)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: FeedbackStatus,
  ) {
    return this.feedbackService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(BetterAuthGuard)
  @ApiOperation({ summary: 'Delete feedback' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() request: RequestWithUser) {
    const isAdmin = request.user.role === UserRole.ADMIN;
    return this.feedbackService.delete(id, request.user.id, isAdmin);
  }
}
