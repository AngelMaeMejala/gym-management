import { Availability, Condition } from './entities';

export function equipmentAvailability(condition: Condition, quantity: number): Availability {
  if (condition === Condition.NEEDS_REPAIR) return Availability.MAINTENANCE;
  return condition === Condition.GOOD && quantity > 0 ? Availability.AVAILABLE : Availability.UNAVAILABLE;
}
