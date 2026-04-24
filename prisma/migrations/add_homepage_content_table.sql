-- Homepage content tables for admin-managed dynamic homepage
-- Run this SQL in your MySQL database

-- ── Hero Slides ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `homepage_slide` (
  `id` VARCHAR(191) NOT NULL,
  `tag` VARCHAR(255) NOT NULL DEFAULT '',
  `headline` VARCHAR(255) NOT NULL DEFAULT '',
  `highlight` VARCHAR(255) NOT NULL DEFAULT '',
  `sub` TEXT NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Stats ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `homepage_stat` (
  `id` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(64) NOT NULL DEFAULT 'Heart',
  `value` INT NOT NULL DEFAULT 0,
  `suffix` VARCHAR(32) NOT NULL DEFAULT '',
  `label` VARCHAR(128) NOT NULL DEFAULT '',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Features ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `homepage_feature` (
  `id` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(64) NOT NULL DEFAULT 'Heart',
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `desc` TEXT NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed default slides ───────────────────────────────────────────────────────
INSERT IGNORE INTO `homepage_slide` (`id`, `tag`, `headline`, `highlight`, `sub`, `sortOrder`, `isActive`) VALUES
('slide1', '💑 5M+ Happy Couples', 'Find Your', 'Perfect Match', 'Join 20M+ members and discover your soulmate across 150+ countries with smart AI matching.', 1, 1),
('slide2', '✅ 100% Verified Profiles', 'Verified &', 'Trusted Profiles', 'Every profile is manually verified by our team. Your safety and authenticity is our priority.', 2, 1),
('slide3', '🌍 150+ Countries', 'Love Knows', 'No Boundaries', 'NRI, Hindu, Muslim, Christian — find your perfect partner regardless of location or religion.', 3, 1);

-- ── Seed default stats ────────────────────────────────────────────────────────
INSERT IGNORE INTO `homepage_stat` (`id`, `icon`, `value`, `suffix`, `label`, `sortOrder`, `isActive`) VALUES
('stat1', 'Users', 20, 'M+', 'Members', 1, 1),
('stat2', 'Heart', 5, 'M+', 'Happy Couples', 2, 1),
('stat3', 'Globe', 150, '+', 'Countries', 3, 1),
('stat4', 'Award', 98, '%', 'Success Rate', 4, 1);

-- ── Seed default features ─────────────────────────────────────────────────────
INSERT IGNORE INTO `homepage_feature` (`id`, `icon`, `title`, `desc`, `sortOrder`, `isActive`) VALUES
('feat1', 'Search', 'Smart Matching', 'AI-powered recommendations based on your preferences and compatibility.', 1, 1),
('feat2', 'Shield', 'Verified Profiles', 'Every profile is manually verified to ensure authenticity and safety.', 2, 1),
('feat3', 'Globe', 'Global Reach', 'Find your partner from 150+ countries with location-based search.', 3, 1),
('feat4', 'Heart', 'Real Connections', 'Meaningful conversations with interest-based chat system.', 4, 1);
