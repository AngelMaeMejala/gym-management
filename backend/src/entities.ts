import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum Role { ADMIN = 'ADMIN', STAFF = 'STAFF', MEMBER = 'MEMBER' }
export enum AccountStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }
export enum SupplierStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }
export enum ScheduleStatus { SCHEDULED = 'SCHEDULED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
export enum Condition { GOOD = 'GOOD', NEEDS_REPAIR = 'NEEDS_REPAIR', DAMAGED = 'DAMAGED' }
export enum Availability { AVAILABLE = 'AVAILABLE', UNAVAILABLE = 'UNAVAILABLE', MAINTENANCE = 'MAINTENANCE' }
export enum Delivery { PENDING = 'PENDING', SENT = 'SENT', READ = 'READ' }

@Entity('users')
export class User {
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  profilePictureKey!: string | null;

  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ type: 'varchar', length: 50 })
  firstName!: string;

  @Column({ type: 'varchar', length: 50 })
  lastName!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 200, select: false })
  password!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ type: 'enum', enum: AccountStatus })
  accountStatus!: AccountStatus;
}

@Entity('gym_schedules')
@Index(['scheduleDate', 'status', 'startTime', 'endTime'])
export class Schedule {
  @PrimaryGeneratedColumn()
  scheduleId!: number;

  @Column({ type: 'varchar', length: 100 })
  activityName!: string;

  @Column({ type: 'date' })
  scheduleDate!: string;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'enum', enum: ScheduleStatus })
  status!: ScheduleStatus;

  @Column({ type: 'int' })
  createdByUserId!: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  creator!: User;
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn()
  equipmentId!: number;

  @Column({ type: 'varchar', length: 100 })
  equipmentName!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: string;

  @Column({ type: 'enum', enum: Condition })
  equipmentCondition!: Condition;

  @Column({ type: 'enum', enum: Availability })
  availabilityStatus!: Availability;

  @Column({ type: 'date' })
  dateAdded!: string;

  @Column({ type: 'int', nullable: true })
  supplierId!: number | null;

  @ManyToOne(() => Supplier, supplier => supplier.equipment, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier!: Supplier | null;
}

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  inventoryId!: number;

  @Column({ type: 'int', unique: true })
  equipmentId!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'datetime' })
  lastUpdated!: Date;

  @Column({ type: 'int' })
  updatedByUserId!: number;

  @OneToOne(() => Equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipmentId' })
  equipment!: Equipment;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'updatedByUserId' })
  updatedBy!: User;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  notificationId!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int', nullable: true })
  scheduleId!: number | null;

  @Column({ type: 'varchar', length: 255 })
  message!: string;

  @Column({ type: 'varchar', length: 50 })
  notificationType!: string;

  @Column({ type: 'datetime' })
  dateSent!: Date;

  @Column({ type: 'enum', enum: Delivery })
  deliveryStatus!: Delivery;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  recipient!: User;

  @ManyToOne(() => Schedule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scheduleId' })
  schedule!: Schedule | null;
}

export enum BookingStatus {
  PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED', CANCELLED = 'CANCELLED',
}

export enum BookingActivity {
  GENERAL = 'General Workout',
  CARDIO = 'Cardio Training',
  STRENGTH = 'Strength Training',
  WEIGHTLIFTING = 'Weightlifting',
  FUNCTIONAL = 'Functional Training',
  FITNESS = 'Fitness Training',
}

@Entity('gym_bookings')
@Index('booking_slot', ['bookingDate', 'status', 'startTime', 'endTime'])
@Index('booking_member_slot', ['memberId', 'bookingDate', 'status', 'startTime', 'endTime'])
export class Booking {
  @PrimaryGeneratedColumn()
  bookingId!: number;

  @Column({ type: 'int' })
  memberId!: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'memberId' })
  member!: User;

  @Column({ type: 'varchar', length: 50 })
  activity!: BookingActivity;

  @Column({ type: 'date' })
  bookingDate!: string;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  supplierId!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  supplierName!: string;

  @Column({ type: 'varchar', length: 100 })
  email!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'enum', enum: SupplierStatus, default: SupplierStatus.ACTIVE })
  status!: SupplierStatus;

  @OneToMany(() => Equipment, equipment => equipment.supplier)
  equipment!: Equipment[];
}

export const entities = [User, Schedule, Equipment, Inventory, Notification, Booking, Supplier];
