import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { FirebaseAuthGuard, FirebaseModule, THROTTLE_DEFAULT, THROTTLE_STRICT } from './common';
import { AppController } from './app.controller';
import { HealthModule } from './app/health/health.module';
import { UsersModule } from './app/users/users.module';
import { OrganizationsModule } from './app/organizations/organizations.module';
import { DropsModule } from './app/drops/drops.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ...THROTTLE_DEFAULT },
      { name: 'strict',  ...THROTTLE_STRICT },
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
        extra: { pgbouncer: true },
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    FirebaseModule,
    HealthModule,
    UsersModule,
    OrganizationsModule,
    DropsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
  ],
})
export class AppModule {}
