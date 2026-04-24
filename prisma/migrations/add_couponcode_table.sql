-- Add couponcode table for discount coupons
-- Run this SQL in your MySQL database (phpMyAdmin or MySQL client)

CREATE TABLE IF NOT EXISTS `couponcode` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `discountPct` INT NOT NULL,
  `maxUses` INT NOT NULL,
  `usedCount` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `expiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `couponcode_code_key` (`code`),
  KEY `couponcode_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
