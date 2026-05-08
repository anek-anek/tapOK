import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAssignableToDropItems1778261413000 implements MigrationInterface {
    name = 'AddIsAssignableToDropItems1778261413000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_items" ADD "isAssignable" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_items" DROP COLUMN "isAssignable"`);
    }

}
