import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDropsTable1777200000000 implements MigrationInterface {
    name = 'AddDropsTable1777200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."drops_status_enum" AS ENUM('active', 'ongoing', 'completed')`);
        await queryRunner.query(`CREATE TABLE "drops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "scheduledAt" TIMESTAMP NOT NULL, "location" character varying NOT NULL, "expectedHeadcount" integer, "status" "public"."drops_status_enum" NOT NULL DEFAULT 'active', "joinCode" character varying NOT NULL, "shareUrl" character varying NOT NULL, "organiserId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_drops_joinCode" UNIQUE ("joinCode"), CONSTRAINT "PK_drops" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "drop_activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dropId" uuid NOT NULL, "userId" uuid NOT NULL, "action" character varying NOT NULL, "changedFields" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_drop_activity_logs" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "drops" ADD CONSTRAINT "FK_drops_organiserId" FOREIGN KEY ("organiserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_drop_activity_logs_dropId" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_drop_activity_logs_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_drop_activity_logs_userId"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_drop_activity_logs_dropId"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP CONSTRAINT "FK_drops_organiserId"`);
        await queryRunner.query(`DROP TABLE "drop_activity_logs"`);
        await queryRunner.query(`DROP TABLE "drops"`);
        await queryRunner.query(`DROP TYPE "public"."drops_status_enum"`);
    }
}
