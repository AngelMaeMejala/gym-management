import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGymBookings1764000000000 implements MigrationInterface {
  async up(db: QueryRunner) {
    await db.query(`CREATE TABLE IF NOT EXISTS gym_bookings (
      bookingId INT AUTO_INCREMENT PRIMARY KEY,
      memberId INT NOT NULL,
      activity VARCHAR(50) NOT NULL,
      bookingDate DATE NOT NULL,
      startTime TIME NOT NULL,
      endTime TIME NOT NULL,
      notes VARCHAR(500) NULL,
      status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
      rejectionReason VARCHAR(500) NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      INDEX booking_slot (bookingDate, status, startTime, endTime),
      INDEX booking_member_slot (memberId, bookingDate, status, startTime, endTime),
      CONSTRAINT booking_member FOREIGN KEY (memberId) REFERENCES users(userId) ON DELETE RESTRICT,
      CONSTRAINT booking_times CHECK (startTime < endTime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(db: QueryRunner) {
    await db.dropTable('gym_bookings');
  }
}
