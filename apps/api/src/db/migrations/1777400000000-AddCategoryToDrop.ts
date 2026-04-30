import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToDrop1777400000000 implements MigrationInterface {
    name = 'AddCategoryToDrop1777400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."drops_category_enum" AS ENUM('hangout', 'party')`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "category" "public"."drops_category_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."drops_category_enum"`);
    }
}
