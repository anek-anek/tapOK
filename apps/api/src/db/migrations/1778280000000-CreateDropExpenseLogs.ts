import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDropExpenseLogs1778280000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "drop_expense_logs_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TABLE "drop_expense_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dropId" uuid NOT NULL,
        "submittedById" uuid NOT NULL,
        "description" character varying NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "status" "drop_expense_logs_status_enum" NOT NULL DEFAULT 'pending',
        "reviewedById" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drop_expense_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_drop_expense_logs_drop" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_drop_expense_logs_submitted_by" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_drop_expense_logs_reviewed_by" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_drop_expense_logs_drop_id" ON "drop_expense_logs" ("dropId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_drop_expense_logs_drop_id"`);
    await queryRunner.query(`DROP TABLE "drop_expense_logs"`);
    await queryRunner.query(`DROP TYPE "drop_expense_logs_status_enum"`);
  }
}
