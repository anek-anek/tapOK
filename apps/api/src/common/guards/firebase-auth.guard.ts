import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import * as admin from 'firebase-admin';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = this.extractBearerToken(request);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException({
        message: 'Missing bearer token',
        code: 'INVALID_OR_EXPIRED_TOKEN',
      });
    }

    try {
      try {
        const decodedIdToken = await admin.auth().verifyIdToken(token);
        request.user = decodedIdToken;
      } catch {
        const decodedSession = await admin.auth().verifySessionCookie(token, true);
        request.user = decodedSession;
      }
    } catch (err) {
      this.logger.error(`Token verification failed: ${err}`);
      if (isPublic) return true;
      throw new UnauthorizedException({
        message: 'Invalid or expired token',
        code: 'INVALID_OR_EXPIRED_TOKEN',
      });
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
