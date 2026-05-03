import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationToken1777940000000 implements MigrationInterface {
  name = 'AddEmailVerificationToken1777940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationToken" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationTokenExpiresAt" TIMESTAMPTZ`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationTokenExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationToken"`);
  }
}
