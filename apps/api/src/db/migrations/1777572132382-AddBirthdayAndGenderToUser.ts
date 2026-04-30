import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBirthdayAndGenderToUser1777572132382 implements MigrationInterface {
    name = 'AddBirthdayAndGenderToUser1777572132382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationSentAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationSentAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "termsAcceptedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "termsAcceptedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "privacyPolicyAcceptedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "privacyPolicyAcceptedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "scheduledAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "scheduledAt"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "scheduledAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD "joinedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "privacyPolicyAcceptedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "privacyPolicyAcceptedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "termsAcceptedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "termsAcceptedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationSentAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationSentAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD "joinedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
