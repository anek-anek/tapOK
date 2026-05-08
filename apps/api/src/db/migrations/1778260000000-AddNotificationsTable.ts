import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsTable1778260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'join_requested',
        'join_approved',
        'join_rejected',
        'member_joined',
        'member_left',
        'member_removed',
        'invited_to_drop',
        'drop_starting_soon',
        'drop_started',
        'drop_completed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "metadata" jsonb,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_isRead"
        ON "notifications" ("userId", "isRead")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_createdAt"
        ON "notifications" ("userId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      ALTER TABLE "drops"
        ADD COLUMN IF NOT EXISTS "startingSoonNotifiedAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN IF EXISTS "startingSoonNotifiedAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
  }
}
