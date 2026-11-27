import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuppliers1764300000000 implements MigrationInterface {
  async up(db: QueryRunner) {
    await db.query(`CREATE TABLE IF NOT EXISTS suppliers (
      supplierId INT AUTO_INCREMENT PRIMARY KEY,
      supplierName VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(db: QueryRunner) {
    await db.dropTable('suppliers');
  }
}
