import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinkedItemIdToDropExpenseLogs1778290000001 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE drop_expense_logs ADD COLUMN IF NOT EXISTS "linkedItemId" uuid`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE drop_expense_logs DROP COLUMN IF EXISTS "linkedItemId"`);
  }
}
