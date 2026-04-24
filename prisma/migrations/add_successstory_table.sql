-- Add successstory table for homepage success stories carousel
-- Run this SQL in your MySQL database (phpMyAdmin or MySQL client)

CREATE TABLE IF NOT EXISTS `successstory` (
  `id` VARCHAR(191) NOT NULL,
  `coupleName` VARCHAR(191) NOT NULL,
  `location` VARCHAR(191) NOT NULL,
  `story` TEXT NOT NULL,
  `imageUrl` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `successstory_isActive_sortOrder_idx` (`isActive`, `sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample stories
INSERT INTO `successstory` (`id`, `coupleName`, `location`, `story`, `imageUrl`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('story1', 'Priya & Arjun', 'Mumbai, India', 'We found each other on Vivah Dwar and got married last year. The matching algorithm was spot on!', NULL, 1, 1, NOW(), NOW()),
('story2', 'Sarah & James', 'London, UK', 'As an NRI, I was worried about finding the right match. Vivah Dwar made it so easy and safe.', NULL, 1, 2, NOW(), NOW()),
('story3', 'Fatima & Omar', 'Dubai, UAE', 'The verified profiles gave us confidence. We are now happily married for 2 years!', NULL, 1, 3, NOW(), NOW());
