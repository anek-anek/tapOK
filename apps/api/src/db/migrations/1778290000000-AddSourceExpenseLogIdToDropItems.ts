import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceExpenseLogIdToDropItems1778290000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE drop_items ADD COLUMN IF NOT EXISTS "sourceExpenseLogId" uuid`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE drop_items DROP COLUMN IF EXISTS "sourceExpenseLogId"`);
  }
}
