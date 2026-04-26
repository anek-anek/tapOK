import {
  Body,
  Controller,
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
import { FirebaseAuthGuard, Public } from '../../common';
import { DropsService } from './drops.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { Drop } from './entities/drop.entity';

interface RequestWithUser extends Request {
  user: any;
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
}
