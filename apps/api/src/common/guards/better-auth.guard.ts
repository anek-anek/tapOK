import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { BetterAuthService } from '../better-auth/better-auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  private readonly logger = new Logger(BetterAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly betterAuth: BetterAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();

    // Build a Fetch-compatible Request so BetterAuth can read its own cookie/header.
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value);
      else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    }
    const fetchRequest = new Request(url, { headers });

    try {
      const session = await this.betterAuth.getSession(fetchRequest);

      if (!session) {
        if (isPublic) return true;
        throw new UnauthorizedException({
          message: 'Missing or invalid session',
          code: 'INVALID_OR_EXPIRED_TOKEN',
        });
      }

      req.user = session.user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`Session validation error: ${err}`);
      if (isPublic) return true;
      throw new UnauthorizedException({
        message: 'Invalid or expired session',
        code: 'INVALID_OR_EXPIRED_TOKEN',
      });
    }
  }
}
