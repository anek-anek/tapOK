import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPresentToDropCrew1777358050901 implements MigrationInterface {
    name = 'AddIsPresentToDropCrew1777358050901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD "isPresent" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP COLUMN "isPresent"`);
    }

}
