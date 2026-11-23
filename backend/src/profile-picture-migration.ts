import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfilePicture1764200000000 implements MigrationInterface {
  async up(db: QueryRunner) {
    if (!(await db.hasColumn('users', 'profilePictureKey'))) {
      await db.addColumn('users', new TableColumn({
        name: 'profilePictureKey', type: 'varchar', length: '64', isNullable: true,
      }));
    }
  }

  async down(db: QueryRunner) {
    await db.dropColumn('users', 'profilePictureKey');
  }
}
