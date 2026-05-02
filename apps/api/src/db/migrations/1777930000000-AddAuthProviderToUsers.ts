import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthProviderToUsers1777930000000 implements MigrationInterface {
  name = 'AddAuthProviderToUsers1777930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_authprovider_enum" AS ENUM('password', 'google')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "authProvider" "public"."users_authprovider_enum"`,
    );
    await queryRunner.query(
      `UPDATE "users"
       SET "authProvider" = CASE
         WHEN "googleId" IS NOT NULL THEN 'google'::"public"."users_authprovider_enum"
         ELSE 'password'::"public"."users_authprovider_enum"
       END`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "authProvider" SET DEFAULT 'password'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "authProvider" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "authProvider"`);
    await queryRunner.query(`DROP TYPE "public"."users_authprovider_enum"`);
  }
}
