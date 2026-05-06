import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeBetterAuthUsers1778050000000 implements MigrationInterface {
  name = 'MergeBetterAuthUsers1778050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the constraint linking users to the separate user table
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_better_auth_user"`);

    // 2. Drop the foreign keys on session and account that point to the separate user table
    await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_fkey"`);
    await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_fkey"`);

    // 3. Add new foreign keys pointing directly to the unified users table
    await queryRunner.query(`
      ALTER TABLE "session"
      ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "account"
      ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // 4. Drop the now-unused better-auth user table
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Recreate the better-auth user table
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

    // 2. Drop the foreign keys that point to the users table
    await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_fkey"`);
    await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_fkey"`);

    // 3. Re-add foreign keys pointing back to the separate user table
    await queryRunner.query(`
      ALTER TABLE "session"
      ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "account"
      ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);

    // 4. Re-add the constraint linking users to the separate user table
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_better_auth_user"
        FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE
    `);
  }
}
