import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database';
import { AccountStatus, Condition, Equipment, Inventory, Role, User } from './entities';
import { equipmentAvailability } from './equipment-availability';

const samples = [
  ['Treadmill', 'Cardio', 5],
  ['Stationary Bike', 'Cardio', 3],
  ['Dumbbell Set', 'Free Weights', 10],
  ['Barbell', 'Free Weights', 6],
  ['Weight Plates', 'Free Weights', 20],
  ['Adjustable Bench', 'Strength', 4],
  ['Bench Press', 'Strength', 3],
  ['Squat Rack', 'Strength', 2],
  ['Smith Machine', 'Strength', 2],
  ['Leg Press Machine', 'Strength', 2],
  ['Lat Pulldown Machine', 'Strength', 2],
  ['Cable Crossover Machine', 'Strength', 2],
  ['Chest Press Machine', 'Strength', 2],
  ['Seated Row Machine', 'Strength', 2],
  ['Leg Extension Machine', 'Strength', 2],
] as const;

async function seedEquipment() {
  const db = await new DataSource(databaseOptions()).initialize();
  try {
    // Serializable reads protect the insert-if-absent checks from concurrent inserts.
    const counts = await db.transaction('SERIALIZABLE', async manager => {
      const admin = await manager.findOne(User, {
        where: { role: Role.ADMIN, accountStatus: AccountStatus.ACTIVE },
        order: { userId: 'ASC' },
      });
      if (!admin) throw new Error('An active administrator must exist before seeding inventory.');

      let equipmentAdded = 0;
      let inventoryAdded = 0;
      const lastUpdated = new Date();
      const dateAdded = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Manila' }).format(lastUpdated);
      for (const [equipmentName, category, quantity] of samples) {
        let equipment = await manager.findOne(Equipment, {
          where: { equipmentName },
          order: { equipmentId: 'ASC' },
        });
        if (!equipment) {
          const equipmentCondition = equipmentName === 'Smith Machine' ? Condition.NEEDS_REPAIR : Condition.GOOD;
          equipment = await manager.save(Equipment, {
            equipmentName, category, dateAdded,
            equipmentCondition,
            availabilityStatus: equipmentAvailability(equipmentCondition, quantity),
          });
          equipmentAdded++;
        }

        if (!(await manager.existsBy(Inventory, { equipmentId: equipment.equipmentId }))) {
          await manager.insert(Inventory, {
            equipmentId: equipment.equipmentId, quantity, lastUpdated, updatedByUserId: admin.userId,
          });
          const availabilityStatus = equipmentAvailability(equipment.equipmentCondition, quantity);
          if (equipment.availabilityStatus !== availabilityStatus) {
            await manager.update(Equipment, equipment.equipmentId, { availabilityStatus });
          }
          inventoryAdded++;
        }
      }
      return { equipmentAdded, inventoryAdded };
    });
    console.log(`Added ${counts.equipmentAdded} equipment records and ${counts.inventoryAdded} inventory records.`);
  } finally {
    await db.destroy();
  }
}

seedEquipment().catch(error => {
  console.error('Equipment seed failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
