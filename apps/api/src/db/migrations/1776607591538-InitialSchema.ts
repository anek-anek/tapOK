import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776607591538 implements MigrationInterface {
    name = 'InitialSchema1776607591538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying, "logoUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9b7ca6d30b94fef571cff876884" UNIQUE ("name"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."organization_members_role_enum" AS ENUM('owner', 'admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."organization_members_role_enum" NOT NULL DEFAULT 'member', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7c48546e8026fb043d9ad0c2c8c" UNIQUE ("organizationId", "userId"), CONSTRAINT "PK_c2b39d5d072886a4d9c8105eb9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'photographer', 'participant')`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "avatar" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'participant', "isEmailVerified" boolean NOT NULL DEFAULT false, "emailVerifiedAt" TIMESTAMP, "emailVerificationSentAt" TIMESTAMP, "googleId" character varying, "firebaseUid" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "gender" "public"."users_gender_enum", "birthday" date, "userHandle" character varying, "termsAccepted" boolean NOT NULL DEFAULT false, "termsAcceptedAt" TIMESTAMP, "privacyPolicyAccepted" boolean NOT NULL DEFAULT false, "privacyPolicyAcceptedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_e621f267079194e5428e19af2f3" UNIQUE ("firebaseUid"), CONSTRAINT "UQ_611740c8a27fc5eb263c28c94b0" UNIQUE ("userHandle"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_e826222ad017663c6db1a45a4f1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_e826222ad017663c6db1a45a4f1"`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "organization_members"`);
        await queryRunner.query(`DROP TYPE "public"."organization_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }

}
