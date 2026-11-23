import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  async up(db: QueryRunner) {
    await db.query(`CREATE TABLE IF NOT EXISTS users (
      userId INT AUTO_INCREMENT PRIMARY KEY,
      firstName VARCHAR(50) NOT NULL,
      lastName VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(200) NOT NULL,
      role ENUM('ADMIN','STAFF','MEMBER') NOT NULL,
      accountStatus ENUM('ACTIVE','INACTIVE') NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await db.query(`CREATE TABLE IF NOT EXISTS gym_schedules (
      scheduleId INT AUTO_INCREMENT PRIMARY KEY,
      activityName VARCHAR(100) NOT NULL,
      scheduleDate DATE NOT NULL,
      startTime TIME NOT NULL,
      endTime TIME NOT NULL,
      status ENUM('SCHEDULED','COMPLETED','CANCELLED') NOT NULL,
      createdByUserId INT NOT NULL,
      INDEX schedule_overlap (scheduleDate, status, startTime, endTime),
      CONSTRAINT schedule_creator FOREIGN KEY (createdByUserId) REFERENCES users(userId) ON DELETE RESTRICT,
      CONSTRAINT schedule_times CHECK (startTime < endTime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await db.query(`CREATE TABLE IF NOT EXISTS equipment (
      equipmentId INT AUTO_INCREMENT PRIMARY KEY,
      equipmentName VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      equipmentCondition ENUM('GOOD','NEEDS_REPAIR','DAMAGED') NOT NULL,
      availabilityStatus ENUM('AVAILABLE','UNAVAILABLE','MAINTENANCE') NOT NULL,
      dateAdded DATE NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await db.query(`CREATE TABLE IF NOT EXISTS inventory (
      inventoryId INT AUTO_INCREMENT PRIMARY KEY,
      equipmentId INT NOT NULL UNIQUE,
      quantity INT NOT NULL,
      lastUpdated DATETIME NOT NULL,
      updatedByUserId INT NOT NULL,
      CONSTRAINT inventory_equipment FOREIGN KEY (equipmentId) REFERENCES equipment(equipmentId) ON DELETE CASCADE,
      CONSTRAINT inventory_updater FOREIGN KEY (updatedByUserId) REFERENCES users(userId) ON DELETE RESTRICT,
      CONSTRAINT inventory_nonnegative CHECK (quantity >= 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await db.query(`CREATE TABLE IF NOT EXISTS notifications (
      notificationId INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      scheduleId INT NULL,
      message VARCHAR(255) NOT NULL,
      notificationType VARCHAR(50) NOT NULL,
      dateSent DATETIME NOT NULL,
      deliveryStatus ENUM('PENDING','SENT','READ') NOT NULL,
      CONSTRAINT notification_recipient FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
      CONSTRAINT notification_schedule FOREIGN KEY (scheduleId) REFERENCES gym_schedules(scheduleId) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(db: QueryRunner) {
    for (const table of ['notifications', 'inventory', 'equipment', 'gym_schedules', 'users']) {
      await db.dropTable(table);
    }
  }
}

