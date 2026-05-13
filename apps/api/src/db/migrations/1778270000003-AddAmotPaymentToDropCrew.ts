import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAmotPaymentToDropCrew1778270000003 implements MigrationInterface {
    name = 'AddAmotPaymentToDropCrew1778270000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD "amotPaidAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "drop_crew" ADD "amotProofPath" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP COLUMN "amotProofPath"`);
        await queryRunner.query(`ALTER TABLE "drop_crew" DROP COLUMN "amotPaidAt"`);
    }

}
