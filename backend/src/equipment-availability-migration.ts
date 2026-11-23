import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeEquipmentAvailability1764100000000 implements MigrationInterface {
  async up(db: QueryRunner) {
    const expected = `CASE
      WHEN e.equipmentCondition = 'NEEDS_REPAIR' THEN 'MAINTENANCE'
      WHEN e.equipmentCondition = 'GOOD' AND COALESCE(i.quantity, 0) > 0 THEN 'AVAILABLE'
      ELSE 'UNAVAILABLE'
    END`;
    await db.query(`UPDATE equipment e
      LEFT JOIN inventory i ON i.equipmentId = e.equipmentId
      SET e.availabilityStatus = ${expected}
      WHERE e.availabilityStatus <> ${expected}`);
  }

  async down() {
    // The previous inconsistent values cannot be reconstructed from the corrected data.
  }
}
