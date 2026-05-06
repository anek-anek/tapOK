import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { ScheduleModule } from '@nestjs/schedule';

import { THROTTLE_DEFAULT, THROTTLE_STRICT } from './common';
import { BetterAuthGuard } from './common/guards/better-auth.guard';
import { BetterAuthModule } from './common/better-auth/better-auth.module';
import { AppController } from './app.controller';
import { HealthModule } from './app/health/health.module';
import { UsersModule } from './app/users/users.module';
import { DropsModule } from './app/drops/drops.module';
import { EmailModule } from './common/email/email.module';
import { AuthEmailModule } from './app/auth-email/auth-email.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ...THROTTLE_DEFAULT },
      { name: 'strict', ...THROTTLE_STRICT },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'postgres'),
        ssl: { rejectUnauthorized: false },
        extra: { pgbouncer: true, timezone: 'UTC' },
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    BetterAuthModule,
    EmailModule,
    AuthEmailModule,
    HealthModule,
    UsersModule,
    DropsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: BetterAuthGuard },
  ],
})
export class AppModule {}
