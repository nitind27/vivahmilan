-- Feature tables for profile views settings, referrals, saved searches, admin notes
CREATE TABLE IF NOT EXISTS savedsearch (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  filters TEXT NOT NULL,
  alertEnabled TINYINT(1) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_savedsearch_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS adminnote (
  id VARCHAR(191) PRIMARY KEY,
  targetUserId VARCHAR(191) NOT NULL,
  adminId VARCHAR(191) NOT NULL,
  adminName VARCHAR(191) NULL,
  note TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_adminnote_target (targetUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS userpreference (
  userId VARCHAR(191) PRIMARY KEY,
  notifyInterest TINYINT(1) DEFAULT 1,
  notifyMessage TINYINT(1) DEFAULT 1,
  notifyProfileView TINYINT(1) DEFAULT 1,
  notifyMarketing TINYINT(1) DEFAULT 0,
  profileVisible TINYINT(1) DEFAULT 1,
  showOnlineStatus TINYINT(1) DEFAULT 1,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS userreferral (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL UNIQUE,
  referralCode VARCHAR(191) NOT NULL UNIQUE,
  referredByUserId VARCHAR(191) NULL,
  totalReferrals INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userreferral_code (referralCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
