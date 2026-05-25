-- =============================================================================
-- FIX: INSERT command denied (ER_TABLEACCESS_DENIED_ERROR)
-- =============================================================================
--
-- ROOT CAUSE (confirmed):
--   DB user 'u707717625_vivahmilan' currently has ONLY:
--     SELECT, DELETE, DROP, ALTER, ...
--   MISSING: INSERT, UPDATE, CREATE
--
--   This breaks: payments, push notifications, registration, chat, etc.
--
-- ⚠️  YOU CANNOT FIX THIS WITH SQL ALONE on Hostinger shared hosting.
--     GRANT will fail with "Access denied". You MUST use Hostinger hPanel
--     or open a support ticket.
--
-- =============================================================================
-- STEP 1: Hostinger hPanel (try first)
-- =============================================================================
-- 1. Login → Websites → Dashboard → Databases → Management
-- 2. MySQL Databases → find user u707717625_vivahmilan
-- 3. Change Permissions / Reset user → ensure ALL PRIVILEGES on database
-- 4. Remote MySQL → add your VPS IP: 72.61.240.66
-- 5. Save and wait 2-5 minutes
--
-- =============================================================================
-- STEP 2: Hostinger Support Ticket (if hPanel doesn't fix)
-- =============================================================================
-- Copy-paste this message:
--
--   Subject: Restore INSERT/UPDATE privileges for MySQL user
--
--   Hello,
--   My database user u707717625_vivahmilan on database u707717625_vivahmilan
--   lost INSERT and UPDATE permissions. SHOW GRANTS shows only SELECT, DELETE
--   but no INSERT or UPDATE. My app on IP 72.61.240.66 cannot write to tables
--   (subscription, pushsubscription, user, etc.).
--   Please restore full read/write privileges (SELECT, INSERT, UPDATE, DELETE)
--   for this user from remote IP 72.61.240.66.
--   Thank you.
--
-- =============================================================================
-- STEP 3: After permissions restored — run these in phpMyAdmin SQL tab
-- =============================================================================

-- 3a. Create pushsubscription table if missing
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

-- 3b. Add PENDING status to subscription (required for Cashfree payments)
ALTER TABLE `subscription`
  MODIFY COLUMN `status` ENUM('ACTIVE','EXPIRED','CANCELLED','PENDING') NOT NULL DEFAULT 'ACTIVE';

-- 3c. Allow any plan name string (not just SILVER/GOLD/PLATINUM enum)
ALTER TABLE `subscription`
  MODIFY COLUMN `plan` VARCHAR(191) NOT NULL;

-- =============================================================================
-- STEP 4: Verify permissions restored
-- =============================================================================
-- Run on server after Hostinger fix:
--   node scripts/test-db-insert-perms.mjs
--
-- All three should show ✅ INSERT OK: user, subscription, pushsubscription
--
-- Or test in phpMyAdmin:
--   SHOW GRANTS FOR 'u707717625_vivahmilan'@'%';
--   (must include INSERT and UPDATE)
