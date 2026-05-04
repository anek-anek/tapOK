import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarStoragePathToUsers1778020000000 implements MigrationInterface {
    name = 'AddAvatarStoragePathToUsers1778020000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatarStoragePath" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarStoragePath"`);
    }
}
