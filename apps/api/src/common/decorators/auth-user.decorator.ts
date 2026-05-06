import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { BetterAuthUser } from '../better-auth/better-auth.service';

/** Injects the authenticated BetterAuth user from the request. */
export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): BetterAuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: BetterAuthUser }>();
    return request.user;
  },
);
