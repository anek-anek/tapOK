import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDropCrewAndIsLocked1777278964644 implements MigrationInterface {
    name = 'AddDropCrewAndIsLocked1777278964644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_drop_activity_logs_dropId"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_drop_activity_logs_userId"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP CONSTRAINT "FK_drops_organiserId"`);
        await queryRunner.query(`CREATE TYPE "public"."drop_crew_status_enum" AS ENUM('in', 'pending')`);
        await queryRunner.query(`CREATE TABLE "drop_crew" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dropId" uuid NOT NULL, "userId" uuid NOT NULL, "status" "public"."drop_crew_status_enum" NOT NULL DEFAULT 'in', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9e074c115b6790e2633efa38dc4" UNIQUE ("dropId", "userId"), CONSTRAINT "PK_03bf3c86d5d7ee49563b4dfaa1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "isLocked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_cb010c58087a40f7b1a6817bf80" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_af4ee1bf599331fde39883844fd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD CONSTRAINT "FK_07a6a7dd0517f7337a3053ae772" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD CONSTRAINT "FK_923b6aa03dc2d59dd6629efb0df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drops" ADD CONSTRAINT "FK_f865ba92337e988445725355fcb" FOREIGN KEY ("organiserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" DROP CONSTRAINT "FK_f865ba92337e988445725355fcb"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP CONSTRAINT "FK_923b6aa03dc2d59dd6629efb0df"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP CONSTRAINT "FK_07a6a7dd0517f7337a3053ae772"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_af4ee1bf599331fde39883844fd"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_cb010c58087a40f7b1a6817bf80"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "isLocked"`);
        await queryRunner.query(`DROP TABLE "drop_crew"`);
        await queryRunner.query(`DROP TYPE "public"."drop_crew_status_enum"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD CONSTRAINT "FK_drops_organiserId" FOREIGN KEY ("organiserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_drop_activity_logs_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_drop_activity_logs_dropId" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
