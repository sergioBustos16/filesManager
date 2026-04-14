import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsSuperAdmin20260413000000 implements MigrationInterface {
  name = 'AddIsSuperAdmin20260413000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD "isSuperAdmin" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "isSuperAdmin"');
  }
}
