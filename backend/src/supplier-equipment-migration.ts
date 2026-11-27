import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkEquipmentToSuppliers1764400000000 implements MigrationInterface {
  async up(db: QueryRunner) {
    if (!(await db.hasColumn('suppliers', 'contactPerson'))) {
      await db.query(`ALTER TABLE suppliers
        ADD contactPerson VARCHAR(100) NULL,
        ADD address VARCHAR(255) NULL,
        ADD status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'`);
    }
    if (!(await db.hasColumn('equipment', 'supplierId'))) {
      await db.query(`ALTER TABLE equipment
        ADD supplierId INT NULL,
        ADD CONSTRAINT equipment_supplier FOREIGN KEY (supplierId) REFERENCES suppliers(supplierId) ON DELETE RESTRICT`);
    }
    await db.query(`INSERT INTO suppliers (supplierName, contactPerson, phone, email, address, status) VALUES
      ('Lime Ridge Fitness Supply', 'Morgan Reed', '+1 202-555-0101', 'sales@limeridge.example', '10 Demo Lane, Sample City', 'ACTIVE'),
      ('Cedar Peak Strength Works', 'Alex Rivera', '+1 202-555-0102', 'sales@cedarpeak.example', '20 Demo Lane, Sample City', 'ACTIVE'),
      ('Northfield Cardio Parts', 'Taylor Brooks', '+1 202-555-0103', 'sales@northfield.example', '30 Demo Lane, Sample City', 'INACTIVE')
      ON DUPLICATE KEY UPDATE supplierId = supplierId`);
  }

  async down(db: QueryRunner) {
    await db.query('ALTER TABLE equipment DROP FOREIGN KEY equipment_supplier, DROP COLUMN supplierId');
    await db.query('ALTER TABLE suppliers DROP COLUMN contactPerson, DROP COLUMN address, DROP COLUMN status');
  }
}
