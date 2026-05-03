import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetSentAt1777950000000 implements MigrationInterface {
  name = 'AddPasswordResetSentAt1777950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordResetSentAt" timestamptz`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordResetSentAt"`,
    );
  }
}
