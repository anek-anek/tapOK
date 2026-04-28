import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRejectedToDropCrewStatus1777300000000 implements MigrationInterface {
    name = 'AddRejectedToDropCrewStatus1777300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."drop_crew_status_enum" ADD VALUE 'rejected'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres does not support removing enum values; recreate the type without 'rejected'
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" TYPE text`);
        await queryRunner.query(`DROP TYPE "public"."drop_crew_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."drop_crew_status_enum" AS ENUM('in', 'pending')`);
        await queryRunner.query(`DELETE FROM "drop_crew" WHERE "status" = 'rejected'`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" TYPE "public"."drop_crew_status_enum" USING "status"::"public"."drop_crew_status_enum"`);
    }
}
