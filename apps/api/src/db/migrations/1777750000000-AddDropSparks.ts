import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDropSparks1777750000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "drop_sparks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dropId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drop_sparks_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_drop_sparks_drop_user" UNIQUE ("dropId", "userId"),
        CONSTRAINT "FK_drop_sparks_drop" FOREIGN KEY ("dropId") REFERENCES "drops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_drop_sparks_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "drop_sparks"`);
  }
}
