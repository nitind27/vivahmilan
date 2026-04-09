/*
  Warnings:

  - You are about to alter the column `manglik` on the `profile` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `profile` ADD COLUMN `amritdhari` VARCHAR(191) NULL,
    ADD COLUMN `gotra` VARCHAR(191) NULL,
    ADD COLUMN `kundliMatch` VARCHAR(191) NULL DEFAULT 'Not Required',
    ADD COLUMN `nakshatra` VARCHAR(191) NULL,
    ADD COLUMN `sect` VARCHAR(191) NULL,
    ADD COLUMN `subCaste` VARCHAR(191) NULL,
    MODIFY `manglik` VARCHAR(191) NULL DEFAULT 'No';
