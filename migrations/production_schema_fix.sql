-- Run in Hostinger phpMyAdmin AFTER INSERT/UPDATE privileges are restored.
-- See fix_db_permissions.sql for how to restore privileges via hPanel.

-- 1. Push notification subscriptions
CREATE TABLE IF NOT EXISTS `pushsubscription` (
  `id`        VARCHAR(191) NOT NULL,
  `userId`    VARCHAR(191) NOT NULL,
  `endpoint`  TEXT NOT NULL,
  `p256dh`    TEXT NOT NULL,
  `auth`      TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `pushsubscription_userId_idx` (`userId`),
  CONSTRAINT `pushsubscription_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Cashfree payments need PENDING status before payment completes
ALTER TABLE `subscription`
  MODIFY COLUMN `status` ENUM('ACTIVE','EXPIRED','CANCELLED','PENDING') NOT NULL DEFAULT 'ACTIVE';

-- 3. Dynamic plan names from planconfig (not fixed SILVER/GOLD/PLATINUM enum)
ALTER TABLE `subscription`
  MODIFY COLUMN `plan` VARCHAR(191) NOT NULL;
