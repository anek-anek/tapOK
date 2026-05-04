import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDropPhotoMetadata1778010000000 implements MigrationInterface {
    name = 'AddDropPhotoMetadata1778010000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD "storagePath" text`);
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD "mimeType" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD "sizeBytes" integer`);
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD "width" integer`);
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD "height" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP COLUMN "height"`);
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP COLUMN "width"`);
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP COLUMN "sizeBytes"`);
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP COLUMN "mimeType"`);
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP COLUMN "storagePath"`);
    }
}
