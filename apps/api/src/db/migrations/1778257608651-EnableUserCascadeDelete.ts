import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableUserCascadeDelete1778257608651 implements MigrationInterface {
    name = 'EnableUserCascadeDelete1778257608651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_af4ee1bf599331fde39883844fd"`);
        await queryRunner.query(`ALTER TABLE "drop_items" DROP CONSTRAINT "FK_5543ecea275fb7645c0ee886444"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP CONSTRAINT "FK_f865ba92337e988445725355fcb"`);
        await queryRunner.query(`ALTER TABLE "drops" DROP COLUMN "startingSoonNotifiedAt"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_af4ee1bf599331fde39883844fd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_items" ADD CONSTRAINT "FK_5543ecea275fb7645c0ee886444" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drops" ADD CONSTRAINT "FK_f865ba92337e988445725355fcb" FOREIGN KEY ("organiserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drops" DROP CONSTRAINT "FK_f865ba92337e988445725355fcb"`);
        await queryRunner.query(`ALTER TABLE "drop_items" DROP CONSTRAINT "FK_5543ecea275fb7645c0ee886444"`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" DROP CONSTRAINT "FK_af4ee1bf599331fde39883844fd"`);
        await queryRunner.query(`ALTER TABLE "drops" ADD "startingSoonNotifiedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "drops" ADD CONSTRAINT "FK_f865ba92337e988445725355fcb" FOREIGN KEY ("organiserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_items" ADD CONSTRAINT "FK_5543ecea275fb7645c0ee886444" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drop_activity_logs" ADD CONSTRAINT "FK_af4ee1bf599331fde39883844fd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
