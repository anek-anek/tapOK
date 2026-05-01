import { MigrationInterface, QueryRunner } from "typeorm";

export class PerformanceAuditIndexes1777655396437 implements MigrationInterface {
    name = 'PerformanceAuditIndexes1777655396437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_sparks" DROP CONSTRAINT "FK_drop_sparks_drop"`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" DROP CONSTRAINT "FK_drop_sparks_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_drops_join_code"`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" DROP CONSTRAINT "UQ_drop_sparks_drop_user"`);
        await queryRunner.query(`CREATE INDEX "idx_drop_activity_logs_user_id" ON "drop_activity_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "idx_drop_crew_drop_status" ON "drop_crew" ("dropId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_drop_crew_user_status" ON "drop_crew" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_drop_sparks_user_id" ON "drop_sparks" ("userId") `);
        await queryRunner.query(`ALTER TABLE "drop_sparks" ADD CONSTRAINT "UQ_b6536eef15d2f54c0ef3dc28ffd" UNIQUE ("dropId", "userId")`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" ADD CONSTRAINT "FK_0433b3d0e397c6f92d7214037be" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" ADD CONSTRAINT "FK_693de1d80f61884bdcd228a1bda" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_sparks" DROP CONSTRAINT "FK_693de1d80f61884bdcd228a1bda"`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" DROP CONSTRAINT "FK_0433b3d0e397c6f92d7214037be"`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" DROP CONSTRAINT "UQ_b6536eef15d2f54c0ef3dc28ffd"`);
        await queryRunner.query(`DROP INDEX "public"."idx_drop_sparks_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_drop_crew_user_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_drop_crew_drop_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_drop_activity_logs_user_id"`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" ADD CONSTRAINT "UQ_drop_sparks_drop_user" UNIQUE ("dropId", "userId")`);
        await queryRunner.query(`CREATE INDEX "idx_drops_join_code" ON "drops" ("joinCode") `);
        await queryRunner.query(`ALTER TABLE "drop_sparks" ADD CONSTRAINT "FK_drop_sparks_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_sparks" ADD CONSTRAINT "FK_drop_sparks_drop" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
