import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMinimumAgeToDrops1777921000000 implements MigrationInterface {
  name = 'AddMinimumAgeToDrops1777921000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drops" ADD "minimumAge" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "minimumAge"`);
  }
}
