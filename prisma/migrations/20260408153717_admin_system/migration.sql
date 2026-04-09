-- AlterTable
ALTER TABLE `user` ADD COLUMN `adminVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `loginOtpEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `premiumPlan` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `PlanConfig` (
    `id` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `durationDays` INTEGER NOT NULL DEFAULT 30,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `permissions` TEXT NOT NULL,
    `description` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PlanConfig_plan_key`(`plan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
