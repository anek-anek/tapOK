import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAmotToDropItems1778270000000 implements MigrationInterface {
  name = 'AddAmotToDropItems1778270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drop_items" ADD "amotCost" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "drop_items" ADD "amotDeclaredById" uuid`);
    await queryRunner.query(`
      ALTER TABLE "drop_items"
        ADD CONSTRAINT "FK_drop_items_amot_declared_by"
          FOREIGN KEY ("amotDeclaredById") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drop_items" DROP CONSTRAINT "FK_drop_items_amot_declared_by"`);
    await queryRunner.query(`ALTER TABLE "drop_items" DROP COLUMN "amotDeclaredById"`);
    await queryRunner.query(`ALTER TABLE "drop_items" DROP COLUMN "amotCost"`);
  }
}
