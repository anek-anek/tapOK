import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsConfirmedDropItems1778246380281 implements MigrationInterface {
    name = 'AddIsConfirmedDropItems1778246380281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_items" ADD "isConfirmed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_items" DROP COLUMN "isConfirmed"`);
    }

}
