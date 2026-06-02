-- ═══════════════════════════════════════════════════════════════════════════════
-- Profile Options Manager — table + seed instructions
-- Run on MySQL / MariaDB (phpMyAdmin, Hostinger, mysql CLI)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Create table (safe if already exists)
CREATE TABLE IF NOT EXISTS `profileoption` (
  `id` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `value` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL,
  `group` varchar(191) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProfileOption_category_value_key` (`category`,`value`),
  KEY `ProfileOption_category_isActive_idx` (`category`,`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Seed all options (religion, castes from casteData, education, etc.)
--    From project root — uses .env DATABASE_* credentials:
--
--    node prisma/seed-options.js
--
-- Or from Admin panel: Profile Options → "Restore default options"
--
-- 3) Verify:
--    SELECT category, COUNT(*) AS cnt FROM profileoption GROUP BY category ORDER BY category;
