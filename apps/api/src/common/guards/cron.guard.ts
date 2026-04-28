import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class CronGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers['authorization'];
    const secret = this.configService.get<string>('CRON_SECRET');

    if (!secret) throw new UnauthorizedException('CRON_SECRET is not configured');
    if (!auth || auth !== `Bearer ${secret}`) throw new UnauthorizedException('Invalid cron secret');

    return true;
  }
}
