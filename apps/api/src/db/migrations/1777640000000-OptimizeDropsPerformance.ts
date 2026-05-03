import { MigrationInterface, QueryRunner } from "typeorm";

export class OptimizeDropsPerformance1777640000000 implements MigrationInterface {
    name = 'OptimizeDropsPerformance1777640000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_drops_join_code" ON "drops" ("joinCode")`);
        await queryRunner.query(`CREATE INDEX "idx_drop_crew_drop_id" ON "drop_crew" ("dropId")`);
        await queryRunner.query(`CREATE INDEX "idx_drop_crew_user_id" ON "drop_crew" ("userId")`);
        await queryRunner.query(`CREATE INDEX "idx_drop_activity_logs_drop_id" ON "drop_activity_logs" ("dropId")`);
        await queryRunner.query(`CREATE INDEX "idx_organizations_slug" ON "organizations" ("slug")`);
        await queryRunner.query(`CREATE INDEX "idx_organization_members_user_id" ON "organization_members" ("userId")`);
        await queryRunner.query(`CREATE INDEX "idx_drop_photos_drop_id" ON "drop_photos" ("dropId")`);
        await queryRunner.query(`CREATE INDEX "idx_drop_photos_user_id" ON "drop_photos" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_drop_photos_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_drop_photos_drop_id"`);
        await queryRunner.query(`DROP INDEX "idx_organization_members_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_organizations_slug"`);
        await queryRunner.query(`DROP INDEX "idx_drop_activity_logs_drop_id"`);
        await queryRunner.query(`DROP INDEX "idx_drop_crew_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_drop_crew_drop_id"`);
        await queryRunner.query(`DROP INDEX "idx_drops_join_code"`);
    }

}
