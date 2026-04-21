import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'API root' })
  root() {
    return { message: 'Welcome to Formesean Stack API', status: 'ok' };
  }
}
