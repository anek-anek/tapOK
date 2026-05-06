import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBetterAuthTables1778040000000 implements MigrationInterface {
  name = 'CreateBetterAuthTables1778040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"          TEXT        NOT NULL,
        "email"         TEXT        NOT NULL UNIQUE,
        "emailVerified" BOOLEAN     NOT NULL DEFAULT FALSE,
        "image"         TEXT,
        "role"          TEXT        NOT NULL DEFAULT 'participant',
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "expiresAt"   TIMESTAMPTZ NOT NULL,
        "token"       TEXT        NOT NULL UNIQUE,
        "ipAddress"   TEXT,
        "userAgent"   TEXT,
        "userId"      UUID        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        "id"                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "accountId"              TEXT        NOT NULL,
        "providerId"             TEXT        NOT NULL,
        "userId"                 UUID        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken"            TEXT,
        "refreshToken"           TEXT,
        "idToken"                TEXT,
        "accessTokenExpiresAt"   TIMESTAMPTZ,
        "refreshTokenExpiresAt"  TIMESTAMPTZ,
        "scope"                  TEXT,
        "password"               TEXT,
        "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "identifier"  TEXT        NOT NULL,
        "value"       TEXT        NOT NULL,
        "expiresAt"   TIMESTAMPTZ NOT NULL,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Link the app profile table to better-auth's identity table
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_better_auth_user"
        FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_better_auth_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
