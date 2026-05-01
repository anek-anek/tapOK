import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverPhotoToDrop1777700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drops" ADD "coverPhoto" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "coverPhoto"`);
  }
}
