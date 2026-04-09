-- AlterTable
ALTER TABLE `message` ADD COLUMN `locationExpiry` DATETIME(3) NULL,
    ADD COLUMN `locationType` VARCHAR(191) NULL;
