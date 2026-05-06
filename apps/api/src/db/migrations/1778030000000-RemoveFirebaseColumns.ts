import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFirebaseColumns1778030000000 implements MigrationInterface {
  name = 'RemoveFirebaseColumns1778030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_e621f267079194e5428e19af2f3"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "firebaseUid"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "googleId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "googleId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "firebaseUid" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_e621f267079194e5428e19af2f3" UNIQUE ("firebaseUid")`,
    );
  }
}
