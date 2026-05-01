import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdempotencyKeyToDrops1777800000000 implements MigrationInterface {
    name = 'AddIdempotencyKeyToDrops1777800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" ADD "idempotencyKey" text`);
        await queryRunner.query(`ALTER TABLE "drops" ADD CONSTRAINT "UQ_drops_idempotencyKey" UNIQUE ("idempotencyKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" DROP CONSTRAINT "UQ_drops_idempotencyKey"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "idempotencyKey"`);
    }

}
