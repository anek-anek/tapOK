import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDropPhotos1777621290231 implements MigrationInterface {
    name = 'AddDropPhotos1777621290231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "drop_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dropId" uuid NOT NULL, "userId" uuid NOT NULL, "url" text, "base64" text, "isFeatured" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6712d22d6358758d1ab48ec07c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD CONSTRAINT "FK_d8c8c0673acac01d6b5aa81da1f" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_photos" ADD CONSTRAINT "FK_40f2eea6bd767a476781b6d5457" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP CONSTRAINT "FK_40f2eea6bd767a476781b6d5457"`);
        await queryRunner.query(`ALTER TABLE "drop_photos" DROP CONSTRAINT "FK_d8c8c0673acac01d6b5aa81da1f"`);
        await queryRunner.query(`DROP TABLE "drop_photos"`);
    }

}
