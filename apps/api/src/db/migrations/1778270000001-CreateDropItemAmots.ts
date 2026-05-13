import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDropItemAmots1778270000001 implements MigrationInterface {
  name = 'CreateDropItemAmots1778270000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "drop_item_amots" (
        "id"         uuid                NOT NULL DEFAULT uuid_generate_v4(),
        "itemId"     uuid                NOT NULL,
        "userId"     uuid                NOT NULL,
        "isOptedOut" boolean             NOT NULL DEFAULT false,
        "createdAt"  TIMESTAMPTZ         NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMPTZ         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drop_item_amots" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_drop_item_amots_item_user" UNIQUE ("itemId", "userId"),
        CONSTRAINT "FK_drop_item_amots_item" FOREIGN KEY ("itemId")
          REFERENCES "drop_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_drop_item_amots_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_drop_item_amots_item_id" ON "drop_item_amots" ("itemId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_drop_item_amots_item_id"`);
    await queryRunner.query(`DROP TABLE "drop_item_amots"`);
  }
}
