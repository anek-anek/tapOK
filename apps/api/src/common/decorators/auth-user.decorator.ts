import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';

/** Injects the decoded Firebase token from the request. */
export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DecodedIdToken => {
    const request = ctx.switchToHttp().getRequest<{ user: DecodedIdToken }>();
    return request.user;
  },
);
