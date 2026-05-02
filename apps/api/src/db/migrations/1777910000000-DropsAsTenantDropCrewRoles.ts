import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropsAsTenantDropCrewRoles1777910000000 implements MigrationInterface {
  name = 'DropsAsTenantDropCrewRoles1777910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_members" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "organization_members_role_enum"`);

    await queryRunner.query(
      `CREATE TYPE "public"."drop_crew_member_role_enum" AS ENUM('chief', 'crew', 'co_chief')`,
    );
    await queryRunner.query(
      `ALTER TABLE "drop_crew" ADD "memberRole" "public"."drop_crew_member_role_enum" NOT NULL DEFAULT 'crew'`,
    );

    await queryRunner.query(`
      UPDATE "drop_crew" dc
      SET "memberRole" = 'chief'
      FROM "drops" d
      WHERE dc."dropId" = d.id AND dc."userId" = d."organiserId"
    `);

    await queryRunner.query(`
      INSERT INTO "drop_crew" ("id", "dropId", "userId", "status", "isPresent", "joinedAt", "memberRole")
      SELECT uuid_generate_v4(), d.id, d."organiserId", 'in', true, now(), 'chief'
      FROM "drops" d
      WHERE NOT EXISTS (
        SELECT 1 FROM "drop_crew" c WHERE c."dropId" = d.id AND c."userId" = d."organiserId"
      )
    `);

    await queryRunner.query(`ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'participant')`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING (
        CASE "role"::text
          WHEN 'admin' THEN 'admin'::"public"."users_role_enum"
          ELSE 'participant'::"public"."users_role_enum"
        END
      )
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'participant'`);
    await queryRunner.query(`DROP TYPE "users_role_enum_old"`);
  }

  public async down(): Promise<void> {
    throw new Error(
      'DropsAsTenantDropCrewRoles1777910000000 down() is not reversible without data loss — restore from backup.',
    );
  }
}
