import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNotificationsSchema1778260000001 implements MigrationInterface {
    name = 'FixNotificationsSchema1778260000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId_isRead"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId_createdAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "startingSoonNotifiedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('join_requested', 'join_approved', 'join_rejected', 'member_joined', 'member_left', 'member_removed', 'invited_to_drop', 'drop_starting_soon', 'drop_started', 'drop_completed')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('join_requested', 'join_approved', 'join_rejected', 'member_joined', 'member_left', 'member_removed', 'invited_to_drop', 'drop_starting_soon', 'drop_started', 'drop_completed')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "startingSoonNotifiedAt"`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_userId_createdAt" ON "notifications" ("createdAt", "userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_userId_isRead" ON "notifications" ("isRead", "userId") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
