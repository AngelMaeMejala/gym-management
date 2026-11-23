import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Not, QueryFailedError } from 'typeorm';
import { hash } from 'bcrypt';
import { AccountStatus, Availability, Booking, BookingStatus, Delivery, Equipment, Inventory, Notification, Role, Schedule, ScheduleStatus, User } from './entities';
import { BookingDecision, BookingInput, EquipmentInput, ScheduleInput, UserInput, UserUpdate } from './dto';
import { equipmentAvailability } from './equipment-availability';

export function mysqlCode(error: unknown) {
  return error instanceof QueryFailedError ? (error.driverError as { code?: string }).code : undefined;
}

function manilaNow() {
  const value = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Manila', dateStyle: 'short', timeStyle: 'medium',
  }).format(new Date());
  const [date, time] = value.split(' ');
  return { date, time };
}

const bookingTime = (time: string) => time.length === 5 ? time + ':00' : time;

function assertFutureSlot(date: string, startTime: string) {
  const now = manilaNow();
  if (date < now.date || (date === now.date && startTime <= now.time)) {
    throw new BadRequestException('Choose a booking start time in the future (Asia/Manila)');
  }
}

@Injectable()
export class Gym {
  constructor(private db: DataSource) {}

  users() {
    return this.db.getRepository(User).find({ order: { firstName: 'ASC', lastName: 'ASC' } });
  }

  async saveUser(input: UserInput | UserUpdate, id?: number, actor?: User) {
    const { password, ...fields } = input;
    const digest = password === undefined ? undefined : await hash(password, 12);
    const repo = this.db.getRepository(User);
    try {
      if (id === undefined) {
        const result = await repo.insert({ ...fields, password: digest });
        id = result.identifiers[0].userId;
      } else {
        if (id === actor?.userId && (fields.role !== Role.ADMIN || fields.accountStatus !== AccountStatus.ACTIVE)) {
          throw new BadRequestException('You cannot deactivate or change the role of your own administrator account');
        }
        const result = await repo.update(id, { ...fields, ...(digest && { password: digest }) });
        if (!result.affected) throw new NotFoundException('User not found');
      }
      return repo.findOneBy({ userId: id });
    } catch (error) {
      if (mysqlCode(error) === 'ER_DUP_ENTRY') throw new ConflictException('Email already registered');
      throw error;
    }
  }

  schedules(user: User) {
    return this.scheduleList(user.role === Role.MEMBER).getMany();
  }

  private scheduleList(upcoming: boolean) {
    const query = this.db.getRepository(Schedule).createQueryBuilder('s')
      .orderBy('s.scheduleDate', 'ASC').addOrderBy('s.startTime', 'ASC');
    if (upcoming) {
      const { date, time } = manilaNow();
      query.where('s.status = :status', { status: ScheduleStatus.SCHEDULED })
        .andWhere('(s.scheduleDate > :date OR (s.scheduleDate = :date AND s.endTime > :time))', { date, time });
    }
    return query;
  }

  private async scheduleTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.transaction('SERIALIZABLE', work);
      } catch (error) {
        if (!['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(mysqlCode(error) ?? '')) throw error;
        if (attempt >= 2) throw new ConflictException('Gym availability changed concurrently. Please retry.');
      }
    }
  }

  private async notify(manager: EntityManager, schedule: Schedule, action: string) {
    const recipients = await manager.find(User, {
      where: { accountStatus: AccountStatus.ACTIVE }, select: { userId: true },
    });
    if (!recipients.length) return;
    await manager.insert(Notification, recipients.map(({ userId }) => ({
      userId, scheduleId: schedule.scheduleId,
      message: `${schedule.activityName} on ${schedule.scheduleDate} at ${schedule.startTime.slice(0, 5)} was ${action.toLowerCase()}.`,
      notificationType: `SCHEDULE_${action}`, dateSent: new Date(), deliveryStatus: Delivery.SENT,
    })));
  }

  async saveSchedule(input: ScheduleInput, user: User, id?: number) {
    const startTime = input.startTime.length === 5 ? input.startTime + ':00' : input.startTime;
    const endTime = input.endTime.length === 5 ? input.endTime + ':00' : input.endTime;
    if (startTime >= endTime) throw new BadRequestException('End time must be after start time');
    return this.scheduleTransaction(async manager => {
      const repo = manager.getRepository(Schedule);
      const existing = id === undefined ? null : await repo.findOneBy({ scheduleId: id });
      if (id !== undefined && !existing) throw new NotFoundException('Schedule not found');
      if (existing && user.role === Role.STAFF && existing.createdByUserId !== user.userId) {
        throw new ForbiddenException('Staff can edit schedules they created');
      }
      if (input.status === ScheduleStatus.SCHEDULED) {
        const overlap = repo.createQueryBuilder('s')
          .where('s.scheduleDate = :date AND s.status = :status', { date: input.scheduleDate, status: ScheduleStatus.SCHEDULED })
          .andWhere('s.startTime < :endTime AND s.endTime > :startTime', { startTime, endTime });
        if (id !== undefined) overlap.andWhere('s.scheduleId <> :id', { id });
        if (await overlap.getExists()) throw new ConflictException('This time overlaps another scheduled activity');
        if (await this.bookingSlot(manager, input.scheduleDate, startTime, endTime)
          .andWhere('b.status = :approved', { approved: BookingStatus.APPROVED }).getExists()) {
          throw new ConflictException('This time overlaps an approved member booking');
        }
      }
      const result = await repo.save(repo.create({
        ...existing, ...input, startTime, endTime, createdByUserId: existing?.createdByUserId ?? user.userId,
      }));
      const action = input.status === ScheduleStatus.CANCELLED ? 'CANCELLED' : input.status === ScheduleStatus.COMPLETED ? 'COMPLETED' : existing ? 'UPDATED' : 'CREATED';
      await this.notify(manager, result, action);
      return result;
    });
  }

  removeSchedule(id: number) {
    return this.scheduleTransaction(async manager => {
      const schedule = await manager.findOneBy(Schedule, { scheduleId: id });
      if (!schedule) throw new NotFoundException('Schedule not found');
      await this.notify(manager, schedule, 'DELETED');
      await manager.delete(Schedule, id);
    });
  }

  bookings(user: User) {
    const query = this.db.getRepository(Booking).createQueryBuilder('booking')
      .orderBy('booking.createdAt', 'DESC').addOrderBy('booking.bookingId', 'DESC');
    if (user.role === Role.ADMIN) {
      query.leftJoin('booking.member', 'member')
        .addSelect(['member.userId', 'member.firstName', 'member.lastName', 'member.email']);
    } else {
      query.where('booking.memberId = :memberId', { memberId: user.userId });
    }
    return query.getMany();
  }

  private bookingSlot(manager: EntityManager, date: string, startTime: string, endTime: string) {
    return manager.getRepository(Booking).createQueryBuilder('b')
      .where('b.bookingDate = :date AND b.startTime < :endTime AND b.endTime > :startTime', { date, startTime, endTime });
  }

  private async assertBookingCapacity(manager: EntityManager, date: string, startTime: string, endTime: string) {
    const scheduled = await manager.getRepository(Schedule).createQueryBuilder('s')
      .where('s.scheduleDate = :date AND s.status = :status', { date, status: ScheduleStatus.SCHEDULED })
      .andWhere('s.startTime < :endTime AND s.endTime > :startTime', { startTime, endTime }).getExists();
    if (scheduled) throw new ConflictException('This time overlaps an existing gym schedule');
    const reserved = await this.bookingSlot(manager, date, startTime, endTime)
      .andWhere('b.status = :status', { status: BookingStatus.APPROVED }).getExists();
    if (reserved) throw new ConflictException('The gym is already booked at this time');
  }

  createBooking(input: BookingInput, member: User) {
    const startTime = bookingTime(input.startTime);
    const endTime = bookingTime(input.endTime);
    if (startTime >= endTime) throw new BadRequestException('End time must be after start time');
    return this.scheduleTransaction(async manager => {
      assertFutureSlot(input.bookingDate, startTime);
      const duplicate = await this.bookingSlot(manager, input.bookingDate, startTime, endTime)
        .andWhere('b.memberId = :memberId AND b.status IN (:...active)', {
          memberId: member.userId, active: [BookingStatus.PENDING, BookingStatus.APPROVED],
        }).getExists();
      if (duplicate) throw new ConflictException('You already have a booking request or approved booking that overlaps this time');
      await this.assertBookingCapacity(manager, input.bookingDate, startTime, endTime);
      const now = new Date();
      return manager.save(Booking, {
        activity: input.activity, bookingDate: input.bookingDate, startTime, endTime,
        memberId: member.userId, notes: input.notes || null, rejectionReason: null,
        status: BookingStatus.PENDING, createdAt: now, updatedAt: now,
      });
    });
  }

  decideBooking(bookingId: number, input: BookingDecision) {
    return this.scheduleTransaction(async manager => {
      const booking = await manager.findOneBy(Booking, { bookingId });
      if (!booking) throw new NotFoundException('Booking request not found');
      if (booking.status !== BookingStatus.PENDING) throw new ConflictException('Only pending requests can be reviewed');
      if (input.status === BookingStatus.APPROVED) {
        assertFutureSlot(booking.bookingDate, booking.startTime);
        await this.assertBookingCapacity(manager, booking.bookingDate, booking.startTime, booking.endTime);
      }
      booking.status = input.status;
      booking.rejectionReason = input.status === BookingStatus.REJECTED ? input.reason || null : null;
      booking.updatedAt = new Date();
      await manager.save(Booking, booking);
      await manager.insert(Notification, {
        userId: booking.memberId, scheduleId: null, dateSent: booking.updatedAt, deliveryStatus: Delivery.SENT,
        notificationType: 'BOOKING_' + booking.status,
        message: `Your ${booking.activity} booking for ${booking.bookingDate} at ${booking.startTime.slice(0, 5)} was ${booking.status.toLowerCase()}.`,
      });
      return booking;
    });
  }

  cancelBooking(bookingId: number, member: User) {
    return this.scheduleTransaction(async manager => {
      const booking = await manager.findOneBy(Booking, { bookingId, memberId: member.userId });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.APPROVED) {
        throw new ConflictException('Only pending or approved bookings can be cancelled');
      }
      if (booking.status === BookingStatus.APPROVED) assertFutureSlot(booking.bookingDate, booking.startTime);
      booking.status = BookingStatus.CANCELLED;
      booking.updatedAt = new Date();
      return manager.save(Booking, booking);
    });
  }

  async equipment() {
    const { entities, raw } = await this.db.getRepository(Equipment).createQueryBuilder('equipment')
      .leftJoin(Inventory, 'stock', 'stock.equipmentId = equipment.equipmentId')
      .addSelect('stock.quantity', 'quantity')
      .orderBy('equipment.equipmentName', 'ASC')
      .getRawAndEntities<{ equipment_equipmentId: number; quantity: number | null }>();
    const quantities = new Map(raw.map(row => [row.equipment_equipmentId, row.quantity]));
    return entities.map(equipment => ({ ...equipment, quantity: quantities.get(equipment.equipmentId) ?? null }));
  }

  async saveEquipment(input: EquipmentInput, user: User, id?: number) {
    const { equipmentName, category, equipmentCondition } = input;
    return this.db.transaction(async manager => {
      const repo = manager.getRepository(Equipment);
      if (id !== undefined) {
        const equipment = await this.lockEquipment(manager, id);
        const stock = await manager.findOneBy(Inventory, { equipmentId: id });
        return repo.save({
          ...equipment, equipmentName, category, equipmentCondition,
          availabilityStatus: equipmentAvailability(equipmentCondition, stock?.quantity ?? 0),
        });
      }
      const { date: dateAdded } = manilaNow();
      const equipment = await repo.save({
        equipmentName, category, equipmentCondition, dateAdded,
        availabilityStatus: equipmentAvailability(equipmentCondition, 0),
      });
      await manager.insert(Inventory, { equipmentId: equipment.equipmentId, quantity: 0, lastUpdated: new Date(), updatedByUserId: user.userId });
      return equipment;
    });
  }

  async removeEquipment(id: number) {
    const result = await this.db.getRepository(Equipment).delete(id);
    if (!result.affected) throw new NotFoundException('Equipment not found');
  }

  inventory() {
    return this.db.getRepository(Inventory).find({ relations: { equipment: true }, order: { quantity: 'ASC' } });
  }

  async updateInventory(id: number, quantity: number, actor: User) {
    return this.db.transaction(async manager => {
      const repo = manager.getRepository(Inventory);
      const inventory = await repo.findOneBy({ inventoryId: id });
      if (!inventory) throw new NotFoundException('Inventory record not found');
      const equipment = await this.lockEquipment(manager, inventory.equipmentId);
      const result = await repo.update(id, { quantity, updatedByUserId: actor.userId, lastUpdated: new Date() });
      if (!result.affected) throw new NotFoundException('Inventory record not found');
      await manager.update(Equipment, equipment.equipmentId, {
        availabilityStatus: equipmentAvailability(equipment.equipmentCondition, quantity),
      });
      return repo.findOneBy({ inventoryId: id });
    });
  }

  private async lockEquipment(manager: EntityManager, equipmentId: number) {
    const equipment = await manager.findOne(Equipment, {
      where: { equipmentId }, lock: { mode: 'pessimistic_write' },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  notifications(user: User) {
    return this.db.getRepository(Notification).find({ where: { userId: user.userId }, order: { dateSent: 'DESC', notificationId: 'DESC' } });
  }

  async markRead(id: number, user: User) {
    const repo = this.db.getRepository(Notification);
    const where = { notificationId: id, userId: user.userId };
    const result = await repo.update(where, { deliveryStatus: Delivery.READ });
    if (!result.affected) throw new NotFoundException('Notification not found');
    return repo.findOneBy(where);
  }

  async dashboard(user: User) {
    const [[upcoming, scheduled], equipment, available, unread, totalSchedules, pendingBookings] = await Promise.all([
      this.scheduleList(true).take(6).getManyAndCount(),
      this.db.getRepository(Equipment).count(),
      this.db.getRepository(Equipment).countBy({ availabilityStatus: Availability.AVAILABLE }),
      this.db.getRepository(Notification).countBy({ userId: user.userId, deliveryStatus: Not(Delivery.READ) }),
      this.db.getRepository(Schedule).count(),
      user.role === Role.ADMIN ? this.db.getRepository(Booking).countBy({ status: BookingStatus.PENDING }) : undefined,
    ]);
    return { scheduled, equipment, available, unread, totalSchedules, upcoming, pendingBookings };
  }
}

