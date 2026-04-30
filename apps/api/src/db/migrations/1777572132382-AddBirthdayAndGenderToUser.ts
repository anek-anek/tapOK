import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBirthdayAndGenderToUser1777572132382 implements MigrationInterface {
    name = 'AddBirthdayAndGenderToUser1777572132382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthday" date`);

        // Convert existing columns to TIMESTAMPTZ safely (non-destructive)
        // Organizations
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "createdAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "updatedAt" TYPE timestamptz`);

        // Organization Members
        await queryRunner.query(`ALTER TABLE "organization_members" ALTER COLUMN "joinedAt" TYPE timestamptz`);

        // Users
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "emailVerifiedAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "emailVerificationSentAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "termsAcceptedAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "privacyPolicyAcceptedAt" TYPE timestamptz`);

        // Activity Logs
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ALTER COLUMN "createdAt" TYPE timestamptz`);

        // Drop Crew
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "joinedAt" TYPE timestamptz`);

        // Drops
        await queryRunner.query(`ALTER TABLE "drops" ALTER COLUMN "scheduledAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "drops" ALTER COLUMN "createdAt" TYPE timestamptz`);
        await queryRunner.query(`ALTER TABLE "drops" ALTER COLUMN "updatedAt" TYPE timestamptz`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert columns to TIMESTAMP
        await queryRunner.query(`ALTER TABLE "drops" ALTER COLUMN "updatedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "drops" ALTER COLUMN "createdAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "drops" ALTER COLUMN "scheduledAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ALTER COLUMN "joinedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ALTER COLUMN "createdAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "privacyPolicyAcceptedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "termsAcceptedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "emailVerificationSentAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "emailVerifiedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "organization_members" ALTER COLUMN "joinedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "updatedAt" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "createdAt" TYPE timestamp`);

        // Remove added columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthday"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    }

}
