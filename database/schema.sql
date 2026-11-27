-- FitZone schema-only export. No account rows, application data, or credentials.
-- Select an empty database before importing. NestJS records migrations and seeds fictional suppliers on startup.

CREATE TABLE IF NOT EXISTS `users` (
  `userId` INT NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(200) NOT NULL,
  `role` enum('ADMIN','STAFF','MEMBER') NOT NULL,
  `accountStatus` enum('ACTIVE','INACTIVE') NOT NULL,
  `profilePictureKey` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `supplierId` INT NOT NULL AUTO_INCREMENT,
  `supplierName` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `contactPerson` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`supplierId`),
  UNIQUE KEY `supplierName` (`supplierName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gym_schedules` (
  `scheduleId` INT NOT NULL AUTO_INCREMENT,
  `activityName` varchar(100) NOT NULL,
  `scheduleDate` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `status` enum('SCHEDULED','COMPLETED','CANCELLED') NOT NULL,
  `createdByUserId` INT NOT NULL,
  PRIMARY KEY (`scheduleId`),
  KEY `schedule_overlap` (`scheduleDate`,`status`,`startTime`,`endTime`),
  KEY `schedule_creator` (`createdByUserId`),
  CONSTRAINT `schedule_creator` FOREIGN KEY (`createdByUserId`) REFERENCES `users` (`userId`),
  CONSTRAINT `schedule_times` CHECK (`startTime` < `endTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `equipment` (
  `equipmentId` INT NOT NULL AUTO_INCREMENT,
  `equipmentName` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `equipmentCondition` enum('GOOD','NEEDS_REPAIR','DAMAGED') NOT NULL,
  `availabilityStatus` enum('AVAILABLE','UNAVAILABLE','MAINTENANCE') NOT NULL,
  `dateAdded` date NOT NULL,
  `supplierId` INT DEFAULT NULL,
  PRIMARY KEY (`equipmentId`),
  KEY `equipment_supplier` (`supplierId`),
  CONSTRAINT `equipment_supplier` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`supplierId`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory` (
  `inventoryId` INT NOT NULL AUTO_INCREMENT,
  `equipmentId` INT NOT NULL,
  `quantity` INT NOT NULL,
  `lastUpdated` datetime NOT NULL,
  `updatedByUserId` INT NOT NULL,
  PRIMARY KEY (`inventoryId`),
  UNIQUE KEY `equipmentId` (`equipmentId`),
  KEY `inventory_updater` (`updatedByUserId`),
  CONSTRAINT `inventory_equipment` FOREIGN KEY (`equipmentId`) REFERENCES `equipment` (`equipmentId`) ON DELETE CASCADE,
  CONSTRAINT `inventory_updater` FOREIGN KEY (`updatedByUserId`) REFERENCES `users` (`userId`),
  CONSTRAINT `inventory_nonnegative` CHECK (`quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gym_bookings` (
  `bookingId` INT NOT NULL AUTO_INCREMENT,
  `memberId` INT NOT NULL,
  `activity` varchar(50) NOT NULL,
  `bookingDate` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `rejectionReason` varchar(500) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`bookingId`),
  KEY `booking_slot` (`bookingDate`,`status`,`startTime`,`endTime`),
  KEY `booking_member_slot` (`memberId`,`bookingDate`,`status`,`startTime`,`endTime`),
  CONSTRAINT `booking_member` FOREIGN KEY (`memberId`) REFERENCES `users` (`userId`),
  CONSTRAINT `booking_times` CHECK (`startTime` < `endTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `notificationId` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `scheduleId` INT DEFAULT NULL,
  `message` varchar(255) NOT NULL,
  `notificationType` varchar(50) NOT NULL,
  `dateSent` datetime NOT NULL,
  `deliveryStatus` enum('PENDING','SENT','READ') NOT NULL,
  PRIMARY KEY (`notificationId`),
  KEY `notification_recipient` (`userId`),
  KEY `notification_schedule` (`scheduleId`),
  CONSTRAINT `notification_recipient` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `notification_schedule` FOREIGN KEY (`scheduleId`) REFERENCES `gym_schedules` (`scheduleId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `migrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
