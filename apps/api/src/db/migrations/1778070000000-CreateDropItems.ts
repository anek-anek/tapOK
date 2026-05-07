import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDropItems1778070000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drop_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "dropId" uuid NOT NULL,
        "assignedUserId" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drop_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_drop_items_drop" FOREIGN KEY ("dropId")
          REFERENCES "drops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_drop_items_user" FOREIGN KEY ("assignedUserId")
          REFERENCES "users"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "drop_items"`);
  }
}
