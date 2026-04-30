import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDropPrivacy1777359000000 implements MigrationInterface {
    name = 'AddDropPrivacy1777359000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" ADD "isPublic" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TYPE "public"."drop_crew_status_enum" RENAME TO "drop_crew_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."drop_crew_status_enum" AS ENUM('in', 'pending', 'rejected', 'removed', 'invited')`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" TYPE "public"."drop_crew_status_enum" USING "status"::"text"::"public"."drop_crew_status_enum"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" SET DEFAULT 'in'`);
        await queryRunner.query(`DROP TYPE "public"."drop_crew_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."drop_crew_status_enum_old" AS ENUM('in', 'pending', 'rejected', 'removed')`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" TYPE "public"."drop_crew_status_enum_old" USING "status"::"text"::"public"."drop_crew_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "status" SET DEFAULT 'in'`);
        await queryRunner.query(`DROP TYPE "public"."drop_crew_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."drop_crew_status_enum_old" RENAME TO "drop_crew_status_enum"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "isPublic"`);
    }
}
