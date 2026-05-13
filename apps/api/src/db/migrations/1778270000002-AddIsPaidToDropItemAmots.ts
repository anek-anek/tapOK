import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPaidToDropItemAmots1778270000002 implements MigrationInterface {
    name = 'AddIsPaidToDropItemAmots1778270000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_item_amots" ADD "isPaid" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_item_amots" DROP COLUMN "isPaid"`);
    }

}
