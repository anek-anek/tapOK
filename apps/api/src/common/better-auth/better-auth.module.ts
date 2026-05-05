import { Global, Module } from '@nestjs/common';
import { BetterAuthService } from './better-auth.service';

@Global()
@Module({
  providers: [BetterAuthService],
  exports: [BetterAuthService],
})
export class BetterAuthModule {}
