import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOverviewToDrops1777612055318 implements MigrationInterface {
    name = 'AddOverviewToDrops1777612055318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" ADD "overview" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "overview"`);
    }

}
