import { Injectable } from '@nestjs/common';
import { auth } from '../../lib/auth';

export type BetterAuthSession = typeof auth.$Infer.Session;
export type BetterAuthUser = BetterAuthSession['user'];

@Injectable()
export class BetterAuthService {
  readonly auth = auth;

  /**
   * Validates an incoming request and returns the active session, or null.
   * Accepts a standard Fetch API `Request` built from the Express request.
   */
  async getSession(request: Request): Promise<BetterAuthSession | null> {
    return this.auth.api.getSession({ headers: request.headers });
  }
}
