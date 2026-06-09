-- FAQ items (admin-managed, shown on blog & help pages)
CREATE TABLE IF NOT EXISTS `faqitem` (
  `id` VARCHAR(191) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'General',
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `icon` VARCHAR(50) NULL DEFAULT 'HelpCircle',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `showOnBlog` TINYINT(1) NOT NULL DEFAULT 1,
  `showOnHelp` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `faqitem_active_idx` (`isActive`, `sortOrder`),
  KEY `faqitem_blog_idx` (`showOnBlog`, `isActive`),
  KEY `faqitem_help_idx` (`showOnHelp`, `isActive`),
  KEY `faqitem_category_idx` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- About page content
CREATE TABLE IF NOT EXISTS `about_setting` (
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `about_value` (
  `id` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Heart',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `about_value_sort_idx` (`isActive`, `sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `about_milestone` (
  `id` VARCHAR(191) NOT NULL,
  `year` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `about_milestone_sort_idx` (`isActive`, `sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
