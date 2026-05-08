import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeedbackTables1778252446000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "feedback_type_enum" AS ENUM ('bug', 'feature');
      CREATE TYPE "feedback_status_enum" AS ENUM ('pending', 'investigating', 'resolved', 'rejected');

      CREATE TABLE "feedback" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "type" "feedback_type_enum" NOT NULL DEFAULT 'feature',
        "status" "feedback_status_enum" NOT NULL DEFAULT 'pending',
        "creatorId" uuid NOT NULL,
        "score" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_creator" FOREIGN KEY ("creatorId")
          REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE TABLE "feedback_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedbackId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "value" integer NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_votes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_votes_feedback" FOREIGN KEY ("feedbackId")
          REFERENCES "feedback"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_votes_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_feedback_votes_user_feedback" UNIQUE ("feedbackId", "userId")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "feedback_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "feedback_status_enum"`);
  }
}
