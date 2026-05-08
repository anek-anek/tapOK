import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNotificationsSchema1778260665001 implements MigrationInterface {
    name = 'FixNotificationsSchema1778260665001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('join_requested', 'join_approved', 'join_rejected', 'member_joined', 'member_left', 'member_removed', 'invited_to_drop', 'drop_edited', 'drop_starting_soon', 'drop_started', 'drop_completed')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('join_requested', 'join_approved', 'join_rejected', 'member_joined', 'member_left', 'member_removed', 'invited_to_drop', 'drop_starting_soon', 'drop_started', 'drop_completed')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
    }

}
